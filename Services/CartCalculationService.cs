using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public interface ICartCalculationService
    {
        Task<CartTotalsDto> CalculateAsync(
            string? userId,
            string? guestId,
            string? couponCode
        );
    }

    public class CartCalculationService
        : ICartCalculationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICouponService _couponService;

        public CartCalculationService(
            ApplicationDbContext context,
            ICouponService couponService)
        {
            _context = context;
            _couponService = couponService;
        }

        public async Task<CartTotalsDto> CalculateAsync(
            string? userId,
            string? guestId,
            string? couponCode)
        {
            var carts =
                await _context.Carts
                    .Include(c => c.Product)
                    .Include(c => c.ProductVariant)
                    .Where(c =>
                        (!string.IsNullOrEmpty(userId) &&
                         c.UserId == userId)
                        ||
                        (string.IsNullOrEmpty(userId) &&
                         c.GuestId == guestId))
                    .ToListAsync();

            decimal subtotal = 0;
            decimal gst = 0;
            decimal saved = 0;

            foreach (var c in carts)
            {
                if (
                    c.Product == null ||
                    c.ProductVariant == null
                )
                    continue;

                decimal originalPrice =
                    c.ProductVariant.Price;

                decimal discountPercent =
                    c.Product?.DiscountPercentage ?? 0;

                decimal finalPrice =
                    c.Product?.IsHotDeal == true &&
                    discountPercent > 0
                        ? originalPrice -
                          (
                              originalPrice *
                              discountPercent / 100m
                          )
                        : originalPrice;

                decimal itemSaved =
                    originalPrice - finalPrice;

                decimal lineTotal =
                    finalPrice * c.Quantity;

                decimal gstPercent =
                    c.Product?.GSTPercentage ?? 0;

                decimal gstAmount =
                    lineTotal *
                    gstPercent / 100m;

                subtotal += lineTotal;
                gst += gstAmount;
                saved += itemSaved * c.Quantity;
            }

            decimal couponDiscount =
                _couponService.CalculateDiscount(
                    couponCode,
                    subtotal
                );

            decimal delivery =
                subtotal >= 500
                    ? 0
                    : 80;

            decimal total =
                subtotal +
                gst +
                delivery -
                couponDiscount;

            if (total < 0)
                total = 0;

            return new CartTotalsDto
            {
                Subtotal =
                    Math.Round(subtotal, 2),

                GST =
                    Math.Round(gst, 2),

                CouponDiscount =
                    Math.Round(couponDiscount, 2),

                Delivery =
                    Math.Round(delivery, 2),

                Saved =
                    Math.Round(saved, 2),

                Total =
                    Math.Round(total, 2)
            };
        }
    }
}
