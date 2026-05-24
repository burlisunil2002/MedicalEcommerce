using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;


[Authorize(Roles = "Seller")]
public class SubscriptionController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly SubscriptionService _service;

    public SubscriptionController(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
        _service = new SubscriptionService();
    }

    private int GetSellerId()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            throw new Exception("User not logged in");

        var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

        if (seller == null)
            throw new Exception("Seller not found");

        return seller.SellerId;
    }

    public IActionResult Index()
    {
        return View();
    }

    // ================= CREATE =================
    [HttpPost]
    public async Task<IActionResult> CreateSubscription([FromBody] SubscriptionRequestDto model)
    {
        try
        {
            var sellerId = GetSellerId();

            var result = _service.CalculatePrice(model.Plan, model.ProductRange);

            var years = result.years;
            var amount = result.amount;

            var client = new RazorpayClient(
                _config["Razorpay:Key"],
                _config["Razorpay:Secret"]
            );

            var options = new Dictionary<string, object>
        {
            { "amount", (int)(amount * 100) },
            { "currency", "INR" },
            { "receipt", "SUB-" + DateTime.UtcNow.Ticks }
        };

            var razorOrder = client.Order.Create(options);

            var sub = new SubscriptionModel
            {
                SellerId = sellerId,
                Years = years,                 // ✅ from plan
                ProductRange = model.ProductRange,
                Amount = amount,
                RazorpayOrderId = razorOrder["id"].ToString(),
                Status = "Pending",
                CreatedDate = DateTime.UtcNow
            };

            _context.Subscriptions.Add(sub);
            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                subscriptionId = sub.Id,
                razorpayOrderId = sub.RazorpayOrderId,
                amount = amount * 100
            });
        }
        catch (Exception ex)
        {
            return Json(new
            {
                success = false,
                message = ex.InnerException?.Message ?? ex.Message
            });
        }
    }

    // ================= VERIFY =================
    [HttpPost]
    public async Task<IActionResult> VerifyPayment([FromBody] SubscriptionPaymentDto model)
    {
        try
        {
            var sub = _context.Subscriptions
                .FirstOrDefault(x => x.RazorpayOrderId == model.razorpay_order_id);

            if (sub == null)
                return Json(new { success = false, message = "Subscription not found" });

            if (sub.Status == "Active")
                return Json(new { success = true });

            var secret = _config["Razorpay:Secret"];

            var payload = $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var generatedSignature = Convert.ToHexString(hash).ToLower();

            if (generatedSignature != model.razorpay_signature)
            {
                sub.Status = "Failed"; // ✅ removed FailureReason
                await _context.SaveChangesAsync();

                return Json(new { success = false, message = "Verification failed" });
            }

            // ✅ SUCCESS
            sub.Status = "Active";
            sub.PaymentId = model.razorpay_payment_id;

            sub.StartDate = DateTime.UtcNow; // ✅ payment day
            sub.EndDate = DateTime.UtcNow.AddYears(sub.Years); // ✅ correct

            var seller = _context.Sellers.FirstOrDefault(s => s.SellerId == sub.SellerId);

            if (seller == null)
            {
                return Json(new { success = false, message = "Seller not found" });
            }

            seller.SubscriptionEndDate = sub.EndDate;
            seller.IsActive = true;
            seller.Status = "Active";

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                redirect = "/Seller/SellerLanding"
            });
        }
        catch (Exception ex)
        {
            return Json(new
            {
                success = false,
                message = ex.InnerException?.Message ?? ex.Message
            });
        }
    }

    // ================= FAILED =================
    [HttpPost]
    public IActionResult PaymentFailed([FromBody] int subscriptionId)
    {
        var sub = _context.Subscriptions.Find(subscriptionId);

        if (sub != null)
        {
            sub.Status = "Failed"; // ✅ removed UpdatedAt
            _context.SaveChanges();
        }

        return Json(new { success = true });
    }

    // ================= STATUS CHECK =================
    [HttpGet]
    public IActionResult CheckPaymentStatus(int subscriptionId)
    {
        var sub = _context.Subscriptions.Find(subscriptionId);

        if (sub == null)
            return Json(new { success = false });

        return Json(new { success = sub.Status == "Active" });
    }
}