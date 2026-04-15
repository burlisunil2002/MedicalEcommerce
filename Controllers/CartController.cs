using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;
        private readonly ICartCalculationService _calc;

        public CartController(ApplicationDbContext context,
                              IUserContextService userContext,
                              ICartCalculationService calc)
        {
            _context = context;
            _userContext = userContext;
            _calc = calc;
        }

        // ================= COOKIE =================
        private string GetOrCreateGuestId()
        {
            if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
                || string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

                Response.Cookies.Append("guest_id", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true, // keep this
                    SameSite = SameSiteMode.None, // 🔥 CHANGE THIS
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(7)
                });
            }

            return guestId;
        }


        // ================= APPLY COUPON =================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ApplyCoupon(string code)
        {
            if (string.IsNullOrEmpty(code))
                return Json(new { success = false, message = "Select a coupon" });

            HttpContext.Session.SetString("CouponCode", code);

            return Json(new { success = true, message = "Coupon applied!" });
        }

        // ================= ADD TO CART =================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddToCart(int productId)
        {
            try
            {
                Console.WriteLine("ProductId: " + productId);

                var userId = _userContext.GetUserId();
                var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

                var cartItem = await _context.Carts.FirstOrDefaultAsync(c =>
                    c.ProductId == productId &&
                    ((userId != null && c.UserId == userId) ||
                     (userId == null && c.GuestId == guestId)));

                if (cartItem != null)
                {
                    cartItem.Quantity++;
                }
                else
                {
                    _context.Carts.Add(new CartModel
                    {
                        ProductId = productId,
                        UserId = userId,
                        GuestId = guestId,
                        Quantity = 1
                    });
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
                return BadRequest(ex.Message); // 👈 YOU WILL SEE ERROR
            }
        }

        // ================= CART PAGE =================
        public async Task<IActionResult> Index()
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

            // 🔥 CENTRAL CALCULATION
            var totals = await _calc.CalculateAsync(userId, guestId, coupon);

            return View(new CartItemViewModel
            {
                CartItems = carts,
                SubTotal = totals.Subtotal,
                GSTTotal = totals.GST,
                Discount = totals.Discount,
                Delivery = totals.Delivery,
                GrandTotal = totals.GrandTotal
            });
        }

        // ================= UPDATE QTY =================
        [HttpPost]
        public async Task<IActionResult> UpdateQuantity(int productId, int change)
        {
            var userId = _userContext.GetUserId();
            var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

            var cartItem = await _context.Carts.FirstOrDefaultAsync(c =>
                c.ProductId == productId &&
                ((userId != null && c.UserId == userId) ||
                 (userId == null && c.GuestId == guestId)));

            if (cartItem == null)
            {
                return Json(new { success = false, message = "Item not found" }); // 🔥 better debug
            }

            cartItem.Quantity += change;

            if (cartItem.Quantity <= 0)
            {
                _context.Carts.Remove(cartItem);
            }

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                quantity = cartItem.Quantity > 0 ? cartItem.Quantity : 0
            });
        }

        // ================= REMOVE =================
        [HttpPost]
        public async Task<IActionResult> Remove(int productId)
        {
            var userId = _userContext.GetUserId();
            var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

            var item = await _context.Carts.FirstOrDefaultAsync(c =>
                c.ProductId == productId &&
                ((userId != null && c.UserId == userId) ||
                 (userId == null && c.GuestId == guestId)));

            if (item != null)
            {
                _context.Carts.Remove(item);
                await _context.SaveChangesAsync();
            }

            return Json(new { success = true });
        }

        // ================= COUNT =================
        [AllowAnonymous]
        public IActionResult GetCartCount()
        {
            var userId = _userContext.GetUserId();
            var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

            var count = _context.Carts
                .Where(c =>
                    (userId != null && c.UserId == userId) ||
                    (userId == null && c.GuestId == guestId))
                .Sum(c => (int?)c.Quantity) ?? 0;

            return Json(count);
        }

        [HttpGet]
        public async Task<IActionResult> GetCartSummary()
        {
            var userId = _userContext.GetUserId();
            var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

            var coupon = HttpContext.Session.GetString("CouponCode");

            var totals = await _calc.CalculateAsync(userId, guestId, coupon);

            decimal couponDiscount = 0;

            if (!string.IsNullOrEmpty(coupon))
            {
                if (coupon == "SAVE10")
                    couponDiscount = totals.Subtotal * 0.10m;
                else if (coupon == "SAVE20")
                    couponDiscount = totals.Subtotal * 0.20m;
            }

            return Json(new
            {
                subtotal = totals.Subtotal,
                gst = totals.GST,
                discount = totals.Discount,
                coupon = couponDiscount, // 🔥 NEW
                delivery = totals.Delivery,
                total = totals.GrandTotal
            });
        }

        // ================= MERGE AFTER LOGIN =================
        public async Task MergeCartAfterLogin(string userId)
        {
            var guestId = string.IsNullOrEmpty(userId) ? GetOrCreateGuestId() : null;

            if (string.IsNullOrEmpty(guestId))
                return;

            var guestCart = await _context.Carts
                .Where(c => c.GuestId == guestId)
                .ToListAsync();

            foreach (var item in guestCart)
            {
                var existing = await _context.Carts.FirstOrDefaultAsync(c =>
                    c.UserId == userId && c.ProductId == item.ProductId);

                if (existing != null)
                {
                    existing.Quantity += item.Quantity;
                    _context.Carts.Remove(item);
                }
                else
                {
                    item.UserId = userId;
                    item.GuestId = null;
                }
            }

            await _context.SaveChangesAsync();

            Response.Cookies.Delete("guest_id"); // 🔥 important
        }
    }
}