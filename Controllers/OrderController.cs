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
        private readonly ICartCalculationService _calc;


        public OrderController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext, InvoiceService invoiceService, EmailService emailService, ICartCalculationService calc)
        {
            _config = config;
            _context = context;
            _userContext = userContext;
            _invoiceService = invoiceService;
            _emailService = emailService;
            _calc = calc;
        }

        private string GetGuestId()
        {
            return Request.Cookies["guest_id"];
        }


        [HttpPost]
        public async Task<IActionResult> PlaceCOD()
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return Json(new { success = false, redirect = "/Account/Login" });

            var guestId = GetGuestId();
            var coupon = HttpContext.Session.GetString("CouponCode");

            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            if (!carts.Any())
                return Json(new { success = false });

            // ✅ USE SERVICE
            var totals = await _calc.CalculateAsync(userId, guestId, coupon);

            var address = JsonConvert.DeserializeObject<CheckoutViewModel>(
                HttpContext.Session.GetString("Address"));

            var order = new OrderModel
            {
                UserId = userId,
                FullName = address.FullName,
                PhoneNumber = address.PhoneNumber,
                Address = address.Address,
                City = address.City,
                Pincode = address.Pincode,

                SubTotal = totals.Subtotal,
                GST = totals.GST,
                GrandTotal = totals.GrandTotal,

                PaymentStatus = "Pending",
                OrderStatus = "Confirmed",
                OrderDate = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            foreach (var item in carts)
            {
                _context.OrderItems.Add(new OrderItemModel
                {
                    OrderId = order.OrderId,
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    Quantity = item.Quantity,
                    Price = item.Product.Price
                });
            }

            await _context.SaveChangesAsync();

            _context.Carts.RemoveRange(carts);
            await _context.SaveChangesAsync();

            return Json(new { success = true, redirect = "/Order/MyOrders" });
        }



        // ================= CREATE ORDER =================
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CheckoutViewModel model)
        {
            OrderModel? order = null;

            try
            {
                var userId = _userContext.GetUserId();
                var guestId = GetGuestId();
                var coupon = HttpContext.Session.GetString("CouponCode");

                if (model == null ||
                    string.IsNullOrWhiteSpace(model.FullName) ||
                    string.IsNullOrWhiteSpace(model.PhoneNumber) ||
                    string.IsNullOrWhiteSpace(model.Address) ||
                    string.IsNullOrWhiteSpace(model.City) ||
                    string.IsNullOrWhiteSpace(model.Pincode))
                {
                    return Json(new { success = false, message = "Please fill all address fields" });
                }

                var carts = await _context.Carts
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId)
                    .ToListAsync();

                if (!carts.Any())
                    return Json(new { success = false, message = "Cart is empty" });

                // ✅ USE CALC SERVICE ONLY
                var totals = await _calc.CalculateAsync(userId, guestId, coupon);
                var amountInPaise = (int)(totals.GrandTotal * 100);

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

                    SubTotal = totals.Subtotal,
                    GST = totals.GST,
                    GrandTotal = totals.GrandTotal,

                    PaymentStatus = "Initiated",
                    OrderStatus = "Pending",
                    IsPaymentVerified = false,

                    CreatedBy = userId
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // ✅ SAVE ITEMS (NO CALCULATION LOGIC HERE)
                foreach (var item in carts)
                {
                    _context.OrderItems.Add(new OrderItemModel
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        ProductName = item.Product.Name,
                        Quantity = item.Quantity,
                        Price = item.Product.Price,   // raw price only
                        ItemStatus = "Pending"
                    });
                }

                await _context.SaveChangesAsync();

                // ✅ RAZORPAY ORDER
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
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

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
                    await _context.SaveChangesAsync();
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
                   await _context.SaveChangesAsync();

                    return Json(new { success = false, message = "Verification failed" });
                }

                // ✅ SUCCESS
                order.PaymentStatus = "Completed";
                order.OrderStatus = "Confirmed";
                order.IsPaymentVerified = true;
                order.RazorpayPaymentId = model.razorpay_payment_id;
                order.RazorpaySignature = model.razorpay_signature;
                order.PaymentVerifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 🔥 CLEAR CART (SAFE)
                var cartItems = await _context.Carts
                    .Where(c => c.UserId == order.UserId)
                    .ToListAsync();

                _context.Carts.RemoveRange(cartItems);
                await _context.SaveChangesAsync();

                await SendInvoiceEmailAsync(order.OrderId);
            

                return Json(new
                {
                    success = true,
                    redirect = "/Order/MyOrders"
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

                    await _context.SaveChangesAsync();

                    // 🔥 CLEAR CART SAFELY
                    var cartItems = await _context.Carts
                        .Where(c => c.UserId == order.UserId)
                        .ToListAsync();

                    _context.Carts.RemoveRange(cartItems);
                    await _context.SaveChangesAsync();

                    await SendInvoiceEmailAsync(order.OrderId);


                }

                return Ok();
            }
            catch
            {
                return Ok(); // prevent retry storm
            }
        }

        [HttpGet]
        public IActionResult CheckPaymentStatus(int orderId)
        {
            var order = _context.Orders.Find(orderId);

            if (order == null)
                return Json(new { success = false });

            if (order.IsPaymentVerified)
            {
                return Json(new { success = true });
            }

            return Json(new { success = false });
        }

        // ================= HELPERS =================

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

                    // 🔥 FIX: Use Cloudinary URL
                    ProductImage = string.IsNullOrEmpty(i.Product.ImageUrl)
                        ? "/images/no-image.png"   // fallback (optional)
                        : i.Product.ImageUrl,

                    Quantity = i.Quantity,

                    Total = i.Order.GrandTotal,

                    // ✅ statuses
                    OrderStatus = i.Order.OrderStatus,
                    PaymentStatus = i.Order.PaymentStatus
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
            model.IsPdf = true; // 👈 important

            var pdf = new ViewAsPdf("Invoice", model);

            return await pdf.BuildFile(context);
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

        public async Task<IActionResult> DownloadInvoice(int id)
        {
            var userId = _userContext.GetUserId();

            var order = _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefault(o => o.OrderId == id && o.UserId == userId);

            if (order == null)
                return NotFound();

            // 🔒 Security check
            if (order.PaymentStatus != "Completed" || order.OrderStatus != "Confirmed")
            {
                TempData["Error"] = "Invoice not available.";
                return RedirectToAction("MyOrders");
            }

            var model = BuildInvoiceModel(order);
            model.IsPdf = true;

            var pdfBytes = await GenerateInvoicePdf(model, ControllerContext);

            return File(
                pdfBytes,
                "application/pdf",
                $"Invoice-{order.OrderNumber}.pdf"
            );
        }

    }
}