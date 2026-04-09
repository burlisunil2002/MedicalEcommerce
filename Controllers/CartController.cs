using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;

        public CartController(ApplicationDbContext context, IUserContextService userContext)
        {
            _context = context;
            _userContext = userContext;
        }

        // ================= COOKIE =================
        private string GetOrCreateGuestId()
        {
            var guestId = Request.Cookies["guest_id"];

            if (string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

                var isHttps = HttpContext.Request.IsHttps;

                Response.Cookies.Append("guest_id", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = isHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(7)
                });
            }

            return guestId;
        }

        private string GetGuestId()
        {
            return Request.Cookies["guest_id"];
        }

        // ================= ADD TO CART =================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddToCart(int productId)
        {
            try
            {
                var userId = _userContext.GetUserId();
                string guestId = null;

                if (string.IsNullOrEmpty(userId))
                {
                    guestId = GetOrCreateGuestId();
                }

                var cartItem = await _context.Carts.FirstOrDefaultAsync(c =>
                    c.ProductId == productId &&
                    (
                        (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                        (string.IsNullOrEmpty(userId) && c.GuestId == guestId)
                    )
                );

                if (cartItem != null)
                {
                    cartItem.Quantity++;
                }
                else
                {
                    _context.Carts.Add(new CartModel
                    {
                        ProductId = productId,
                        UserId = string.IsNullOrEmpty(userId) ? null : userId,
                        GuestId = string.IsNullOrEmpty(userId) ? guestId : null,
                        Quantity = 1
                    });
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }

        // ================= CART PAGE =================
        public async Task<IActionResult> Index()
        {
            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c =>
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId))
                .ToListAsync();

            decimal subtotal = 0, gst = 0;

            foreach (var item in carts)
            {
                decimal price = item.Product.IsHotDeal && item.Product.DiscountPercentage > 0
                    ? item.Product.Price - (item.Product.Price * item.Product.DiscountPercentage.Value / 100)
                    : item.Product.Price;

                decimal gstPercent = item.Product?.GSTPercentage ?? 0;

                subtotal += price * item.Quantity;
                gst += (price * item.Quantity) * (gstPercent / 100);
            }

            return View(new CartItemViewModel
            {
                CartItems = carts,
                SubTotal = subtotal,
                GSTTotal = gst,
                GrandTotal = subtotal + gst
            });
        }

        // ================= UPDATE QUANTITY =================
        [HttpPost]
        public async Task<IActionResult> UpdateQuantity(int cartId, int quantity)
        {
            var cartItem = await _context.Carts.FirstOrDefaultAsync(x => x.Id == cartId);

            if (cartItem == null)
                return Json(new { success = false });

            if (quantity <= 0)
                _context.Carts.Remove(cartItem);
            else
                cartItem.Quantity = quantity;

            await _context.SaveChangesAsync();

            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var totalCount = await _context.Carts
                .Where(x =>
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId))
                .SumAsync(x => (int?)x.Quantity) ?? 0;

            return Json(new { success = true, quantity, cartCount = totalCount });
        }

        // ================= DECREASE =================
        [HttpPost]
        public async Task<IActionResult> DecreaseQuantity(int productId)
        {
            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var cartItem = await _context.Carts.FirstOrDefaultAsync(x =>
                x.ProductId == productId &&
                (
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                ));

            if (cartItem == null)
                return Json(new { success = false });

            if (cartItem.Quantity > 1)
                cartItem.Quantity--;
            else
                _context.Carts.Remove(cartItem);

            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }

        // ================= REMOVE =================
        [HttpPost]
        public async Task<IActionResult> Remove(int productId)
        {
            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var item = await _context.Carts.FirstOrDefaultAsync(c =>
                c.ProductId == productId &&
                (
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId)
                ));

            if (item != null)
            {
                _context.Carts.Remove(item);
                await _context.SaveChangesAsync();
            }

            return Json(new { success = true });
        }

        // ================= COUNT =================
        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetCartCount()
        {
            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var count = _context.Carts
                .Where(x =>
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId))
                .Sum(x => (int?)x.Quantity) ?? 0;

            return Json(count);
        }

        // ================= GET ITEMS =================
        [HttpGet]
        public IActionResult GetCartItems()
        {
            var userId = _userContext.GetUserId();
            var guestId = GetGuestId();

            var items = _context.Carts
                .Where(x =>
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId))
                .Select(x => new { x.ProductId, x.Quantity })
                .ToList();

            return Json(items);
        }

        // MERGE CART AFTER LOGIN
        public async Task MergeCartAfterLogin(string userId)
        {
            var guestId = GetGuestId(); // ✅ replace

            if (string.IsNullOrEmpty(guestId)) return;

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
        }
    }
}