using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

[ApiController]
[Route("api/checkout")]
public class CheckoutController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;
    private readonly ICartCalculationService _calc;

    public CheckoutController(
        ApplicationDbContext context,
        IUserContextService userContext,
        ICartCalculationService calc)
    {
        _context = context;
        _userContext = userContext;
        _calc = calc;
    }

    private (string? userId, string? guestId) GetIdentity()
    {
        var userId = _userContext.GetUserId();

        var guestId =
            string.IsNullOrEmpty(userId)
            ? Request.Cookies["guest_id"]
            : null;

        return (userId, guestId);
    }

    [HttpGet]
    public async Task<IActionResult> GetCheckout()
    {
        var (userId, guestId) = GetIdentity();

        var coupon =
            HttpContext.Session.GetString("CouponCode");

        var cartItems = await _context.Carts
            .Include(c => c.Product)
            .Include(c => c.ProductVariant)
            .Where(c =>
                (userId != null && c.UserId == userId) ||
                (userId == null && c.GuestId == guestId))
            .Select(c => new
            {
                c.Id,
                c.Quantity,

                ProductId = c.ProductId,
                ProductName = c.Product.Name,

                ProductPrice = c.ProductVariant != null
        ? c.ProductVariant.Price
        : 0,

                ProductImage = c.Product.ImageUrl,

                VariantId = c.ProductVariantId,

                VariantName = c.ProductVariant != null
        ? c.ProductVariant.Model
        : null
            })
            .ToListAsync();

        var addresses = await _context.UserAddresses
            .Where(x =>
                (userId != null && x.UserId == userId) ||
                (userId == null && x.GuestId == guestId))
            .OrderByDescending(x => x.IsDefault)
            .ToListAsync();

        try
        {
            var totals = await _calc.CalculateAsync(
                userId,
                guestId,
                coupon);

            return Ok(new
            {
                cartItems,
                addresses,
                summary = totals
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("address")]
    public async Task<IActionResult> AddAddress(
    [FromBody] UserAddress model)
    {
        var (userId, guestId) = GetIdentity();

        model.UserId = userId;
        model.GuestId = guestId;

        _context.UserAddresses.Add(model);

        await _context.SaveChangesAsync();

        return Ok(model);
    }

    [HttpPut("address/{id}")]
    public async Task<IActionResult> UpdateAddress(
    int id,
    [FromBody] UserAddress model)
    {
        var address =
            await _context.UserAddresses.FindAsync(id);

        if (address == null)
            return NotFound();

        address.FullName = model.FullName;
        address.MobileNumber = model.MobileNumber;
        address.AddressLine1 = model.AddressLine1;
        address.City = model.City;
        address.State = model.State;
        address.Pincode = model.Pincode;
        address.AddressType = model.AddressType;

        await _context.SaveChangesAsync();

        return Ok(address);
    }
}