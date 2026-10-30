using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Services;


[ApiController]
[Route("api/subscription")]
[Authorize(Roles = "Seller")]
public class SubscriptionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly SubscriptionService _service;
    private readonly IAuditService _auditService;
    private readonly ILogger<SubscriptionController> _logger;

    public SubscriptionController(ApplicationDbContext context, IConfiguration config, IAuditService auditService, ILogger<SubscriptionController> logger)
    {
        _context = context;
        _config = config;
        _service = new SubscriptionService();
        _auditService = auditService;
        _logger = logger;
    }

    private async Task LogAuditAsync(
        string action,
        string status,
        int? sellerId = null,
        int? subscriptionId = null,
        string? description = null,
        object? oldValues = null,
        object? newValues = null)
    {
        try
        {
            await _auditService.LogAsync(
                action: action,
                module: "Subscriptions",
                status: status,
                entityType: "Subscription",
                entityId: subscriptionId?.ToString(),
                description: description ?? (sellerId.HasValue ? $"SellerId: {sellerId.Value}" : null),
                oldValues: oldValues,
                newValues: newValues);
        }
        catch (Exception auditEx)
        {
            // Audit failures must not interrupt subscription or payment processing.
            _logger.LogError(auditEx, "Failed to write subscription audit log for {Action}", action);
        }
    }

    /*  private int GetSellerId()
      {
          var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

          if (string.IsNullOrEmpty(userId))
              throw new Exception("User not logged in");

          var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

          if (seller == null)
              throw new Exception("Seller not found");

          return seller.SellerId;
      }*/

    private async Task<SellerModel?> GetCurrentSellerAsync()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return null;

        return await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    private async Task<int> GetSellerIdAsync()
    {
        var seller = await GetCurrentSellerAsync();

        if (seller == null)
            throw new Exception("Seller not found");

        return seller.SellerId;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        try
        {
            var seller = await GetCurrentSellerAsync();

            if (seller == null)
            {
                await LogAuditAsync("ViewSubscriptionStatus", "Failed", description: "Subscription status requested but seller was not found.");
                return Unauthorized(new
                {
                    success = false,
                    message = "Seller not found."
                });
            }

            var subscription = await _context.Subscriptions
                .Where(x => x.SellerId == seller.SellerId)
                .OrderByDescending(x => x.CreatedDate)
                .FirstOrDefaultAsync();

            if (subscription == null)
            {
                await LogAuditAsync("ViewSubscriptionStatus", "Success", seller.SellerId, description: "No subscription record found.");
                return Ok(new
                {
                    success = true,
                    subscribed = false
                });
            }

            await LogAuditAsync("ViewSubscriptionStatus", "Success", seller.SellerId, subscription.Id, "Seller viewed subscription status.", newValues: new { subscription.Status, subscription.ProductRange, subscription.Years });
            return Ok(new
            {
                success = true,

                subscribed = subscription.Status == "Active",

                subscription = new
                {
                    subscription.Id,
                    subscription.ProductRange,
                    subscription.Years,
                    subscription.Amount,
                    subscription.StartDate,
                    subscription.EndDate,
                    subscription.Status
                }
            });
        }
        catch (Exception ex)
        {
            await LogAuditAsync("ViewSubscriptionStatus", "Failed", description: ex.GetType().Name);
            return StatusCode(500, new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    // ================= CREATE =================
    [HttpPost("create")]
    public async Task<IActionResult> CreateSubscription([FromBody] SubscriptionRequestDto model)
    {
        try
        {
            var sellerId = await GetSellerIdAsync();

            var allowedPlans = new[]
{
    "basic",
    "pro",
    "ent"
};

            if (!allowedPlans.Contains(model.Plan))
            {
                await LogAuditAsync("CreateSubscription", "Failed", sellerId, description: "Invalid subscription plan.", newValues: new { plan = model.Plan, model.ProductRange });
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid subscription plan."
                });
            }
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
            await LogAuditAsync("CreateSubscription", "Success", sellerId, sub.Id, "Subscription payment order created.", newValues: new { plan = model.Plan, sub.ProductRange, sub.Years, sub.Amount, sub.Status });

            return Ok(new
            {
                success = true,
                subscriptionId = sub.Id,
                razorpayOrderId = sub.RazorpayOrderId,
                amount = amount * 100
            });
        }
        catch (Exception ex)
        {
            await LogAuditAsync("CreateSubscription", "Failed", description: ex.GetType().Name);
            return BadRequest(new
            {
                success = false,
                message = ex.InnerException?.Message ?? ex.Message
            });
        }
    }

    // ================= VERIFY =================
    [HttpPost]
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] SubscriptionPaymentDto model)
    {
        try
        {
            var sub = await _context.Subscriptions
    .FirstOrDefaultAsync(x =>
        x.RazorpayOrderId ==
        model.razorpay_order_id);

            if (sub == null)
            {
                await LogAuditAsync("VerifySubscriptionPayment", "Failed", description: "Subscription not found for payment verification.");
                return BadRequest(new { success = false, message = "Subscription not found" });
            }

            if (sub.Status == "Active")
            {
                await LogAuditAsync("VerifySubscriptionPayment", "Success", sub.SellerId, sub.Id, "Payment verification requested for an already active subscription.");
                return Ok(new { success = true });
            }

            var secret = _config["Razorpay:Secret"];

            var payload = $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var generatedSignature = Convert.ToHexString(hash).ToLower();

            if (generatedSignature != model.razorpay_signature)
            {
                sub.Status = "Failed"; // ✅ removed FailureReason
                await _context.SaveChangesAsync();
                await LogAuditAsync("VerifySubscriptionPayment", "Failed", sub.SellerId, sub.Id, "Razorpay payment signature verification failed.", oldValues: new { status = "Pending" }, newValues: new { status = "Failed" });

                return BadRequest(new { success = false, message = "Verification failed" });
            }

            // ✅ SUCCESS
            sub.Status = "Active";
            sub.PaymentId = model.razorpay_payment_id;

            sub.StartDate = DateTime.UtcNow; // ✅ payment day
            sub.EndDate = DateTime.UtcNow.AddYears(sub.Years); // ✅ correct

            var seller = await _context.Sellers
                .FirstOrDefaultAsync(s => s.SellerId == sub.SellerId);

            if (seller == null)
            {
                await LogAuditAsync("VerifySubscriptionPayment", "Failed", sub.SellerId, sub.Id, "Seller record not found during subscription activation.");
                return BadRequest(new { success = false, message = "Seller not found" });
            }

            seller.SubscriptionEndDate = sub.EndDate;
            seller.IsActive = true;
            seller.Status = "Active";
            seller.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await LogAuditAsync("VerifySubscriptionPayment", "Success", sub.SellerId, sub.Id, "Subscription activated after successful payment verification.", oldValues: new { status = "Pending" }, newValues: new { status = sub.Status, sub.ProductRange, sub.Years, sub.Amount, sub.StartDate, sub.EndDate });

            return Ok(new
            {
                success = true,
                message = "Subscription activated successfully.",
                redirect = "/seller/dashboard"
            });
        }
        catch (Exception ex)
        {
            await LogAuditAsync("VerifySubscriptionPayment", "Failed", description: ex.GetType().Name);
            return BadRequest(new
            {
                success = false,
                message = ex.InnerException?.Message ?? ex.Message
            });
        }
    }

    // ================= FAILED =================
    [HttpPost]
    [HttpPost("payment-failed")]
    public async Task<IActionResult> PaymentFailed([FromBody] int subscriptionId)
    {
        var sub = await _context.Subscriptions
            .FindAsync(subscriptionId);

        if (sub != null)
        {
            var oldStatus = sub.Status;
            sub.Status = "Failed"; // ✅ removed UpdatedAt
            _context.SaveChanges();
            await LogAuditAsync("MarkSubscriptionPaymentFailed", "Success", sub.SellerId, sub.Id, "Subscription payment marked as failed.", oldValues: new { status = oldStatus }, newValues: new { status = sub.Status });
        }
        else
        {
            await LogAuditAsync("MarkSubscriptionPaymentFailed", "Failed", subscriptionId: subscriptionId, description: "Subscription not found.");
        }

        return Ok(new
        {
            success = true,
            message = "Payment marked as failed."
        });
    }

    // ================= STATUS CHECK =================
    [HttpGet("payment-status")]
    public async Task<IActionResult> CheckPaymentStatus(int subscriptionId)
    {
        var sub = await _context.Subscriptions
            .FindAsync(subscriptionId);

        if (sub == null)
        {
            await LogAuditAsync("CheckSubscriptionPaymentStatus", "Failed", subscriptionId: subscriptionId, description: "Subscription not found.");
            return BadRequest(new { success = false });
        }

        await LogAuditAsync("CheckSubscriptionPaymentStatus", "Success", sub.SellerId, sub.Id, "Subscription payment status checked.", newValues: new { sub.Status, sub.StartDate, sub.EndDate });
        return Ok(new
        {
            success = true,
            isActive = sub.Status == "Active",
            status = sub.Status,
            startDate = sub.StartDate,
            endDate = sub.EndDate
        });

    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        await LogAuditAsync("ViewPaymentConfig", "Success", description: "Razorpay public key configuration viewed.");
        return Ok(new
        {
            razorpayKey = _config["Razorpay:Key"]
        });
    }

    [HttpGet("current")]
    public async Task<IActionResult> CurrentSubscription()
    {
        var seller = await GetCurrentSellerAsync();

        if (seller == null)
        {
            await LogAuditAsync("ViewCurrentSubscription", "Failed", description: "Current subscription requested but seller was not found.");
            return Unauthorized();
        }

        var subscription = await _context.Subscriptions
            .Where(x =>
                x.SellerId == seller.SellerId &&
                x.Status == "Active")
            .OrderByDescending(x => x.EndDate)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
            await LogAuditAsync("ViewCurrentSubscription", "Success", seller.SellerId, description: "No active subscription found.");
            return Ok(new
            {
                subscribed = false
            });
        }

        await LogAuditAsync("ViewCurrentSubscription", "Success", seller.SellerId, subscription.Id, "Seller viewed current active subscription.", newValues: new { subscription.Status, subscription.ProductRange, subscription.Years, subscription.StartDate, subscription.EndDate });
        return Ok(new
        {
            subscribed = true,

            subscription
        });
    }
}