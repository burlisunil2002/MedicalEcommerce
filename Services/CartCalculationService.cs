using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public interface ICartCalculationService
    {
        Task<CartTotalsDto> CalculateAsync(string userId, string guestId, string couponCode);
    }

    public class CartCalculationService : ICartCalculationService
    {
        private readonly ApplicationDbContext _context;

        public CartCalculationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CartTotalsDto> CalculateAsync(string userId, string guestId, string couponCode)
        {
            var carts = await _context.Carts
    .Include(c => c.Product)
    .Include(c => c.ProductVariant)
    .Where(c =>
        (userId != null && c.UserId == userId) ||
        (userId == null && c.GuestId == guestId))
    .ToListAsync();

            decimal subtotal = 0;
            decimal gst = 0;
            decimal discount = 0;

            foreach (var c in carts)
            {
                if (c.Product == null)
                    continue;

                decimal original =
                    c.ProductVariant?.Price ?? 0;

                decimal discountPercentage =
    c.Product?.DiscountPercentage ?? 0;

                decimal final =
                    c.Product?.IsHotDeal == true &&
                    discountPercentage > 0
                        ? original - (original * discountPercentage / 100)
                        : original;

                decimal saved = original - final;

                decimal net = final * c.Quantity;

                decimal gstPercent =
     c.Product?.GSTPercentage ?? 0;

                decimal gstAmount =
                    net * (gstPercent / 100m);

                subtotal += net;
                gst += gstAmount;
                discount += saved * c.Quantity;
            }

            // 🎟️ COUPON
            decimal couponDiscount = 0;

            if (!string.IsNullOrEmpty(couponCode))
            {
                if (couponCode == "SAVE10")
                    couponDiscount = subtotal * 0.10m;

                else if (couponCode == "SAVE20")
                    couponDiscount = subtotal * 0.20m;

            }

            // 🚚 DELIVERY
            decimal delivery = subtotal > 0 && subtotal < 20 ? 5 : 0;

            decimal total = subtotal + gst + delivery - couponDiscount;

            return new CartTotalsDto
            {
                Subtotal = subtotal,
                GST = gst,
                CouponDiscount = couponDiscount,
                Delivery = delivery,
                Saved = discount,
                Total = Math.Round(total, 2)
            };
        }
    }
}