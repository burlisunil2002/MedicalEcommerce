using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;
using static Org.BouncyCastle.Math.EC.ECCurve;

public class OrderController : Controller
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;


    public OrderController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext)

    {
        _config = config;
        _context = context;
        _userContext = userContext;
    }

    private (decimal subtotal, decimal gst, decimal total) CalculateCartTotal(string userId)
    {
        var carts = _context.Carts
            .Include(c => c.Product)
            .Where(c => c.UserId == userId || c.SessionId == userId)
            .ToList(); // 🔥 IMPORTANT: force in-memory calculation

        decimal subtotal = 0;

        foreach (var c in carts)
        {
            subtotal += (c.Product?.Price ?? 0) * c.Quantity;
        }

        decimal gst = 0;

        foreach (var c in carts)
        {
            gst += ((c.Product?.Price ?? 0) * c.Quantity) * ((c.Product?.GSTPercentage ?? 0) / 100m);
        }

        decimal total = subtotal + gst;

        total = Math.Round(total, 2);

        return (subtotal, gst, total);
    }

    [HttpPost]
    public IActionResult Review(CheckoutViewModel model)
    {
        var addressJson = JsonConvert.SerializeObject(model);
        HttpContext.Session.SetString("Address", addressJson);

        return RedirectToAction("Review");
    }

    [HttpGet]
    public IActionResult Review()
    {
        string userId = _userContext.GetUserId();

        var carts = _context.Carts
            .Include(c => c.Product)
            .Where(c => c.UserId == userId || c.SessionId == userId)
            .ToList();

        if (!carts.Any())
            return RedirectToAction("Index", "Cart");

        var totals = CalculateCartTotal(userId);

        var addressJson = HttpContext.Session.GetString("Address");

        OrderModel address = null;

        if (!string.IsNullOrEmpty(addressJson))
        {
            address = JsonConvert.DeserializeObject<OrderModel>(addressJson);
        }

        ViewBag.Carts = carts;
        ViewBag.Total = totals.total;
        ViewBag.Address = address;
        ViewBag.RazorpayKey = _config["Razorpay:Key"];

        return View();
    }
        [HttpPost]
        public IActionResult CreateOrder(CheckoutViewModel model)
        {
            string userId = _userContext.GetUserId();

            var carts = _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId || c.SessionId == userId)
                .ToList();

            if (!carts.Any())
                return BadRequest("Cart is empty");

            var totals = CalculateCartTotal(userId);
            var finalAmount = Math.Round(totals.total, 2);

            long amountInPaise = (long)(finalAmount * 100);

            var order = new OrderModel
            {
                UserId = userId,
                OrderNumber = "ORD-" + DateTime.Now.Ticks,
                SubTotal = totals.subtotal,
                GST = totals.gst,
                GrandTotal = finalAmount,
                OrderStatus = "Pending",
                PaymentStatus = "Created",
                // ✅ Shipping details
                FullName = model.FullName,
                PhoneNumber = model.PhoneNumber,
                Address = model.Address,
                City = model.City,
                Pincode = model.Pincode,
                OrderItems = new List<OrderItemModel>()
            };

            _context.Orders.Add(order);
            _context.SaveChanges();

            var client = new RazorpayClient(
                _config["Razorpay:Key"],
                _config["Razorpay:Secret"]
            );

            var options = new Dictionary<string, object>
        {
            { "amount", amountInPaise },   // paise
            { "currency", "INR" },
            { "receipt", order.OrderNumber }
        };

            var razorpayOrder = client.Order.Create(options);

            order.RazorpayOrderId = razorpayOrder["id"].ToString();
            order.PaymentStatus = "Initiated";
            _context.SaveChanges();

            return Json(new
            {
                amountInPaise = amountInPaise,              // ✅ send paise explicitly
                displayAmount = finalAmount,                // ✅ rupees for UI
                razorpayOrderId = razorpayOrder["id"],
                orderId = order.OrderId
            });
        }

    [HttpPost]
    public IActionResult VerifyPayment([FromBody] PaymentDto model)
    {
        Console.WriteLine("===== VERIFY PAYMENT START =====");

        if (model == null ||
            string.IsNullOrEmpty(model.razorpay_order_id) ||
            string.IsNullOrEmpty(model.razorpay_payment_id) ||
            string.IsNullOrEmpty(model.razorpay_signature))
        {
            Console.WriteLine("❌ Invalid request payload");
            return BadRequest(new { success = false, message = "Invalid payment data" });
        }

        var order = _context.Orders
            .FirstOrDefault(o => o.RazorpayOrderId == model.razorpay_order_id);

        if (order == null)
        {
            Console.WriteLine("❌ Order not found");
            return NotFound(new { success = false });
        }

        try
        {
            var secret = _config["Razorpay:Secret"];

            string payload = $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

            string generatedSignature;

            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                generatedSignature = Convert.ToHexString(hash).ToLower();
            }

            Console.WriteLine("===== DEBUG =====");
            Console.WriteLine($"Payload: {payload}");
            Console.WriteLine($"Generated: {generatedSignature}");
            Console.WriteLine($"Received: {model.razorpay_signature}");
            Console.WriteLine("=================");

            // 🔐 Constant-time comparison (production safe)
            if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(generatedSignature),
                Encoding.UTF8.GetBytes(model.razorpay_signature)))
            {
                Console.WriteLine("❌ SIGNATURE MISMATCH");

                order.PaymentStatus = "Failed";
                order.OrderStatus = "Failed";
                order.IsPaymentVerified = false;

                _context.SaveChanges();

                return Json(new { success = false });
            }

            // ✅ SUCCESS
            Console.WriteLine("✅ PAYMENT VERIFIED");

            order.PaymentStatus = "Completed";
            order.OrderStatus = "Confirmed";
            order.IsPaymentVerified = true;
            order.RazorpayPaymentId = model.razorpay_payment_id;
            order.RazorpaySignature = model.razorpay_signature;
            order.PaymentVerifiedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Json(new { success = true, redirectUrl = "/MyOrders" });
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ ERROR: " + ex.Message);
            return StatusCode(500, new { success = false });
        }
    }

    private bool SlowEquals(string a, string b)
    {
        if (a.Length != b.Length) return false;

        int result = 0;
        for (int i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }

        return result == 0;
    }

    [HttpPost]
    public IActionResult RazorpayWebhook()
    {
        Console.WriteLine("========= WEBHOOK RECEIVED =========");

        var secret = _config["Razorpay:WebhookSecret"];

        using (var reader = new StreamReader(Request.Body))
        {
            var body = reader.ReadToEnd();

            Console.WriteLine("Webhook Body: " + body);

            var receivedSignature = Request.Headers["X-Razorpay-Signature"];

            Console.WriteLine("Webhook Signature: " + receivedSignature);

            var expectedSignature = ComputeHmacSha256(body, secret);

            Console.WriteLine("Expected Signature: " + expectedSignature);

            if (expectedSignature != receivedSignature)
            {
                Console.WriteLine("❌ WEBHOOK SIGNATURE FAILED");
                return Unauthorized();
            }

            Console.WriteLine("✅ WEBHOOK VERIFIED");

            dynamic data = JsonConvert.DeserializeObject(body);

            string eventType = data.@event;
            Console.WriteLine("Event Type: " + eventType);

            if (eventType == "payment.captured")
            {
                string paymentId = data.payload.payment.entity.id;
                string orderId = data.payload.payment.entity.order_id;

                Console.WriteLine("PaymentId: " + paymentId);
                Console.WriteLine("OrderId: " + orderId);

                var order = _context.Orders
                    .FirstOrDefault(o => o.RazorpayOrderId == orderId);

                if (order != null)
                {
                    Console.WriteLine("✅ ORDER FOUND FOR WEBHOOK");

                    order.PaymentStatus = "Completed";
                    order.OrderStatus = "Confirmed";
                    order.RazorpayPaymentId = paymentId;
                    order.IsPaymentVerified = true;
                    order.PaymentVerifiedAt = DateTime.UtcNow;

                    // ✅ ADD THIS (important for consistency)
                    order.RazorpaySignature = "webhook_verified";

                    _context.SaveChanges();

                    Console.WriteLine("✅ ORDER UPDATED FROM WEBHOOK");
                }
                else
                {
                    Console.WriteLine("❌ ORDER NOT FOUND IN WEBHOOK");
                }
            }
        }

        return Ok();
    }

    [HttpPost]
    public IActionResult PaymentFailed([FromBody] dynamic data)
    {
        int orderId = data.orderId;

        var order = _context.Orders.Find(orderId);

        if (order != null)
        {
            order.PaymentStatus = "Failed";
            order.FailureReason = data.reason;

            _context.SaveChanges();
        }

        return Ok();
    }


    public IActionResult Failed()
    {
        return View();
    }

    private string ComputeHmacSha256(string data, string key)
    {
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key)))
        {
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLower();
        }
    }

    [HttpGet]
    public IActionResult CheckPaymentStatus(int orderId)
    {
        try
        {
            var order = _context.Orders
                .AsNoTracking()
                .FirstOrDefault(o => o.OrderId == orderId);

            if (order == null)
                return Json(new { success = false });

            return Json(new
            {
                success = order.IsPaymentVerified,
                status = order.PaymentStatus ?? "Pending"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ ERROR: " + ex.Message);
            return Json(new { success = false });
        }
    }
}