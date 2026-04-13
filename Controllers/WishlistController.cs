using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

public class WishlistController : Controller
{
    private readonly ApplicationDbContext _context;

    public WishlistController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string GetOrCreateGuestId()
    {
        if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
            || string.IsNullOrEmpty(guestId))
        {
            guestId = Guid.NewGuid().ToString();

            Response.Cookies.Append("guest_id", guestId, new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // 🔥 important for production
                SameSite = SameSiteMode.Lax,
                Path = "/",
                IsEssential = true,
                Expires = DateTime.UtcNow.AddDays(7)
            });
        }

        return guestId;
    }

    // 🔥 ADD / REMOVE
    [HttpPost]
    public async Task<IActionResult> Toggle(int productId)
    {
        var userId = User.Identity.IsAuthenticated
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var guestId = GetOrCreateGuestId();

        var item = await _context.Wishlists.FirstOrDefaultAsync(x =>
            x.ProductId == productId &&
            (x.UserId == userId || x.GuestId == guestId));

        if (item != null)
        {
            _context.Wishlists.Remove(item);
            await _context.SaveChangesAsync();
            return Json(new { added = false });
        }

        _context.Wishlists.Add(new WishlistModel
        {
            ProductId = productId,
            UserId = userId,
            GuestId = guestId
        });

        await _context.SaveChangesAsync();

        return Json(new { added = true });
    }

    // 🔥 COUNT
    public IActionResult Count()
    {
        var userId = User.Identity.IsAuthenticated
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var guestId = GetOrCreateGuestId();

        var count = _context.Wishlists
            .Count(x => x.UserId == userId || x.GuestId == guestId);

        return Json(count);
    }

    // 🔥 PAGE
    public IActionResult Index()
    {
        var userId = User.Identity.IsAuthenticated
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var guestId = GetOrCreateGuestId();

        var items = _context.Wishlists
            .Where(x => x.UserId == userId || x.GuestId == guestId)
            .Include(x => x.Product)
            .Select(x => new ProductViewModel
            {
                Id = x.Product.Id,
                Name = x.Product.Name,
                Price = x.Product.Price,
                PriceType = x.Product.PriceType,
                ImageUrl = x.Product.ImageUrl,
                IsHotDeal = x.Product.IsHotDeal,
                DiscountPercentage = x.Product.DiscountPercentage,
                DealEndDate = x.Product.DealEndDate
            })
            .ToList();

        return View(items);
    }
}