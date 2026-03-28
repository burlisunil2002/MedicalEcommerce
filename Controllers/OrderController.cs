using DocumentFormat.OpenXml.Drawing.Charts;
using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using Rotativa.AspNetCore;
using System.Security.Cryptography;
using System.Text;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.ViewModels;


namespace VivekMedicalProducts.Controllers
{
    [Authorize]
    public class OrderController : Controller
    {
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;
        private readonly InvoiceService _invoiceService;
        private readonly EmailService _emailService;

        public OrderController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext, InvoiceService invoiceService, EmailService emailService)
        {
            _config = config;
            _context = context;
            _userContext = userContext;
            _invoiceService = invoiceService;
            _emailService = emailService;
        }

        // ================= CART TOTAL =================
        private (decimal subtotal, decimal gst, decimal total) CalculateCartTotal(string userId)
        {
            var carts = _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToList();

            decimal subtotal = 0m;
            decimal gst = 0m;

            foreach (var c in carts)
            {
                decimal price = c.Product?.Price ?? 0m;
                decimal gstPercent = c.Product?.GSTPercentage ?? 0m;

                decimal net = price * c.Quantity;

                // ✅ FIX: use 100m
                decimal gstAmount = net * (gstPercent / 100m);

                subtotal += net;
                gst += gstAmount;
            }

            decimal total = subtotal + gst;

            // ✅ Round only at final stage
            return (subtotal, gst, Math.Round(total, 2));
        }

        // ================= REVIEW POST =================
        [HttpPost]
        public IActionResult Review(CheckoutViewModel model)
        {
            if (model == null || !ModelState.IsValid)
            {
                TempData["Error"] = "Invalid address details";
                return RedirectToAction(nameof(Review));
            }

            HttpContext.Session.SetString("Address", JsonConvert.SerializeObject(model));
            return RedirectToAction(nameof(Review));
        }

