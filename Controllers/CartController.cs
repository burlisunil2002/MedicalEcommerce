using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

namespace VivekMedicalProducts.Controllers
{
    [ApiController]
    [Route("api/cart")]
    public class CartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICartCalculationService _cartCalculation;
        private readonly ICouponService _couponService;

        public CartController(
            ApplicationDbContext context,
            ICartCalculationService cartCalculation,
            ICouponService couponService)
        {
            _context = context;
            _cartCalculation = cartCalculation;
            _couponService = couponService;
        }

        private (string userId, string guestId) GetIdentity()
        {
            var userId = User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
                || string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

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

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart(
            [FromBody] AddCartItemDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var variant =
                await _context.ProductVariants
                    .FirstOrDefaultAsync(x =>
                        x.ProductVariantId ==
                        dto.VariantId);

            if (variant == null)
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid variant"
                });

            int qty = dto.Quantity;

            qty = Math.Max(
                variant.MinQuantity,
                qty
            );

            if (variant.MaxQuantity.HasValue)
            {
                qty = Math.Min(
                    qty,
                    variant.MaxQuantity.Value
                );
            }

            if (qty % variant.StepQuantity != 0)
            {
                qty =
                    ((qty / variant.StepQuantity) + 1)
                    * variant.StepQuantity;
            }

