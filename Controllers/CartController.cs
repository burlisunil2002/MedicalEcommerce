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
                decimal price = item.Product?.Price ?? 0;
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
            try
            {
                var item = await _context.Carts.FindAsync(cartId);
                if (item == null) return Json(new { success = false });

                item.Quantity = Math.Max(1, quantity);
                await _context.SaveChangesAsync();

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
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

            var count = _context.Carts
                .Where(c => c.UserId == userId)
                .Sum(c => c.Quantity);

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