using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    [Authorize]
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;

        public CartController(ApplicationDbContext context, IUserContextService userContext)
        {
            _context = context;
            _userContext = userContext;
        }

        // ADD TO CART
        [HttpPost]
        public async Task<IActionResult> AddToCart(int productId)
        {
            var userId = _userContext.GetUserId();

            var cartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.ProductId == productId && c.UserId == userId);

            if (cartItem != null)
                cartItem.Quantity++;
            else
            {
                _context.Carts.Add(new CartModel
                {
                    ProductId = productId,
                    UserId = userId,
                    Quantity = 1
                });
            }

            await _context.SaveChangesAsync();

            return Ok(); // ✅ IMPORTANT for AJAX
        }

        // CART PAGE
        public async Task<IActionResult> Index()
        {
            var userId = _userContext.GetUserId();

            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
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

        // UPDATE QUANTITY
        [HttpPost]
        public async Task<IActionResult> UpdateQuantity(int cartId, int quantity)
        {
            var userId = _userContext.GetUserId();

            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(x => x.Id == cartId && x.UserId == userId);

            if (cartItem == null)
                return Json(new { success = false });

            if (quantity <= 0)
            {
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                cartItem.Quantity = quantity; // ✅ exact sync
            }

            await _context.SaveChangesAsync();

            var totalCount = await _context.CartItems
                .Where(x => x.UserId == userId)
                .SumAsync(x => (int?)x.Quantity) ?? 0;

            return Json(new
            {
                success = true,
                quantity = quantity,
                cartCount = totalCount
            });
        }

        [HttpPost]
        public async Task<IActionResult> DecreaseQuantity(int productId)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(x => x.ProductId == productId && x.UserId == userId);

            if (cartItem == null)
                return Json(new { success = false });

            if (cartItem.Quantity > 1)
            {
                cartItem.Quantity -= 1;
            }
            else
            {
                // Remove item completely if quantity = 1
                _context.CartItems.Remove(cartItem);
            }

            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }

        // REMOVE ITEM
        [HttpPost]
        public async Task<IActionResult> Remove(int id)
        {
            try
            {
                var item = await _context.Carts.FindAsync(id);
                if (item != null)
                {
                    _context.Carts.Remove(item);
                    await _context.SaveChangesAsync();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // CART COUNT
        [HttpGet]
        public IActionResult GetCartCount()
        {
            var userId = _userContext.GetUserId();

            var count = _context.CartItems
                .Where(x => x.UserId == userId)
                .Sum(x => (int?)x.Quantity) ?? 0;

            return Json(count);
        }

        // MERGE CART AFTER LOGIN
        public void MergeCartAfterLogin(string userId)
        {
            var sessionId = HttpContext.Session.Id;

            var guestCart = _context.Carts
                .Where(c => c.SessionId == sessionId)
                .ToList();

            foreach (var item in guestCart)
            {
                var existing = _context.Carts
                    .FirstOrDefault(c => c.UserId == userId && c.ProductId == item.ProductId);

                if (existing != null)
                {
                    existing.Quantity += item.Quantity;
                    _context.Carts.Remove(item);
                }
                else
                {
                    item.UserId = userId;
                    item.SessionId = null;
                }
            }

            _context.SaveChanges();
        }
    }
}