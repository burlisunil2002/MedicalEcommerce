using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.ViewModels;

public class ReviewController : Controller
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;
    private readonly ICartCalculationService _calc;
    private readonly ILogger<ReviewController> _logger;

    public ReviewController(
        IConfiguration config,
        IUserContextService userContext,
        ApplicationDbContext context,
        ICartCalculationService calc,
        ILogger<ReviewController> logger)
    {
        _userContext = userContext;
        _context = context;
        _config = config;
        _calc = calc;
        _logger = logger;
    }

    // ---------------------------------------------------------------
    // By the time someone can reach the review page with items in
    // their cart, CartController has already minted a guest_id
    // cookie (adding to a cart is what creates it). So this page
    // never needs to mint one itself — it only reads. That keeps
    // the GET cheap (no Set-Cookie, no DB hit) for anyone who lands
    // here with an empty/no cart, and avoids this controller
    // duplicating (and drifting out of sync with, as it already had:
    // 7-day vs. CartController's 30-day expiry) cookie configuration
    // that belongs in one place.
    // ---------------------------------------------------------------
    private string? GetGuestId()
    {
        return Request.Cookies.TryGetValue("guest_id", out var guestId) &&
               !string.IsNullOrEmpty(guestId)
            ? guestId
            : null;
    }

    // ================= SAVE ADDRESS =================
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Review(CheckoutViewModel model)
    {
        if (!ModelState.IsValid)
        {
            // Preserve what they typed so the form can repopulate
            // instead of forcing them to re-enter everything.
            TempData["Error"] = "Please fill all required fields";
            TempData["AddressInput"] = JsonConvert.SerializeObject(model);
            return RedirectToAction(nameof(Review));
        }

        HttpContext.Session.SetString("Address", JsonConvert.SerializeObject(model));
        return RedirectToAction(nameof(Review));
    }

    // ================= REVIEW PAGE =================
    [HttpGet]
    public async Task<IActionResult> Review(CancellationToken ct)
    {
        var userId = _userContext.GetUserId();
        var guestId = string.IsNullOrEmpty(userId) ? GetGuestId() : null;

        if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(guestId))
            return RedirectToAction("Index", "Cart");

        var coupon = HttpContext.Session.GetString("CouponCode");

        var carts = await _context.Carts
            .AsNoTracking()
            .Include(c => c.Product)
            .Include(c => c.ProductVariant)
            .Where(c =>
                (userId != null && c.UserId == userId) ||
                (userId == null && c.GuestId == guestId))
            .ToListAsync(ct);

        if (!carts.Any())
            return RedirectToAction("Index", "Cart");

        var totals = await _calc.CalculateAsync(userId, guestId, coupon);

        // 📦 ADDRESS — prefer a just-submitted-but-invalid value (so the
        // form redisplays what they typed), otherwise fall back to the
        // last saved address for this session.
        var addressJson =
            TempData["AddressInput"] as string
            ?? HttpContext.Session.GetString("Address");

        var address = string.IsNullOrEmpty(addressJson)
            ? new CheckoutViewModel()
            : JsonConvert.DeserializeObject<CheckoutViewModel>(addressJson)!;

        ViewBag.Carts = carts;
        ViewBag.Subtotal = totals.Subtotal;
        ViewBag.GST = totals.GST;
        ViewBag.Discount = totals.Saved;
        ViewBag.CouponDiscount = totals.CouponDiscount;
        ViewBag.Coupon = coupon;
        ViewBag.Delivery = totals.Delivery;
        ViewBag.Total = totals.Total;
        ViewBag.RazorpayKey = _config["Razorpay:Key"];
        ViewBag.Address = address;

        return View();
    }

    // ================= PLACE ORDER =================
    public class PaymentRequest
    {
        public string PaymentMethod { get; set; } = "";
    }

    // NOTE: this is still a stub — it reports success without creating
    // an Order record, decrementing stock, clearing the cart, or
    // recomputing totals server-side. That's fine for wiring up the
    // frontend flow, but nothing here should be treated as "orders are
    // being placed" until that's built. The checks added below (auth,
    // payment method, non-empty cart) just stop it from reporting
    // success in cases that clearly aren't a valid order.
    //
    // Also: this is a state-changing endpoint called with a JSON body,
    // so [ValidateAntiForgeryToken] (which only reads a form field)
    // won't protect it. If _userContext relies on cookie auth, add
    // CSRF protection here before going live — typically an
    // IAntiforgery-issued token sent back as a custom request header
    // from the client and checked with IAntiforgery.ValidateRequestAsync.
    [HttpPost]
    public async Task<IActionResult> PlaceOrder(
        [FromBody] PaymentRequest? request,
        CancellationToken ct)
    {
        var userId = _userContext.GetUserId();

        if (string.IsNullOrEmpty(userId))
        {
            return Json(new
            {
                success = false,
                redirect = "/Account/Login?returnUrl=/Review"
            });
        }

        if (request is null || string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            return BadRequest(new
            {
                success = false,
                message = "Please choose a payment method"
            });
        }

        var hasCartItems = await _context.Carts
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId, ct);

        if (!hasCartItems)
        {
            return BadRequest(new
            {
                success = false,
                message = "Your cart is empty"
            });
        }

        _logger.LogInformation(
            "PlaceOrder requested by {UserId} via {PaymentMethod}",
            userId, request.PaymentMethod);

        if (request.PaymentMethod == "COD")
        {
            return Json(new
            {
                success = true,
                type = "COD"
            });
        }

        return Json(new
        {
            success = true,
            type = "ONLINE"
        });
    }
}
