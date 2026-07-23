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

private (string? userId, string guestId) GetIdentity()
        {
            var userId =
                User.Identity?.IsAuthenticated == true
                    ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                    : null;

            if (
                Request.Cookies.TryGetValue(
                    "guest_id",
                    out string? guestId
                )
                &&
                !string.IsNullOrWhiteSpace(guestId)
            )
            {
                return (userId, guestId);
            }

            guestId = Guid.NewGuid().ToString();

            Response.Cookies.Append(
                "guest_id",
                guestId,
                new CookieOptions
                {
                    HttpOnly = true,

                    Secure =
                        Request.IsHttps,

                    SameSite =
                        SameSiteMode.Lax,

                    Path = "/",

                    IsEssential = true,

                    Expires =
                        DateTime.UtcNow.AddDays(30)
                }
            );

            return (userId, guestId);
        }


        [HttpPost("add")]
        public async Task<IActionResult> AddToCart(
      [FromBody] AddCartItemDto dto)
        {
            try
            {
                var (userId, guestId) = GetIdentity();

                CartModel? cartItem = null;

                if (!string.IsNullOrEmpty(userId))
                {
                    cartItem = await _context.Carts
                        .FirstOrDefaultAsync(x =>
                            x.UserId == userId &&
                            x.ProductId == dto.ProductId &&
                            x.ProductVariantId == dto.VariantId);
                }
                else
                {
                    cartItem = await _context.Carts
                        .FirstOrDefaultAsync(x =>
                            x.GuestId == guestId &&
                            x.ProductId == dto.ProductId &&
                            x.ProductVariantId == dto.VariantId);
                }

                if (cartItem != null)
                {
                    cartItem.Quantity += dto.Quantity;
                }
                else
                {
                    var product = await _context.Products
                        .FirstOrDefaultAsync(x =>
                            x.Id == dto.ProductId);

                    _context.Carts.Add(new CartModel
                    {
                        ProductId = dto.ProductId,
                        ProductVariantId = dto.VariantId,
                        Quantity = dto.Quantity,

                        // IMPORTANT FIX
                        UserId = userId,
                        GuestId =
                            string.IsNullOrEmpty(userId)
                                ? guestId
                                : null,

                        SellerId = product?.SellerId,
                        CreatedDate = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.ToString()
                });
            }
        }

        [HttpPut("update")]
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
                            c.Quantity,

                        finalPrice =
                            c.FinalPrice
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

            var checkoutSession =
    await _context.CheckoutSessions
    .FirstOrDefaultAsync(x =>

        x.IsActive &&

        (

            (userId != null && x.UserId == userId)

            ||

            (userId == null && x.GuestId == guestId)

        ));

            var couponCode =
                checkoutSession?.CouponCode;

            var totals =
                await _cartCalculation.CalculateAsync(
                    userId,
                    guestId,
                    couponCode);

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

            var checkoutSession =
    await _context.CheckoutSessions
    .FirstOrDefaultAsync(x =>

        x.IsActive &&

        (

            (userId != null && x.UserId == userId)

            ||

            (userId == null && x.GuestId == guestId)

        ));

            if (checkoutSession == null)
            {
                checkoutSession = new CheckoutSessionModel
                {
                    UserId = userId,
                    GuestId = guestId,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.CheckoutSessions.Add(checkoutSession);
            }

            checkoutSession.CouponCode = code;
            checkoutSession.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

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

        [HttpDelete("remove-coupon")]
        public async Task<IActionResult> RemoveCoupon()
        {
            var (userId, guestId) = GetIdentity();

            var session =
                await _context.CheckoutSessions
                .FirstOrDefaultAsync(x =>

                    x.IsActive &&

                    (

                        (userId != null && x.UserId == userId)

                        ||

                        (userId == null && x.GuestId == guestId)

                    ));

            if (session != null)
            {
                session.CouponCode = null;
                session.ModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();
            }

            var totals =
                await _cartCalculation.CalculateAsync(
                    userId,
                    guestId,
                    null);

            return Ok(new
            {
                success = true,
                summary = totals
            });
        }


        [HttpDelete("remove/{variantId}")]
        public async Task<IActionResult> Remove(int variantId)
        {
            var (userId, guestId) = GetIdentity();

            var item = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId == variantId &&
                    (
                        (!string.IsNullOrEmpty(userId) &&
                         x.UserId == userId)
                        ||
                        (string.IsNullOrEmpty(userId) &&
                         x.GuestId == guestId)
                    ));

            if (item == null)
            {
                return NotFound(new
                {
                    success = false
                });
            }

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
                    .AsNoTracking()
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                        .ThenInclude(v => v.Images)
                    .Where(x =>
                        (!string.IsNullOrEmpty(userId) &&
                            x.UserId == userId)
                        ||
                        (string.IsNullOrEmpty(userId) &&
                            x.GuestId == guestId))
                    .ToListAsync();

                var checkoutSession =
    await _context.CheckoutSessions
    .FirstOrDefaultAsync(x =>

        x.IsActive &&

        (

            (userId != null && x.UserId == userId)

            ||

            (userId == null && x.GuestId == guestId)

        ));

                var couponCode =
                    checkoutSession?.CouponCode;

                var totals =
                    await _cartCalculation
                        .CalculateAsync(
                            userId,
                            guestId,
                            couponCode);

                var items = carts.Select(c =>
                {
                    var variant =
                        c.ProductVariant;

                    var product =
                        c.Product;

                    decimal originalPrice =
                        variant?.Price ?? 0;

                    decimal discountPercent =
                        product?.DiscountPercentage ?? 0;

                    decimal finalPrice =
                        product?.IsHotDeal == true &&
                        discountPercent > 0
                            ? originalPrice -
                              (originalPrice *
                               discountPercent / 100m)
                            : originalPrice;

                    var variantImage =
                        variant?.Images?
                            .OrderBy(i =>
                                i.DisplayOrder)
                            .Select(i =>
                                i.ImageUrl)
                            .FirstOrDefault();

                    return new
                    {
                        variantId =
                            c.ProductVariantId,

                        productId =
                            c.ProductId,

                        name =
                            product?.Name ?? "",

                        image =
                            variantImage ??
                            product?.ImageUrl ??
                            "/images/no-image.png",

                        images =
                            variant?.Images?
                                .OrderBy(i =>
                                    i.DisplayOrder)
                                .Select(i =>
                                    i.ImageUrl)
                                .ToList()
                            ?? new List<string>(),

                        variantName =
                            variant?.Model ?? "",

                        price =
                            originalPrice,

                        finalPrice =
                            finalPrice,

                        discountPercentage =
                            discountPercent,

                        quantity =
                            c.Quantity,

                        lineTotal =
                            finalPrice *
                            c.Quantity,

                        gstPercentage =
                            product?.GSTPercentage ?? 0,

                        stepQuantity =
                            variant?.StepQuantity ?? 1,

                        minQuantity =
                            variant?.MinQuantity ?? 1,

                        maxQuantity =
                            variant?.MaxQuantity,

                        stockQuantity =
                            variant?.StockQuantity ?? 0,

                        hasStock =
                            (variant?.StockQuantity ?? 0) > 0
                    };
                })
                .ToList();

                return Ok(new
                {
                    success = true,
                    items,
                    summary = totals
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Failed to load cart.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }


        public class RemoveCartDto
        {
            public int VariantId { get; set; }
        }
    }
}

