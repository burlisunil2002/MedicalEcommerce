using DocumentFormat.OpenXml.Office2010.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Controllers
{
    [ApiController]
    [Route("api/cart")]
    public class CartController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CartController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ================= GET USER / GUEST =================
        private (string userId, string guestId) GetIdentity()
        {
            var userId = User.Identity.IsAuthenticated
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
                || string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

                var isHttps = Request.IsHttps;

                Response.Cookies.Append("guest_id", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(7)
                });
            }

            return (userId, guestId);
        }

        // ================= ADD =================
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddCartItemDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var item = await _context.Carts.FirstOrDefaultAsync(x =>
                x.ProductVariantId == dto.VariantId &&
                (
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                ));

            var variant = await _context.ProductVariants
     .FirstOrDefaultAsync(v => v.ProductVariantId == dto.VariantId);

            if (variant == null)
                return BadRequest("Invalid variant");

            // 🔥 APPLY RULES
            int qty = dto.Quantity;

            qty = Math.Max(variant.MinQuantity, qty);

            if (variant.MaxQuantity.HasValue)
                qty = Math.Min(qty, variant.MaxQuantity.Value);

            if (qty % variant.StepQuantity != 0)
            {
                qty = ((qty / variant.StepQuantity) + 1) * variant.StepQuantity;
            }

            if (item != null)
            {
                item.Quantity += qty;
            }
            else
            {
                _context.Carts.Add(new CartModel
                {
                    ProductId = dto.ProductId,
                    ProductVariantId = dto.VariantId,
                    Quantity = qty,
                    UserId = userId,
                    GuestId = userId == null ? guestId : null
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // ================= UPDATE =================
        [HttpPost("update")]
        public async Task<IActionResult> UpdateQuantity([FromBody] AddCartItemDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var item = await _context.Carts.FirstOrDefaultAsync(x =>
                x.ProductVariantId == dto.VariantId &&
                (
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                ));

            if (item == null) return BadRequest();

            if (dto.Quantity <= 0)
            {
                _context.Carts.Remove(item);
            }
            else
            {
                var variant = await _context.ProductVariants
    .FirstOrDefaultAsync(v => v.ProductVariantId == dto.VariantId);

                if (variant == null)
                    return BadRequest("Invalid variant");

                int qty = dto.Quantity;

                qty = Math.Max(variant.MinQuantity, qty);

                if (variant.MaxQuantity.HasValue)
                    qty = Math.Min(qty, variant.MaxQuantity.Value);

                if (qty % variant.StepQuantity != 0)
                {
                    qty = ((qty / variant.StepQuantity) + 1) * variant.StepQuantity;
                }

                item.Quantity = qty;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // ================= GET CART =================
        [HttpGet("")]
        public async Task<IActionResult> GetCart()
        {
            var (userId, guestId) = GetIdentity();

            var query = _context.Carts
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(c => c.UserId == userId);
            else
                query = query.Where(c => c.GuestId == guestId);

            var items = await query.Select(c => new
            {
                variantId = c.ProductVariantId,
                productId = c.ProductId,

                name = c.Product.Name,
                image = c.Product.ImageUrl,

                variantName = c.ProductVariant.Model,
                price = c.ProductVariant.Price,

                quantity = c.Quantity
            }).ToListAsync();

            return Ok(items);
        }

        // ================= COUNT =================
        [HttpGet("count")]
        public async Task<IActionResult> GetCartCount()
        {
            var (userId, guestId) = GetIdentity();

            var count = await _context.Carts
                .Where(c =>
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId))
                .SumAsync(c => (int?)c.Quantity) ?? 0;

            return Ok(count);
        }

        // ================= SUMMARY =================
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var (userId, guestId) = GetIdentity();

            var carts = await _context.Carts
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                .Where(c =>
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId))
                .ToListAsync();

            decimal subtotal = 0;
            decimal saved = 0;

            foreach (var c in carts)
            {
                var original = c.ProductVariant.Price;

                var final = c.Product.IsHotDeal && c.Product.DiscountPercentage > 0
                    ? original - (original * c.Product.DiscountPercentage.Value / 100)
                    : original;

                subtotal += final * c.Quantity;
                saved += (original - final) * c.Quantity;
            }

            decimal delivery = subtotal > 500 ? 0 : 80;
            decimal gst = subtotal * 0.18m;

            var coupon = HttpContext.Session.GetString("CouponCode");
            decimal couponDiscount = coupon == "FIRST20" ? subtotal * 0.2m : 0;

            decimal total = subtotal + gst + delivery - couponDiscount;

            return Ok(new
            {
                subtotal,
                gst,
                delivery,
                saved,
                couponDiscount,
                total
            });
        }

        // ================= REMOVE =================
        public class RemoveCartDto
        {
            public int VariantId { get; set; }
        }

        [HttpPost("remove")]
        public async Task<IActionResult> Remove([FromBody] RemoveCartDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var item = await _context.Carts.FirstOrDefaultAsync(x =>
                x.ProductVariantId == dto.VariantId &&
                (
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                ));

            if (item == null) return NotFound();

            _context.Carts.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // ================= SYNC (GUEST → USER) =================
        [HttpPost("sync")]
        public async Task<IActionResult> Sync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var (_, guestId) = GetIdentity();

            var guestItems = await _context.Carts
                .Where(x => x.GuestId == guestId)
                .ToListAsync();

            foreach (var guestItem in guestItems)
            {
                var existing = await _context.Carts.FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.ProductVariantId == guestItem.ProductVariantId);

                if (existing != null)
                {
                    existing.Quantity += guestItem.Quantity;
                    _context.Carts.Remove(guestItem);
                }
                else
                {
                    guestItem.UserId = userId;
                    guestItem.GuestId = null;
                }
            }

            await _context.SaveChangesAsync();

            Response.Cookies.Delete("guest_id");

            return Ok(new { success = true });
        }

        [HttpPost("apply-coupon")]
        public IActionResult ApplyCoupon([FromBody] CouponDto dto)
        {
            if (string.IsNullOrEmpty(dto.Code))
                return BadRequest();

            HttpContext.Session.SetString("CouponCode", dto.Code);

            return Ok(new { success = true });
        }

        [HttpGet("full")]
        public async Task<IActionResult> GetFullCart()
        {
            var (userId, guestId) = GetIdentity();

            var carts = await _context.Carts
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                .Include(c => c.Product.Variants)
                .Where(c =>
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId))
                .ToListAsync();

            var items = carts.Select(c =>
            {
                var variant = c.ProductVariant
                    ?? c.Product?.Variants?.OrderBy(v => v.ProductVariantId).FirstOrDefault();

                if (variant == null || c.Product == null)
                    return null;

                var original = variant.Price;

                var final = c.Product.IsHotDeal && c.Product.DiscountPercentage > 0
                    ? original - (original * c.Product.DiscountPercentage.Value / 100)
                    : original;

                return new
                {
                    variantId = variant.ProductVariantId,
                    productId = c.ProductId,
                    name = c.Product.Name ?? "",
                    image = variant.ImageUrl ?? c.Product.ImageUrl ?? "",
                    variantName = variant.Model ?? "",
                    price = original,
                    finalPrice = final,
                    quantity = c.Quantity,
                    gstPercentage = c.Product.GSTPercentage,

                    // 🔥 ADD THESE
                    stepQuantity = variant.StepQuantity,
                    minQuantity = variant.MinQuantity,
                    maxQuantity = variant.MaxQuantity
                };
            })
            .Where(x => x != null)
            .ToList();

            decimal subtotal = items.Sum(i => i.finalPrice * i.quantity);
            decimal saved = items.Sum(i => (i.price - i.finalPrice) * i.quantity);
            decimal gst = items.Sum(i => i.finalPrice * i.quantity * i.gstPercentage / 100m);
            decimal delivery = subtotal > 500 ? 0 : 80;

            var coupon = HttpContext.Session.GetString("CouponCode");

            decimal couponDiscount = coupon switch
            {
                "FIRST20" => subtotal * 0.2m,
                "SAVE10" => subtotal * 0.1m,
                "FLAT100" => 100,
                _ => 0
            };

            decimal total = subtotal + gst + delivery - couponDiscount;

            return Ok(new
            {
                items,
                summary = new
                {
                    subtotal,
                    gst,
                    delivery,
                    saved,
                    couponDiscount,
                    total
                }
            });
        }
    }
}