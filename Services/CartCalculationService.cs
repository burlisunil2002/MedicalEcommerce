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
                .Where(c =>
                    (userId != null && c.UserId == userId) ||
                    (userId == null && c.GuestId == guestId))
                .ToListAsync();

            decimal subtotal = 0;
            decimal gst = 0;
            decimal discount = 0;

            foreach (var c in carts)
            {
                decimal original = c.Product.Price;

                // 🔥 HOT DEAL
                decimal final = c.Product.IsHotDeal && c.Product.DiscountPercentage > 0
                    ? original - (original * c.Product.DiscountPercentage.Value / 100)
                    : original;

                decimal saved = original - final;

                decimal net = final * c.Quantity;
                decimal gstAmount = net * (c.Product.GSTPercentage / 100m);

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

                else if (couponCode == "FLAT100")
                    couponDiscount = 100;
            }

            // 🚚 DELIVERY
            decimal delivery = subtotal >= 20 ? 0 : 5;

            decimal total = subtotal + gst + delivery - couponDiscount;

            return new CartTotalsDto
            {
                Subtotal = subtotal,
                GST = gst,
                Discount = discount + couponDiscount,
                Delivery = delivery,
                GrandTotal = Math.Round(total, 2)
            };
        }
    }
}