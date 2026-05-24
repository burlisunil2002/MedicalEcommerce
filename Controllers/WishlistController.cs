using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.DTOs;


[ApiController]
[Route("api/wishlist")]
public class WishlistController : Controller
{
    private readonly ApplicationDbContext _context;

    private readonly IWebHostEnvironment _env;

    public WishlistController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
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
        var (userId, guestId) = GetIdentity();

        var query = _context.Wishlists.AsQueryable();

        if (!string.IsNullOrEmpty(userId))
            query = query.Where(x => x.UserId == userId);
        else
            query = query.Where(x => x.GuestId == guestId);

        var items = await query
            .Include(x => x.Product)
            .ThenInclude(p => p.Variants)
            .Select(x => new
            {
                id = x.Product.Id,
                variantId = x.ProductVariantId,
                name = x.Product.Name,
                brand = x.Product.Brand,

                imageUrl = x.Product.ImageUrl,

                discount = x.Product.DiscountPercentage,
                isHotDeal = x.Product.IsHotDeal,

                priceType = (x.Product.PriceType ?? "").ToLower(),

                variants = x.Product.Variants.Select(v => new
                {
                    productVariantId = v.ProductVariantId,
                    id = v.ProductVariantId,
                    price = v.Price,
                    imageUrl = v.ImageUrl,
                    minQuantity = v.MinQuantity,
                    maxQuantity = v.MaxQuantity,
                    stepQuantity = v.StepQuantity
                }).ToList(),

                defaultVariant = x.Product.Variants
    .Where(v => v.ProductVariantId == x.ProductVariantId) // 🔥 IMPORTANT
    .Select(v => new
    {
        productVariantId = v.ProductVariantId,
        id = v.ProductVariantId,
        price = v.Price,
        imageUrl = v.ImageUrl,
        minQuantity = v.MinQuantity,
        maxQuantity = v.MaxQuantity,
        stepQuantity = v.StepQuantity
    })
    .FirstOrDefault()
            })
            .ToListAsync(); // ✅ THIS WAS MISSING

        return Ok(items);
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

            return Ok(new { added = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
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

        return Ok(count);
    }

    // 🔥 SYNC GUEST → USER (IMPORTANT)
    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] List<int> productIds)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var (_, guestId) = GetIdentity();

        var existing = await _context.Wishlists
            .Where(x => x.UserId == userId)
            .Select(x => x.ProductId)
            .ToListAsync();

        var newItems = productIds
            .Where(pid => !existing.Contains(pid))
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

        return Ok(new { success = true });
    }
}