            var item =
                await _context.Carts
                    .FirstOrDefaultAsync(x =>
                        x.ProductVariantId == dto.VariantId &&
                        (
                            (!string.IsNullOrEmpty(userId) &&
                             x.UserId == userId)
                            ||
                            (string.IsNullOrEmpty(userId) &&
                             x.GuestId == guestId)
                        ));

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
                    GuestId =
                        string.IsNullOrEmpty(userId)
                            ? guestId
                            : null
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateQuantity(
            [FromBody] AddCartItemDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var item =
                await _context.Carts
                    .FirstOrDefaultAsync(x =>
                        x.ProductVariantId == dto.VariantId &&
                        (
                            (!string.IsNullOrEmpty(userId) &&
                             x.UserId == userId)
                            ||
                            (string.IsNullOrEmpty(userId) &&
                             x.GuestId == guestId)
                        ));

            if (item == null)
                return NotFound();

            if (dto.Quantity <= 0)
            {
                _context.Carts.Remove(item);
            }
            else
            {
                item.Quantity = dto.Quantity;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }

        [HttpGet("")]
        public async Task<IActionResult> GetCart()
        {
            var (userId, guestId) = GetIdentity();

            var query =
                _context.Carts
                    .Include(c => c.Product)
                    .Include(c => c.ProductVariant)
                    .AsQueryable();

            query =
                !string.IsNullOrEmpty(userId)
                    ? query.Where(x =>
                        x.UserId == userId)
                    : query.Where(x =>
                        x.GuestId == guestId);

            var items =
                await query
                    .Select(c => new
                    {
                        variantId =
                            c.ProductVariantId,

                        productId =
                            c.ProductId,

                        name =
                            c.Product.Name,

                        image =
                            c.Product.ImageUrl,

                        variantName =
                            c.ProductVariant.Model,

                        price =
                            c.ProductVariant.Price,

                        quantity =
                            c.Quantity
                    })
                    .ToListAsync();

            return Ok(items);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetCartCount()
        {
            var (userId, guestId) = GetIdentity();

            var count =
                await _context.Carts
                    .Where(c =>
                        (!string.IsNullOrEmpty(userId) &&
                         c.UserId == userId)
                        ||
                        (string.IsNullOrEmpty(userId) &&
                         c.GuestId == guestId))
                    .SumAsync(c =>
                        (int?)c.Quantity) ?? 0;

            return Ok(count);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var (userId, guestId) = GetIdentity();

            var couponCode =
                HttpContext.Session.GetString(
                    "CouponCode"
                );

            var totals =
                await _cartCalculation
                    .CalculateAsync(
                        userId,
                        guestId,
                        couponCode
                    );

            return Ok(totals);
        }

[HttpPost("apply-coupon")]
public async Task<IActionResult> ApplyCoupon(
    [FromBody] CouponDto dto)
        {
            var (userId, guestId) = GetIdentity();

            if (string.IsNullOrWhiteSpace(dto.Code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Please enter coupon code"
                });
            }

            var code =
                dto.Code
                    .Trim()
                    .ToUpper();

            if (!_couponService.IsValidCoupon(code))
            {
                return Ok(new
                {
                    success = false,
                    message = "Invalid coupon code",
                    couponDiscount = 0
                });
            }

            HttpContext.Session.SetString(
                "CouponCode",
                code
            );

            var totals =
                await _cartCalculation.CalculateAsync(
                    userId,
                    guestId,
                    code
                );

            return Ok(new
            {
                success = true,
                message = "Coupon applied successfully",
                couponDiscount = totals.CouponDiscount,
                summary = totals
            });
        }


        [HttpPost("remove")]
        public async Task<IActionResult> Remove(
            [FromBody] RemoveCartDto dto)
        {
            var (userId, guestId) = GetIdentity();

            var item =
                await _context.Carts
                    .FirstOrDefaultAsync(x =>
                        x.ProductVariantId ==
                        dto.VariantId &&
                        (
                            (!string.IsNullOrEmpty(userId) &&
                             x.UserId == userId)
                            ||
                            (string.IsNullOrEmpty(userId) &&
                             x.GuestId == guestId)
                        ));

            if (item == null)
                return NotFound();

            _context.Carts.Remove(item);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost("sync")]
        public async Task<IActionResult> Sync()
        {
            var userId =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var (_, guestId) =
                GetIdentity();

            var guestItems =
                await _context.Carts
                    .Where(x =>
                        x.GuestId ==
                        guestId)
                    .ToListAsync();

            foreach (var guestItem in guestItems)
            {
                guestItem.UserId = userId;
                guestItem.GuestId = null;
            }

            await _context.SaveChangesAsync();

            Response.Cookies.Delete("guest_id");

            return Ok(new
            {
                success = true
            });
        }

[HttpGet("full")]
public async Task<IActionResult> GetFullCart()
        {
            try
            {
                var (userId, guestId) = GetIdentity();

                var carts = await _context.Carts
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                    .Where(x =>
                        (!string.IsNullOrEmpty(userId) &&
                         x.UserId == userId)
                        ||
                        (string.IsNullOrEmpty(userId) &&
                         x.GuestId == guestId))
                    .ToListAsync();

                var couponCode =
                    HttpContext.Session.GetString("CouponCode");

                var totals =
                    await _cartCalculation.CalculateAsync(
                        userId,
                        guestId,
                        couponCode
                    );

                var items = carts.Select(c =>
                {
                    var variant = c.ProductVariant;
                    var product = c.Product;

                    decimal originalPrice =
                        variant?.Price ?? 0;

                    decimal discountPercent =
                        product?.DiscountPercentage ?? 0;

                    decimal finalPrice =
                        product?.IsHotDeal == true &&
                        discountPercent > 0
                            ? originalPrice -
                              (originalPrice * discountPercent / 100m)
                            : originalPrice;

                    return new
                    {
                        variantId = c.ProductVariantId,
                        productId = c.ProductId,

                        name =
                            product?.Name ?? "",

                        image =
                            variant?.ImageUrl ??
                            product?.ImageUrl ??
                            "/images/no-image.png",

                        variantName =
                            variant?.Model ?? "",

                        price = originalPrice,

                        finalPrice = finalPrice,

                        discountPercentage = discountPercent,

                        quantity = c.Quantity,

                        lineTotal =
                            finalPrice * c.Quantity,

                        gstPercentage =
                            product?.GSTPercentage ?? 0,

                        stepQuantity =
                            variant?.StepQuantity ?? 1,

                        minQuantity =
                            variant?.MinQuantity ?? 1,

                        maxQuantity =
                            variant?.MaxQuantity
                    };
                }).ToList();

                return Ok(new
                {
                    items,
                    summary = totals
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }


        public class RemoveCartDto
        {
            public int VariantId { get; set; }
        }
    }
}

