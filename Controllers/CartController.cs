using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    [Authorize]
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUserContextService _userContext;


        public CartController(ApplicationDbContext context,
                              UserManager<ApplicationUser> userManager, IUserContextService userContext)
        {
            _context = context;
            _userManager = userManager;
            _userContext = userContext;

        }

        // ================================
        // ADD TO CART
        // ================================

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddToCart(int productId)
        {
            var userId = _userContext.GetUserId();
            var cartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.ProductId == productId && c.UserId == userId);

            if (cartItem != null)
            {
                // Product already exists → increase quantity
                cartItem.Quantity += 1;
            }
            else
            {
                // New product → create cart row
                cartItem = new CartModel
                {
                    ProductId = productId,
                    UserId = userId,
                    Quantity = 1
                };

                _context.Carts.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            return RedirectToAction("Index");
        }
        // ================================
        // CART PAGE
        // ================================

        public async Task<IActionResult> Index()
        {
            var userId = _userContext.GetUserId();


            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            decimal subtotal = 0;
            decimal gstTotal = 0;

            foreach (var item in carts)
            {
                decimal itemTotal = item.Product.Price * item.Quantity;
                subtotal += itemTotal;
                gstTotal += itemTotal * ((decimal)item.Product.GSTPercentage / 100);
            }

            var model = new CartItemViewModel
            {
                CartItems = carts,
                SubTotal = subtotal,
                GSTTotal = gstTotal,
                GrandTotal = subtotal + gstTotal
            };

            return View(model);
        }

        // ================================
        // UPDATE QUANTITY
        // ================================

        [HttpPost]
        public async Task<IActionResult> UpdateQuantity(int cartId, int quantity)
        {
            var cartItem = await _context.Carts.FindAsync(cartId);

            if (cartItem != null)
            {
                cartItem.Quantity = quantity;
                await _context.SaveChangesAsync();
            }

            return Json(new { success = true });
        }

        // ================================
        // REMOVE ITEM
        // ================================

        [HttpPost]
        public IActionResult Remove(int id)
        {
            var item = _context.CartItems.FirstOrDefault(x => x.Id == id);

            if (item != null)
            {
                _context.CartItems.Remove(item);
                _context.SaveChanges();
            }

            return Json(new { success = true });
        }

        // ================================
        // CART COUNT
        // ================================

        [HttpGet]
        public IActionResult GetCartCount()
        {
            var userId = _userContext.GetUserId();


            var count = _context.Carts
                        .Where(c => c.UserId == userId)
                        .Sum(c => c.Quantity);

            return Json(count);
        }

        // ================================
        // MERGE CART AFTER LOGIN
        // ================================

        public void MergeCartAfterLogin(string userId)
        {
            var sessionId = HttpContext.Session.Id;

            var guestCart = _context.Carts
                            .Where(c => c.SessionId == sessionId)
                            .ToList();

            foreach (var item in guestCart)
            {
                var existing = _context.Carts
                                .FirstOrDefault(c =>
                                c.UserId == userId &&
                                c.ProductId == item.ProductId);

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