using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Interfaces;


[ApiController]
[Route("api/wishlist")]
public class WishlistController : Controller
{
    private readonly ApplicationDbContext _context;

    private readonly IWebHostEnvironment _env;
    private readonly IAuditService _auditService;
    private readonly ILogger<WishlistController> _logger;

    public WishlistController(
        ApplicationDbContext context,
        IWebHostEnvironment env,
        IAuditService auditService,
        ILogger<WishlistController> logger)
    {
        _context = context;
        _env = env;
        _auditService = auditService;
        _logger = logger;
    }

    // Audit failures must never interrupt wishlist operations.
    private async Task LogAuditAsync(
        string action,
        string status = "Success",
        string? entityType = null,
        string? entityId = null,
        string? description = null,
        object? oldValues = null,
        object? newValues = null)
    {
        try
        {
            await _auditService.LogAsync(
                action: action,
                module: "Wishlist",
                status: status,
                entityType: entityType,
                entityId: entityId,
                description: description,
                oldValues: oldValues,
                newValues: newValues,
                cancellationToken: HttpContext.RequestAborted);
        }
        catch (Exception auditEx)
        {
            _logger.LogError(auditEx, "Failed to write wishlist audit log for {Action}", action);
        }
    }

    // 🔥 GET USER / GUEST IDENTIFIER
    private (string userId, string guestId) GetIdentity()
    {
        var userId = User.Identity.IsAuthenticated
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
            || string.IsNullOrEmpty(guestId))
        {
            guestId = Guid.NewGuid().ToString();

            var isProduction = _env.IsProduction();

            Response.Cookies.Append("guest_id", guestId, new CookieOptions
            {
                HttpOnly = true,
                Secure = isProduction, // 🔥 true in prod, false in local
                SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                IsEssential = true,
                Expires = DateTime.UtcNow.AddDays(7)
            });
        }

