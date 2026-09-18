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
        private readonly ILogger<CartController> _logger;

        public CartController(
            ApplicationDbContext context,
            ICartCalculationService cartCalculation,
            ICouponService couponService,
            ILogger<CartController> logger)
        {
            _context = context;
            _cartCalculation = cartCalculation;
            _couponService = couponService;
            _logger = logger;
        }

        // ---------------------------------------------------------------
        // IDENTITY
        //
        // Split into a read-only lookup and a "write" lookup that is
        // allowed to mint a guest cookie. This matters for scalability:
        // - GET requests never issue a Set-Cookie, so they stay
        //   cacheable at the edge/CDN and don't churn cookies for bots
        //   / first-time crawlers.
        // - Authenticated users never get a pointless guest_id cookie.
        // ---------------------------------------------------------------

        private string? GetUserId() =>
            User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

        /// <summary>Read-only identity resolution. Never sets cookies.</summary>
        private (string? userId, string? guestId) GetIdentityReadOnly()
        {
            var userId = GetUserId();
            if (!string.IsNullOrEmpty(userId))
                return (userId, null);

            Request.Cookies.TryGetValue("guest_id", out var guestId);
            return (null, string.IsNullOrWhiteSpace(guestId) ? null : guestId);
        }

        /// <summary>Identity resolution for mutating endpoints. Mints a guest cookie if needed.</summary>
        private (string? userId, string guestId) GetOrCreateIdentity()
        {
            var userId = GetUserId();

            if (Request.Cookies.TryGetValue("guest_id", out var existing) &&
                !string.IsNullOrWhiteSpace(existing))
            {
                return (userId, existing);
            }

            var guestId = Guid.NewGuid().ToString();

            Response.Cookies.Append(
                "guest_id",
                guestId,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(30)
                });

            return (userId, guestId);
        }

        // ---------------------------------------------------------------
        // ADD
        // ---------------------------------------------------------------

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart(
            [FromBody] AddCartItemDto dto,
            CancellationToken ct)
        {
            var (userId, guestId) = GetOrCreateIdentity();

            // Retry a couple of times in case two rapid "add" clicks race
            // each other (both see "no existing row" and both insert).
            // This assumes a unique index in the DB on
            // (UserId, ProductId, ProductVariantId) and
            // (GuestId, ProductId, ProductVariantId) — add one if it
            // doesn't exist yet; without it, this fix only reduces the
            // race window, it doesn't close it.
            const int maxAttempts = 3;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    var cartItem = await _context.Carts
                        .FirstOrDefaultAsync(x =>
                            x.ProductId == dto.ProductId &&
                            x.ProductVariantId == dto.VariantId &&
                            (
                                (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                                (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                            ), ct);

                    if (cartItem != null)
                    {
                        cartItem.Quantity += dto.Quantity;
                    }
                    else
                    {
                        // Only need SellerId, so project instead of loading the full product.
                        var sellerId = await _context.Products
                            .Where(x => x.Id == dto.ProductId)
                            .Select(x => (int?)x.SellerId)
                            .FirstOrDefaultAsync(ct);

                        _context.Carts.Add(new CartModel
                        {
                            ProductId = dto.ProductId,
                            ProductVariantId = dto.VariantId,
                            Quantity = dto.Quantity,
                            UserId = userId,
                            GuestId = string.IsNullOrEmpty(userId) ? guestId : null,
                            SellerId = sellerId,
                            CreatedDate = DateTime.UtcNow
                        });
                    }

                    await _context.SaveChangesAsync(ct);

                    var cartCount = await GetCartCountAsync(userId, guestId, ct);

                    return Ok(new { success = true, cartCount });
                }
                catch (DbUpdateException) when (attempt < maxAttempts)
                {
                    // Lost the race to a concurrent insert for the same
                    // (identity, product, variant). Detach the failed
                    // entity and retry — the next pass will find the row
                    // the other request just created and update it instead.
                    foreach (var entry in _context.ChangeTracker.Entries().ToList())
                        entry.State = EntityState.Detached;
                }
            }

            _logger.LogWarning(
                "AddToCart failed after {Attempts} attempts for product {ProductId}/{VariantId}",
                maxAttempts, dto.ProductId, dto.VariantId);

            return Conflict(new
            {
                success = false,
                message = "Could not add item to cart, please try again."
            });
        }

        // ---------------------------------------------------------------
        // UPDATE
        // ---------------------------------------------------------------

        [HttpPut("update")]
        public async Task<IActionResult> UpdateQuantity(
            [FromBody] AddCartItemDto dto,
            CancellationToken ct)
        {
            var (userId, guestId) = GetOrCreateIdentity();

            var item = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId == dto.VariantId &&
                    (
                        (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                        (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                    ), ct);

            if (item == null)
                return NotFound();

            if (dto.Quantity <= 0)
                _context.Carts.Remove(item);
            else
                item.Quantity = dto.Quantity;

            await _context.SaveChangesAsync(ct);

            var (summary, cartCount) = await GetSummaryAndCountAsync(userId, guestId, ct);

            return Ok(new { success = true, cartCount, summary });
        }

        // ---------------------------------------------------------------
        // READS — all AsNoTracking, and guests with no cookie yet
        // short-circuit before touching the database at all.
        // ---------------------------------------------------------------

        [HttpGet("")]
        public async Task<IActionResult> GetCart(CancellationToken ct)
        {
            var (userId, guestId) = GetIdentityReadOnly();

            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(guestId))
                return Ok(Array.Empty<object>());

            var items = await _context.Carts
                .AsNoTracking()
                .Where(x =>
                    (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && x.GuestId == guestId))
                .Select(c => new
                {
                    variantId = c.ProductVariantId,
                    productId = c.ProductId,
                    name = c.Product.Name,
                    image = c.Product.ImageUrl,
                    variantName = c.ProductVariant.Model,
                    price = c.ProductVariant.Price,
                    quantity = c.Quantity,
                    finalPrice = c.FinalPrice
                })
                .ToListAsync(ct);

            return Ok(items);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetCartCount(CancellationToken ct)
        {
            var (userId, guestId) = GetIdentityReadOnly();

            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(guestId))
                return Ok(0);

            return Ok(await GetCartCountAsync(userId, guestId, ct));
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct)
        {
            var (userId, guestId) = GetIdentityReadOnly();

            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(guestId))
                return Ok(await _cartCalculation.CalculateAsync(null, "", null));

            var couponCode = await GetActiveCouponCodeAsync(userId, guestId, ct);
            var totals = await _cartCalculation.CalculateAsync(userId, guestId ?? "", couponCode);

            return Ok(totals);
        }

        // ---------------------------------------------------------------
        // COUPONS
        // ---------------------------------------------------------------

        [HttpPost("apply-coupon")]
        public async Task<IActionResult> ApplyCoupon(
            [FromBody] CouponDto dto,
            CancellationToken ct)
        {
            var (userId, guestId) = GetOrCreateIdentity();

            if (string.IsNullOrWhiteSpace(dto.Code))
            {
                return BadRequest(new { success = false, message = "Please enter coupon code" });
            }

            var code = dto.Code.Trim().ToUpper();

            if (!_couponService.IsValidCoupon(code))
            {
                return Ok(new { success = false, message = "Invalid coupon code", couponDiscount = 0 });
            }

            var checkoutSession = await _context.CheckoutSessions
                .FirstOrDefaultAsync(x =>
                    x.IsActive &&
                    ((userId != null && x.UserId == userId) ||
                     (userId == null && x.GuestId == guestId)), ct);

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

            await _context.SaveChangesAsync(ct);

            var totals = await _cartCalculation.CalculateAsync(userId, guestId, code);

            return Ok(new
            {
                success = true,
                message = "Coupon applied successfully",
                couponDiscount = totals.CouponDiscount,
                summary = totals
            });
        }

        [HttpDelete("remove-coupon")]
        public async Task<IActionResult> RemoveCoupon(CancellationToken ct)
        {
            var (userId, guestId) = GetOrCreateIdentity();

            // ExecuteUpdate avoids loading the entity just to null one column.
            await _context.CheckoutSessions
                .Where(x =>
                    x.IsActive &&
                    ((userId != null && x.UserId == userId) ||
                     (userId == null && x.GuestId == guestId)))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.CouponCode, (string?)null)
                    .SetProperty(x => x.ModifiedDate, DateTime.UtcNow), ct);

            var totals = await _cartCalculation.CalculateAsync(userId, guestId, null);

            return Ok(new { success = true, summary = totals });
        }

        // ---------------------------------------------------------------
        // REMOVE
        // ---------------------------------------------------------------

        [HttpDelete("remove/{variantId}")]
        public async Task<IActionResult> Remove(int variantId, CancellationToken ct)
        {
            var (userId, guestId) = GetOrCreateIdentity();

            var deleted = await _context.Carts
                .Where(x =>
                    x.ProductVariantId == variantId &&
                    (
                        (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                        (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                    ))
                .ExecuteDeleteAsync(ct);

            if (deleted == 0)
                return NotFound(new { success = false });

            var (summary, cartCount) = await GetSummaryAndCountAsync(userId, guestId, ct);

            return Ok(new { success = true, cartCount, summary });
        }

        // ---------------------------------------------------------------
        // SYNC (guest cart -> logged-in user cart)
        //
        // Done as two set-based operations instead of loading every row
        // into memory: first fold guest rows into matching existing user
        // rows (sum quantities, drop the guest duplicate), then reassign
        // whatever guest rows are left over.
        // ---------------------------------------------------------------

        [HttpPost("sync")]
        public async Task<IActionResult> Sync(CancellationToken ct)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!Request.Cookies.TryGetValue("guest_id", out var guestId) ||
                string.IsNullOrWhiteSpace(guestId))
            {
                return Ok(new { success = true });
            }

            var existingUserKeys = await _context.Carts
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new { x.ProductId, x.ProductVariantId })
                .ToListAsync(ct);

            var guestItems = await _context.Carts
                .Where(x => x.GuestId == guestId)
                .ToListAsync(ct);

            foreach (var guestItem in guestItems)
            {
                var match = existingUserKeys.Any(k =>
                    k.ProductId == guestItem.ProductId &&
                    k.ProductVariantId == guestItem.ProductVariantId);

                if (match)
                {
                    // Fold quantity into the existing user row, drop the guest row.
                    await _context.Carts
                        .Where(x =>
                            x.UserId == userId &&
                            x.ProductId == guestItem.ProductId &&
                            x.ProductVariantId == guestItem.ProductVariantId)
                        .ExecuteUpdateAsync(s => s
                            .SetProperty(x => x.Quantity, x => x.Quantity + guestItem.Quantity), ct);

                    _context.Carts.Remove(guestItem);
                }
                else
                {
                    guestItem.UserId = userId;
                    guestItem.GuestId = null;
                }
            }

            await _context.SaveChangesAsync(ct);

            Response.Cookies.Delete("guest_id");

            return Ok(new { success = true });
        }

        // ---------------------------------------------------------------
        // FULL CART (cart page payload)
        // ---------------------------------------------------------------

        [HttpGet("full")]
        public async Task<IActionResult> GetFullCart(CancellationToken ct)
        {
            var (userId, guestId) = GetIdentityReadOnly();

            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(guestId))
            {
                return Ok(new
                {
                    success = true,
                    items = Array.Empty<object>(),
                    summary = await _cartCalculation.CalculateAsync(null, "", null),
                    cartCount = 0
                });
            }

            try
            {
                var carts = await _context.Carts
                    .AsNoTracking()
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                        .ThenInclude(v => v.Images)
                    .Where(x =>
                        (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                        (string.IsNullOrEmpty(userId) && x.GuestId == guestId))
                    .ToListAsync(ct);

                var couponCode = await GetActiveCouponCodeAsync(userId, guestId, ct);
                var totals = await _cartCalculation.CalculateAsync(userId, guestId ?? "", couponCode);

                var items = carts.Select(c =>
                {
                    var variant = c.ProductVariant;
                    var product = c.Product;

                    decimal originalPrice = variant?.Price ?? 0;
                    decimal discountPercent = product?.DiscountPercentage ?? 0;

                    decimal finalPrice =
                        product?.IsHotDeal == true && discountPercent > 0
                            ? originalPrice - (originalPrice * discountPercent / 100m)
                            : originalPrice;

                    var variantImage = variant?.Images?
                        .OrderBy(i => i.DisplayOrder)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault();

                    return new
                    {
                        variantId = c.ProductVariantId,
                        productId = c.ProductId,
                        name = product?.Name ?? "",
                        image = variantImage ?? product?.ImageUrl ?? "/images/no-image.png",
                        images = variant?.Images?
                            .OrderBy(i => i.DisplayOrder)
                            .Select(i => i.ImageUrl)
                            .ToList() ?? new List<string>(),
                        variantName = variant?.Model ?? "",
                        price = originalPrice,
                        finalPrice = finalPrice,
                        discountPercentage = discountPercent,
                        quantity = c.Quantity,
                        lineTotal = finalPrice * c.Quantity,
                        gstPercentage = product?.GSTPercentage ?? 0,
                        stepQuantity = variant?.StepQuantity ?? 1,
                        minQuantity = variant?.MinQuantity ?? 1,
                        maxQuantity = variant?.MaxQuantity,
                        stockQuantity = variant?.StockQuantity ?? 0,
                        hasStock = (variant?.StockQuantity ?? 0) > 0
                    };
                }).ToList();

                var cartCount = items.Sum(i => i.quantity);

                return Ok(new { success = true, items, summary = totals, cartCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load full cart for user {UserId} / guest {GuestId}", userId, guestId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to load cart. Please try again."
                });
            }
        }

        // ---------------------------------------------------------------
        // Shared helpers — keep the "count" and "coupon lookup" queries
        // in one place instead of duplicating the identity predicate
        // and re-querying separately in every action.
        // ---------------------------------------------------------------

        private async Task<int> GetCartCountAsync(string? userId, string? guestId, CancellationToken ct)
        {
            return await _context.Carts
                .AsNoTracking()
                .Where(c =>
                    (!string.IsNullOrEmpty(userId) && c.UserId == userId) ||
                    (string.IsNullOrEmpty(userId) && c.GuestId == guestId))
                .SumAsync(c => (int?)c.Quantity, ct) ?? 0;
        }

        private async Task<string?> GetActiveCouponCodeAsync(string? userId, string? guestId, CancellationToken ct)
        {
            return await _context.CheckoutSessions
                .AsNoTracking()
                .Where(x =>
                    x.IsActive &&
                    ((userId != null && x.UserId == userId) ||
                     (userId == null && x.GuestId == guestId)))
                .Select(x => x.CouponCode)
                .FirstOrDefaultAsync(ct);
        }

        private async Task<(object summary, int cartCount)> GetSummaryAndCountAsync(
            string? userId, string? guestId, CancellationToken ct)
        {
            var couponCode = await GetActiveCouponCodeAsync(userId, guestId, ct);
            var summary = await _cartCalculation.CalculateAsync(userId, guestId ?? "", couponCode);
            var cartCount = await GetCartCountAsync(userId, guestId, ct);
            return (summary, cartCount);
        }

        public class RemoveCartDto
        {
            public int VariantId { get; set; }
        }
    }
}