        // ================= REVIEW GET =================
        // ✅ REVIEW GET (SAFE)
        [HttpGet]
        public IActionResult Review()
        {
            try
            {
                var userId = _userContext.GetUserId();

                var carts = _context.Carts
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId)
                    .ToList();

                if (!carts.Any())
                    return RedirectToAction("Index", "Cart");

                var totals = CalculateCartTotal(userId);

                var addressJson = HttpContext.Session.GetString("Address");

                CheckoutViewModel address = string.IsNullOrEmpty(addressJson)
                    ? new CheckoutViewModel()
                    : JsonConvert.DeserializeObject<CheckoutViewModel>(addressJson)!;

                ViewBag.Carts = carts;
                ViewBag.Total = totals.total;
                ViewBag.Address = address;
                ViewBag.RazorpayKey = _config["Razorpay:Key"];

                return View();
            }
            catch (Exception ex)
            {
                Console.WriteLine("REVIEW ERROR: " + ex.Message);
                return RedirectToAction("Index", "Cart");
            }
        }

        // ================= CREATE ORDER =================
        [HttpPost]
        public IActionResult CreateOrder([FromBody] CheckoutViewModel model)
        {
            OrderModel? order = null;

            try
            {
                var userId = _userContext.GetUserId();

                // ✅ VALIDATION
                if (model == null ||
                    string.IsNullOrWhiteSpace(model.FullName) ||
                    string.IsNullOrWhiteSpace(model.PhoneNumber) ||
                    string.IsNullOrWhiteSpace(model.Address) ||
                    string.IsNullOrWhiteSpace(model.City) ||
                    string.IsNullOrWhiteSpace(model.Pincode))
                {
                    return Json(new { success = false, message = "Please fill all address fields" });
                }

                // ✅ FETCH CART
                var carts = _context.Carts
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId)
                    .ToList();

                if (!carts.Any())
                    return Json(new { success = false, message = "Cart is empty" });

                // ✅ CALCULATE TOTAL
                var totals = CalculateCartTotal(userId);
                var amountInPaise = (int)(totals.total * 100);
                

                // ================= CREATE ORDER =================
                order = new OrderModel
                {
                    UserId = userId,
                    OrderNumber = "ORD-" + DateTime.UtcNow.Ticks,
                    OrderDate = DateTime.UtcNow,

                    FullName = model.FullName,
                    PhoneNumber = model.PhoneNumber,
                    Address = model.Address,
                    City = model.City,
                    Pincode = model.Pincode,

                    SubTotal = totals.subtotal,
                    GST = totals.gst,
                    GrandTotal = totals.total,

                    PaymentStatus = "Created",
                    OrderStatus = "Pending",
                    IsPaymentVerified = false,

                    CreatedBy = userId
                };

                _context.Orders.Add(order);
                _context.SaveChanges();

                // ================= SAVE ORDER ITEMS (🔥 FULL FIX) =================
                var orderItems = carts.Select(c =>
                {
                    var price = c.Product.Price;
                    var gstPercent = c.Product.GSTPercentage;
                    var quantity = c.Quantity;

                    var lineTotal = price * quantity;
                    var gstAmount = lineTotal * (gstPercent / 100);
                    var finalLineTotal = Math.Round(lineTotal + gstAmount, 2);

                    return new OrderItemModel
                    {
                        OrderId = order.OrderId,
                        ProductId = c.ProductId,

                        ProductName = c.Product.Name,      // ✅ snapshot
                        Quantity = quantity,

                        Price = price,
                        GSTPercentage = gstPercent,

                        LineTotal = finalLineTotal,        // ✅ important

                        ItemStatus = "Pending"
                    };
                }).ToList();

                _context.OrderItems.AddRange(orderItems);
                _context.SaveChanges();

                // ================= CREATE RAZORPAY ORDER =================
                var client = new RazorpayClient(
                    _config["Razorpay:Key"],
                    _config["Razorpay:Secret"]
                );

                var options = new Dictionary<string, object>
        {
            { "amount", amountInPaise },
            { "currency", "INR" },
            { "receipt", order.OrderNumber }
        };

                var razorOrder = client.Order.Create(options);

                order.RazorpayOrderId = razorOrder["id"].ToString();
                order.PaymentStatus = "Initiated";
                order.UpdatedAt = DateTime.UtcNow;

                _context.SaveChanges();

                return Json(new
                {
                    success = true,
                    orderId = order.OrderId,
                    razorpayOrderId = order.RazorpayOrderId,
                    amount = amountInPaise
                });
            }
            catch (Exception ex)
            {
                if (order != null)
                {
                    order.PaymentStatus = "Failed";
                    order.OrderStatus = "Failed";
                    order.FailureReason = ex.Message;
                    _context.SaveChanges();
                }

                return Json(new { success = false, message = "Order creation failed" });
            }
        }

        // ================= VERIFY PAYMENT =================
        [HttpPost]
        public async Task<IActionResult> VerifyPayment([FromBody] PaymentDto model)
        {
            try
            {
                if (model == null ||
                    string.IsNullOrEmpty(model.razorpay_order_id) ||
                    string.IsNullOrEmpty(model.razorpay_payment_id) ||
                    string.IsNullOrEmpty(model.razorpay_signature))
                {
                    return Json(new { success = false, message = "Invalid payment data" });
                }

                // 🔍 Try finding order using RazorpayOrderId
                var order = _context.Orders
                    .FirstOrDefault(o => o.RazorpayOrderId == model.razorpay_order_id);

                // 🔁 fallback using orderId (extra safety)
                if (order == null && model.orderId > 0)
                {
                    order = _context.Orders.Find(model.orderId);
                }

                if (order == null)
                    return Json(new { success = false, message = "Order not found" });

                // 🛡️ prevent duplicate verification
                if (order.IsPaymentVerified)
                    return Json(new { success = true, redirect = "/MyOrders" });

                var secret = _config["Razorpay:Secret"];

                var payload = $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                var generated = Convert.ToHexString(hash).ToLowerInvariant();

                // 🔒 signature validation
                if (generated != model.razorpay_signature)
                {
                    order.PaymentStatus = "Failed";
                    order.OrderStatus = "Failed";
                    order.FailureReason = "Signature mismatch";
                    _context.SaveChangesAsync();

                    return Json(new { success = false, message = "Verification failed" });
                }

                // ✅ SUCCESS
                order.PaymentStatus = "Completed";
                order.OrderStatus = "Confirmed";
                order.IsPaymentVerified = true;
                order.RazorpayPaymentId = model.razorpay_payment_id;
                order.RazorpaySignature = model.razorpay_signature;
                order.PaymentVerifiedAt = DateTime.UtcNow;

                _context.SaveChangesAsync();

                if (order.PaymentStatus == "Completed" && order.OrderStatus == "Confirmed")
                {
                    await SendInvoiceEmailAsync(order.OrderId);
                }

                ClearCart(order.UserId);

                return Json(new
                {
                    success = true,
                    redirect = "/MyOrders"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // ================= PAYMENT FAILED =================
        [HttpPost]
        public IActionResult PaymentFailed([FromBody] int orderId)
        {
            var order = _context.Orders.Find(orderId);

            if (order != null)
            {
                order.PaymentStatus = "Failed";
                order.OrderStatus = "Failed";
                order.UpdatedAt = DateTime.UtcNow;

                _context.SaveChanges();
            }

            return Json(new { success = true });
        }

        // ================= WEBHOOK =================
        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> RazorpayWebhook()
        {
            try
            {
                var secret = _config["Razorpay:WebhookSecret"];
                if (string.IsNullOrEmpty(secret))
                    return Unauthorized();

                string body;
                using (var reader = new StreamReader(Request.Body))
                {
                    body = await reader.ReadToEndAsync();
                }

                var receivedSignature = Request.Headers["X-Razorpay-Signature"];

                var expectedSignature = ComputeHmac(body, secret);

                if (!CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(expectedSignature),
                        Encoding.UTF8.GetBytes(receivedSignature)))
                    return Unauthorized();

                dynamic data = JsonConvert.DeserializeObject(body)!;
                string eventType = data.@event;

                string razorpayOrderId = data?.payload?.payment?.entity?.order_id;

                var order = _context.Orders
                    .FirstOrDefault(o => o.RazorpayOrderId == razorpayOrderId);

                if (order == null || order.IsPaymentVerified)
                    return Ok();

                if (eventType == "payment.captured")
                {
                    order.PaymentStatus = "Completed";
                    order.OrderStatus = "Confirmed";
                    order.IsPaymentVerified = true;
                    order.PaymentVerifiedAt = DateTime.UtcNow;

                    _context.SaveChanges();
                    ClearCart(order.UserId);
                }

                return Ok();
            }
            catch
            {
                return Ok(); // prevent retry storm
            }
        }

        // ================= HELPERS =================
        private void ClearCart(string userId)
        {
            var items = _context.Carts.Where(c => c.UserId == userId).ToList();
            _context.Carts.RemoveRange(items);
            _context.SaveChanges();
        }

        private string ComputeHmac(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        [HttpGet]
        public async Task<IActionResult> MyOrders()
        {
            var userId = _userContext.GetUserId();

            Console.WriteLine("USER ID: " + userId);

            var orders = await _context.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Product)
                .Where(i => i.Order.UserId == userId)
                .OrderByDescending(i => i.Order.OrderDate)
                .Select(i => new MyOrderViewModel
                {
                    OrderId = i.OrderId,
                    OrderDate = i.Order.OrderDate,

                    ProductName = i.Product.Name,
                    ProductImage = i.Product.ImagePath,
                    Quantity = i.Quantity,

                    Total = i.Order.GrandTotal,
                    ItemStatus = i.Order.OrderStatus,      // ✅ important
                    PaymentStatus = i.Order.PaymentStatus  // ✅ important
                })
                .ToListAsync();

            Console.WriteLine("ORDERS COUNT: " + orders.Count);

            return View(orders);
        }

        public IActionResult Invoice(int id)
        {
            var userId = _userContext.GetUserId();

            var order = _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefault(o => o.OrderId == id && o.UserId == userId);

            if (order == null)
                return NotFound();

            // 🔒 SECURITY CHECK
            if (order.PaymentStatus != "Completed" || order.OrderStatus != "Confirmed")
            {
                TempData["Error"] = "Invoice will be available after delivery.";
                return RedirectToAction("MyOrders");
            }

            var model = BuildInvoiceModel(order);

            return View(model);
        }

        public async Task SendInvoiceEmailAsync(int orderId)
        {
            var order = _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefault(o => o.OrderId == orderId);

            var model = BuildInvoiceModel(order);

            var pdfBytes = await GenerateInvoicePdf(model, ControllerContext);

            await _emailService.SendEmailWithAttachmentAsync(
                order.Email,
                "Your Invoice",
                "Please find your invoice attached.",
                pdfBytes,
                $"Invoice-{order.OrderNumber}.pdf"
            );
        }

        public async Task<byte[]> GenerateInvoicePdf(OrderInvoiceViewModel model, ControllerContext context)
        {
            var pdf = new ViewAsPdf("Invoice", model);

            return await pdf.BuildFile(context); // ✅ FIXED
        }

        private OrderInvoiceViewModel BuildInvoiceModel(OrderModel order)
        {
            return new OrderInvoiceViewModel
            {
                // 🔢 BASIC INFO
                OrderId = order.OrderId,
                InvoiceNumber = $"INV-{order.OrderNumber}",
                Date = order.OrderDate,

                // 👤 CUSTOMER
                CustomerName = order.FullName,
                Address = order.Address,
                City = order.City,
                Pincode = order.Pincode,
                Phone = order.PhoneNumber,

                // 🏢 COMPANY
                CompanyName = "Sunil Medical Products",
                CompanyGST = "37ABCDE1234F1Z5",
                CompanyAddress = "Visakhapatnam, Andhra Pradesh",
                CompanyPhone = "9876543210",

                // 💰 TOTALS
                SubTotal = order.SubTotal,
                GSTTotal = order.GST,
                GrandTotal = order.GrandTotal,

                // 📦 ITEMS
                Items = order.OrderItems?.Select(item =>
                {
                    decimal net = item.Price * item.Quantity;
                    decimal gstAmount = item.LineTotal - net;

                    return new InvoiceItemViewModel
                    {
                        ProductName = item.ProductName,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        GSTPercentage = item.GSTPercentage,
                        GSTAmount = gstAmount,
                        Total = item.LineTotal
                    };
                }).ToList() ?? new List<InvoiceItemViewModel>()
            };
        }

    }
}