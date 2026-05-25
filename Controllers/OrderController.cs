using DocumentFormat.OpenXml.Drawing.Charts;
using DocumentFormat.OpenXml.InkML;
using DocumentFormat.OpenXml.Spreadsheet;
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

        private string GetOrCreateGuestId()
        {
            if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
                || string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

                Response.Cookies.Append("guest_id", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true, // 🔥 important for production
                    SameSite = SameSiteMode.Lax,
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(7)
                });
            }

            return guestId;
        }


        [HttpPost]
        public async Task<IActionResult> PlaceCOD()
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return Json(new { success = false, redirect = "/Account/Login" });

            var carts = await _context.Carts
                .Include(c => c.ProductVariant)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            if (!carts.Any())
                return Json(new { success = false });

            var address = JsonConvert.DeserializeObject<CheckoutViewModel>(
                HttpContext.Session.GetString("Address"));

            var grouped = carts.GroupBy(c => c.Product.SellerId);

            foreach (var group in grouped)
            {
                if (group.Key == null || group.Key == 0)
                    continue; // skip invalid

                var sellerExists = _context.Sellers.Any(s => s.SellerId == group.Key);

                if (!sellerExists)
                    throw new Exception("Seller not found in DB");

                // ✅ seller-specific total
                var subtotal = group.Sum(x => x.ProductVariant.Price * x.Quantity);

                var order = new OrderModel
                {
                    UserId = userId,
                    SellerId = group.Key.Value,

                    FullName = address.FullName,
                    PhoneNumber = address.PhoneNumber,
                    Address = address.Address,
                    City = address.City,
                    Pincode = address.Pincode,

                    SubTotal = subtotal,
                    GST = subtotal * 0.18m,
                    GrandTotal = subtotal * 1.18m,

                    PaymentStatus = "Pending",
                    OrderStatus = "Confirmed",
                    OrderDate = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var item in group)
                {
                    _context.OrderItems.Add(new OrderItemModel
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        ProductName = item.Product.Name,
                        Quantity = item.Quantity,
                        Price = item.ProductVariant.Price,
                        SellerId = item.SellerId, // 🔥 ADD THIS
                    });
                }

                await _context.SaveChangesAsync();
            }

            // ✅ return AFTER loop
            _context.Carts.RemoveRange(carts);
            await _context.SaveChangesAsync();

            return Json(new { success = true, redirect = "/Order/MyOrders" });
        }



        // ================= CREATE ORDER =================
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CheckoutViewModel model)
        {
            try
            {
                var userId = _userContext.GetUserId();

                var carts = await _context.Carts
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId)
                    .ToListAsync();

                if (!carts.Any())
                    return Json(new { success = false });

                var grouped = carts.GroupBy(c => c.Product.SellerId);

                var createdOrders = new List<OrderModel>();

                foreach (var group in grouped)
                {
                    if (group.Key == null || group.Key == 0)
                        continue; // skip invalid

                    var sellerExists = _context.Sellers.Any(s => s.SellerId == group.Key);

                    if (!sellerExists)
                        throw new Exception("Seller not found in DB");


                    var subtotal = group.Sum(x => x.ProductVariant.Price * x.Quantity);
                    var grandTotal = subtotal * 1.18m;


                    var order = new OrderModel
                    {
                        UserId = userId,
                        SellerId = group.Key.Value,

                        OrderNumber = "ORD-" + DateTime.UtcNow.Ticks,
                        OrderDate = DateTime.UtcNow,

                        FullName = model.FullName,
                        PhoneNumber = model.PhoneNumber,
                        Address = model.Address,
                        City = model.City,
                        Pincode = model.Pincode,

                        SubTotal = subtotal,
                        GST = subtotal * 0.18m,
                        GrandTotal = grandTotal,

                        PaymentStatus = "Initiated",
                        OrderStatus = "Pending"
                    };

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();

                    foreach (var item in group)
                    {
                        _context.OrderItems.Add(new OrderItemModel
                        {
                            OrderId = order.OrderId,
                            ProductVariantId = item.ProductVariantId,
                            ProductName = item.Product.Name,
                            Quantity = item.Quantity,
                            Price = item.ProductVariant.Price,
                            SellerId = item.Product.SellerId   // 🔥 ADD THIS
                        });
                    }

                    await _context.SaveChangesAsync();

                    createdOrders.Add(order);
                }

                // 🔥 create Razorpay for FIRST order (or combine later)
                var firstOrder = createdOrders.First();

                var client = new RazorpayClient(
                    _config["Razorpay:Key"],
                    _config["Razorpay:Secret"]
                );

                var amountInPaise = (int)(firstOrder.GrandTotal * 100);

                var razorOrder = client.Order.Create(new Dictionary<string, object>
        {
            { "amount", amountInPaise },
            { "currency", "INR" },
            { "receipt", firstOrder.OrderNumber }
        });

                firstOrder.RazorpayOrderId = razorOrder["id"].ToString();
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    orderId = firstOrder.OrderId,
                    razorpayOrderId = firstOrder.RazorpayOrderId,
                    amount = amountInPaise,
                    razorpayKey = _config["Razorpay:Key"]
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
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
            var order = _context.Orders
                .FirstOrDefault(x => x.OrderId == orderId);

            if (order == null)
            {
                return Json(new
                {
                    success = false
                });
            }

            return Json(new
            {
                success = order.IsPaymentVerified,
                paymentStatus = order.PaymentStatus,
                orderStatus = order.OrderStatus
            });
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
                    ProductId = i.ProductId,

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

        public static string GetDisplayName(ApplicationUser user)
        {
            if (user == null) return "Unknown";

            return !string.IsNullOrEmpty(user.CustomerName)
                ? user.CustomerName
                : user.UserName;
        }

        public async Task<IActionResult> AdminOrders(string search = "")
        {
            var isAdmin = User.IsInRole("Admin");

            int sellerId = 0;

            if (!isAdmin)
            {
                var userId = _userContext.GetUserId();

                var seller = _context.Sellers
                    .FirstOrDefault(s => s.UserId == userId);

                if (seller == null)
                    return RedirectToAction("SellerLogin", "Seller");

                // 🔥 SUBSCRIPTION CHECK
                if (seller.SubscriptionEndDate == null ||
                    seller.SubscriptionEndDate < DateTime.UtcNow)
                {
                    TempData["ErrorMessage"] = "Your subscription expired. Please upgrade.";
                    return RedirectToAction("Index", "Subscription");
                }

                sellerId = seller.SellerId;

                // 🔥 for layout
                ViewBag.sellerName = seller.BusinessName;
                ViewBag.IsSubscribed = true;
            }
            else
            {
                ViewBag.sellerName = "Admin";
                ViewBag.IsSubscribed = true;
            }

            var query = from i in _context.OrderItems
                        join o in _context.Orders on i.OrderId equals o.OrderId
                        join p in _context.Products on i.ProductId equals p.Id
                        join u in _context.Users on o.UserId equals u.Id
                        where isAdmin || i.SellerId == sellerId
                        select new AdminOrderModel
                        {
                            OrderId = o.OrderId,
                            OrderItemId = i.OrderItemId,
                            OrderDate = o.OrderDate,
                            Customer = !string.IsNullOrEmpty(u.CustomerName)
                                        ? u.CustomerName
                                        : u.UserName,
                            ProductName = p.Name,
                            Quantity = i.Quantity,
                            GrandTotal = o.GrandTotal,
                            RazorpayPaymentId = o.RazorpayPaymentId ?? "-",
                            PaymentStatus = o.PaymentStatus ?? "Pending",
                            OrderStatus = o.OrderStatus
                        };

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();

                query = query.Where(x =>
                    x.ProductName.ToLower().Contains(search) ||
                    x.Customer.ToLower().Contains(search) ||
                    x.OrderId.ToString().Contains(search)
                );
            }

            var orders = await query
                .OrderByDescending(x => x.OrderDate)
                .ToListAsync();

            ViewBag.TotalOrders = orders.Count;
            ViewBag.Completed = orders.Count(x => x.PaymentStatus == "Completed");
            ViewBag.Pending = orders.Count(x => x.PaymentStatus == "Pending");

            return View(orders);
        }

        // =========================
        // UPDATE ORDER
        // =========================

        [HttpPost]
        public async Task<IActionResult> UpdateOrder([FromBody] OrderModel model)
        {
            if (model == null || model.OrderId == 0)
                return Json(new { success = false, message = "Invalid request" });

            try
            {
                var isAdmin = User.IsInRole("Admin");

                var userId = _userContext.GetUserId();
                var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

                if (seller == null)
                    return Unauthorized();

                int sellerId = seller.SellerId;

                var order = await _context.Orders
                    .FirstOrDefaultAsync(x => x.OrderId == model.OrderId);

                if (order == null)
                    return Json(new { success = false, message = "Order not found" });

                // 🔥 SELLER SECURITY CHECK
                if (!isAdmin)
                {
                    var hasAccess = await _context.OrderItems
                        .AnyAsync(x => x.OrderId == model.OrderId && x.SellerId == sellerId);

                    if (!hasAccess)
                        return Unauthorized();
                }

                if (order.OrderStatus == model.OrderStatus)
                {
                    return Json(new { success = true, message = "No changes" });
                }

                order.OrderStatus = model.OrderStatus;
                order.OrderModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Order status updated successfully"
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =========================
        // ORDER DETAILS (MODAL)
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetOrderDetails(int id)
        {
            var isAdmin = User.IsInRole("Admin");

            var userId = _userContext.GetUserId();
            var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

            if (seller == null)
                return Unauthorized();

            int sellerId = seller.SellerId;

            // 🔥 SECURITY CHECK
            if (!isAdmin)
            {
                var hasAccess = await _context.OrderItems
                    .AnyAsync(x => x.OrderId == id && x.SellerId == sellerId);

                if (!hasAccess)
                    return Unauthorized();
            }

            var order = await (
                from o in _context.Orders
                join oi in _context.OrderItems
                    on o.OrderId equals oi.OrderId into orderItems
                from oi in orderItems.DefaultIfEmpty()
                where o.OrderId == id
                select new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.FullName,
                    o.PhoneNumber,
                    o.Address,
                    o.City,
                    o.Pincode,
                    Quantity = oi != null ? oi.Quantity : 0,
                    ItemStatus = oi != null ? oi.ItemStatus : "Pending"
                }
            ).FirstOrDefaultAsync();

            if (order == null)
                return Json(new { success = false });

            return Json(new { success = true, data = order });
        }

    }
}