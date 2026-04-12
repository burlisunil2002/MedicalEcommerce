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

// ================= PLACE ORDER =================
/* [HttpPost]
 [ValidateAntiForgeryToken]
 public async Task<IActionResult> ProceedToPayment(OrderModel model)
 {
     var userId = _userContext.GetUserId();

     // ✅ FORCE LOGIN
     if (string.IsNullOrEmpty(userId) || !User.Identity.IsAuthenticated)
     {
         return RedirectToAction("Login", "Account",
             new { returnUrl = "/Checkout" });
     }

     var cartItems = await _context.Carts
         .Include(c => c.Product)
         .Where(c => c.UserId == userId)
         .ToListAsync();

     if (!cartItems.Any())
         return RedirectToAction("Index", "Cart");

     decimal subtotal = 0;
     decimal gstTotal = 0;

     foreach (var item in cartItems)
     {
         decimal finalPrice = item.Product.IsHotDeal && item.Product.DiscountPercentage > 0
             ? item.Product.Price - (item.Product.Price * item.Product.DiscountPercentage.Value / 100)
             : item.Product.Price;

         decimal itemTotal = finalPrice * item.Quantity;

         subtotal += itemTotal;
         gstTotal += itemTotal * (item.Product.GSTPercentage / 100m);
     }

     decimal delivery = subtotal >= 20 ? 0 : 5;
     decimal grandTotal = subtotal + gstTotal + delivery;

     var order = new OrderModel
     {
         UserId = userId, // ✅ NOW SAFE

         FullName = model.FullName,
         PhoneNumber = model.PhoneNumber,
         Address = model.Address,
         City = model.City,
         Pincode = model.Pincode,

         SubTotal = subtotal,
         GST = gstTotal,
         GrandTotal = grandTotal,

         OrderStatus = "Pending",
         OrderDate = DateTime.UtcNow
     };

     _context.Orders.Add(order);
     await _context.SaveChangesAsync();

     foreach (var item in cartItems)
     {
         decimal finalPrice = item.Product.IsHotDeal && item.Product.DiscountPercentage > 0
             ? item.Product.Price - (item.Product.Price * item.Product.DiscountPercentage.Value / 100)
             : item.Product.Price;

         _context.OrderItems.Add(new OrderItemModel
         {
             OrderId = order.OrderId,
             ProductId = item.ProductId,
             ProductName = item.Product.Name, // 🔥 FIX HERE
             Quantity = item.Quantity,
             Price = finalPrice
         });
     }

     await _context.SaveChangesAsync();

     _context.Carts.RemoveRange(cartItems);
     await _context.SaveChangesAsync();

     return RedirectToAction("Review", "Order", new { orderId = order.OrderId });
 } */
