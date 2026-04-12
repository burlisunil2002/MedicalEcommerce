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

    public ReviewController(IConfiguration config,
                            IUserContextService userContext,
                            ApplicationDbContext context,
                            ICartCalculationService calc)
    {
        _userContext = userContext;
        _context = context;
        _config = config;
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

    // ✅ COOKIE

    // ================= SAVE ADDRESS =================
    [HttpPost]
    public IActionResult Review(CheckoutViewModel model)
    {
        if (!ModelState.IsValid)
        {
            TempData["Error"] = "Please fill all required fields";
            return RedirectToAction(nameof(Review));
        }

        HttpContext.Session.SetString("Address", JsonConvert.SerializeObject(model));
        return RedirectToAction(nameof(Review));
    }

    // ================= REVIEW PAGE =================
    [HttpGet]
    public async Task<IActionResult> Review()
    {
        var userId = _userContext.GetUserId();
        var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

        var coupon = HttpContext.Session.GetString("CouponCode");

        var carts = await _context.Carts
            .Include(c => c.Product)
            .Where(c =>
                (userId != null && c.UserId == userId) ||
                (userId == null && c.GuestId == guestId))
            .ToListAsync();

        if (!carts.Any())
            return RedirectToAction("Index", "Cart");

        // 🔥 CENTRAL CALCULATION
        var totals = await _calc.CalculateAsync(userId, guestId, coupon);

        // 🎟️ COUPON CALCULATION (SEPARATE DISPLAY)
        decimal couponDiscount = 0;

        if (!string.IsNullOrEmpty(coupon))
        {
            if (coupon == "SAVE10")
                couponDiscount = totals.Subtotal * 0.10m;
            else if (coupon == "SAVE20")
                couponDiscount = totals.Subtotal * 0.20m;
            else if (coupon == "FLAT100")
                couponDiscount = 100;
        }

        // 📦 ADDRESS
        var addressJson = HttpContext.Session.GetString("Address");

        var address = string.IsNullOrEmpty(addressJson)
            ? new CheckoutViewModel()
            : JsonConvert.DeserializeObject<CheckoutViewModel>(addressJson)!;

        // ✅ VIEW DATA
        ViewBag.Carts = carts;
        ViewBag.Subtotal = totals.Subtotal;
        ViewBag.GST = totals.GST;
        ViewBag.Discount = totals.Discount;
        ViewBag.CouponDiscount = couponDiscount; // 🔥 IMPORTANT
        ViewBag.Delivery = totals.Delivery;
        ViewBag.Total = totals.GrandTotal;
        ViewBag.Coupon = coupon;
        ViewBag.RazorpayKey = _config["Razorpay:Key"];
        ViewBag.Address = address;

        return View();
    }

    // ================= PLACE ORDER =================
    public class PaymentRequest
    {
        public string PaymentMethod { get; set; }
    }

    [HttpPost]
    public IActionResult PlaceOrder([FromBody] PaymentRequest request)
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