        return (userId, guestId);
    }

    // 🔥 GET ALL (FAST API FOR REACT)
    [HttpGet]
    public async Task<IActionResult> GetWishlist()
    {
        try
        {
            var (userId, guestId) =
                GetIdentity();

            var query =
                _context.Wishlists
                    .AsNoTracking()
                    .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(x =>
                    x.UserId == userId);
            }
            else
            {
                query = query.Where(x =>
                    x.GuestId == guestId);
            }

            var items = await query
                .Include(x => x.Product)
                    .ThenInclude(p => p.Variants)
                        .ThenInclude(v => v.Images)
                .Select(x => new
                {
                    id =
                        x.Product.Id,

                    variantId =
                        x.ProductVariantId,

                    name =
                        x.Product.Name,

                    brand =
                        x.Product.Brand,

                    imageUrl =
                        x.Product.ImageUrl,

                    discount =
                        x.Product
                            .DiscountPercentage,

                    isHotDeal =
                        x.Product.IsHotDeal,

                    priceType =
                        (x.Product.PriceType ?? "")
                            .ToLower(),

                    variants =
                        x.Product.Variants
                            .Where(v =>
                                v.Status ==
                                "Active")
                            .Select(v => new
                            {
                                productVariantId =
                                    v.ProductVariantId,

                                id =
                                    v.ProductVariantId,

                                price =
                                    v.Price,

                                imageUrl =
                                    v.Images
                                        .OrderBy(i =>
                                            i.DisplayOrder)
                                        .Select(i =>
                                            i.ImageUrl)
                                        .FirstOrDefault()
                                    ??
                                    x.Product.ImageUrl,

                                images =
                                    v.Images
                                        .OrderBy(i =>
                                            i.DisplayOrder)
                                        .Select(i =>
                                            i.ImageUrl)
                                        .ToList(),

                                minQuantity =
                                    v.MinQuantity,

                                maxQuantity =
                                    v.MaxQuantity,

                                stepQuantity =
                                    v.StepQuantity,

                                stockQuantity =
                                    v.StockQuantity
                            })
                            .ToList(),

                    defaultVariant =
                        x.Product.Variants
                            .Where(v =>
                                v.ProductVariantId ==
                                x.ProductVariantId)
                            .Select(v => new
                            {
                                productVariantId =
                                    v.ProductVariantId,

                                id =
                                    v.ProductVariantId,

                                price =
                                    v.Price,

                                imageUrl =
                                    v.Images
                                        .OrderBy(i =>
                                            i.DisplayOrder)
                                        .Select(i =>
                                            i.ImageUrl)
                                        .FirstOrDefault()
                                    ??
                                    x.Product.ImageUrl,

                                images =
                                    v.Images
                                        .OrderBy(i =>
                                            i.DisplayOrder)
                                        .Select(i =>
                                            i.ImageUrl)
                                        .ToList(),

                                minQuantity =
                                    v.MinQuantity,

                                maxQuantity =
                                    v.MaxQuantity,

                                stepQuantity =
                                    v.StepQuantity,

                                stockQuantity =
                                    v.StockQuantity
                            })
                            .FirstOrDefault()
                })
                .ToListAsync();

            await LogAuditAsync(
                action: "WishlistViewed",
                entityType: "Wishlist",
                description: $"Wishlist viewed; {items.Count} item(s) returned.");

            return Ok(new
            {
                success = true,
                items
            });
        }
        catch (Exception ex)
        {
            await LogAuditAsync(
                action: "WishlistViewed",
                status: "Failed",
                entityType: "Wishlist",
                description: "Failed to load wishlist.");

            return StatusCode(500,
                new
                {
                    success = false,
                    message =
                        "Failed to load wishlist.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
        }
    }

    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleRequest req)
    {

        try
        {
            if (req == null || req.ProductId <= 0)
                return BadRequest("Invalid productId");

            var productId = req.ProductId;
            var (userId, guestId) = GetIdentity();

            var item = await _context.Wishlists.FirstOrDefaultAsync(x =>
     x.ProductId == productId &&
     x.ProductVariantId == req.VariantId &&   // 🔥 ADD THIS
     (
         (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
         (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
     ));

            if (item != null)
            {
                _context.Wishlists.Remove(item);
                await _context.SaveChangesAsync();

                await LogAuditAsync(
                    action: "WishlistItemRemoved",
                    entityType: "WishlistItem",
                    entityId: $"{productId}:{req.VariantId}",
                    description: "Product removed from wishlist.",
                    oldValues: new { productId, variantId = req.VariantId },
                    newValues: new { added = false });

                return Ok(new { added = false });
            }

            _context.Wishlists.Add(new WishlistModel
            {
                ProductId = productId,
                ProductVariantId = req.VariantId,
                UserId = userId,
                GuestId = userId == null ? guestId : null
            });

            await _context.SaveChangesAsync();

            await LogAuditAsync(
                action: "WishlistItemAdded",
                entityType: "WishlistItem",
                entityId: $"{productId}:{req.VariantId}",
                description: "Product added to wishlist.",
                newValues: new { productId, variantId = req.VariantId, added = true });

            return Ok(new { added = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());

            await LogAuditAsync(
                action: "WishlistItemToggle",
                status: "Failed",
                entityType: "WishlistItem",
                description: "Failed to add or remove a wishlist item.");

            return StatusCode(500, ex.Message);
        }
    }

    // 🔥 COUNT (FAST)
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        var (userId, guestId) = GetIdentity();

        var count = await _context.Wishlists
            .Where(x =>
                (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
            )
            .CountAsync();

        await LogAuditAsync(
            action: "WishlistCountViewed",
            entityType: "Wishlist",
            description: $"Wishlist item count viewed; count={count}.");

        return Ok(count);
    }

    // 🔥 SYNC GUEST → USER (IMPORTANT)
    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] List<int> productIds)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await LogAuditAsync(
                action: "GuestWishlistSync",
                status: "Failed",
                entityType: "Wishlist",
                description: "Wishlist sync denied because the user was not authenticated.");

            return Unauthorized();
        }

        var (_, guestId) = GetIdentity();

        var existing = await _context.Wishlists
            .Where(x => x.UserId == userId)
            .Select(x => x.ProductId)
            .ToListAsync();

        var newProductIds = productIds
            .Where(pid => !existing.Contains(pid))
            .Distinct()
            .ToList();

        var newItems = newProductIds
            .Select(pid => new WishlistModel
            {
                ProductId = pid,
                UserId = userId
            });

        await _context.Wishlists.AddRangeAsync(newItems);

        // 🔥 CLEAN GUEST DATA
        var guestItems = _context.Wishlists.Where(x => x.GuestId == guestId);
        _context.Wishlists.RemoveRange(guestItems);

        await _context.SaveChangesAsync();

        await LogAuditAsync(
            action: "GuestWishlistSynced",
            entityType: "Wishlist",
            description: $"Guest wishlist synced to authenticated account; {newProductIds.Count} new product(s) added.",
            newValues: new { newProductCount = newProductIds.Count });

        return Ok(new { success = true });
    }
}