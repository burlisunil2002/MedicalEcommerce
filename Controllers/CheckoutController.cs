using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.ViewModels;

public class CheckoutController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;
    private readonly ICartCalculationService _calc;

    public CheckoutController(ApplicationDbContext context,
                              IUserContextService userContext,
                              ICartCalculationService calc)
    {
        _context = context;
        _userContext = userContext;
        _calc = calc;
    }


    // ================= CHECKOUT =================
    public async Task<IActionResult> Index()
    {
        var userId = _userContext.GetUserId();
        var guestId = string.IsNullOrEmpty(userId) ? Request.Cookies["guest_id"] : null;
        var coupon = HttpContext.Session.GetString("CouponCode");

        var cartItems = await _context.Carts
            .Include(c => c.Product)
            .Where(c =>
                (userId != null && c.UserId == userId) ||
                (userId == null && c.GuestId == guestId))
            .ToListAsync();

        if (!cartItems.Any())
            return RedirectToAction("Index", "Cart");

        var totals = await _calc.CalculateAsync(userId, guestId, coupon);

        ViewBag.Subtotal = totals.Subtotal;
        ViewBag.GST = totals.GST;
        ViewBag.Discount = totals.Discount;
        ViewBag.Delivery = totals.Delivery;
        ViewBag.Total = totals.GrandTotal;

        return View(new CheckoutViewModel
        {
            CartItems = cartItems
        });
    }
}

