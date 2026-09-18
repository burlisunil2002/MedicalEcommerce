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
            var carts = await _context.Carts
                .AsNoTracking()
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                .Where(c =>
                    (
                        !string.IsNullOrWhiteSpace(userId) &&
                        c.UserId == userId
                    )
                    ||
                    (
                        string.IsNullOrWhiteSpace(userId) &&
                        !string.IsNullOrWhiteSpace(guestId) &&
                        c.GuestId == guestId
                    )
                )
                .ToListAsync();

            decimal subtotal = 0m;
            decimal productDiscount = 0m;

            // -------------------------------------------------
            // PRODUCT TOTALS
            // Product prices are GST-INCLUSIVE
            // -------------------------------------------------

            foreach (var cartItem in carts)
            {
                if (
                    cartItem.Product == null ||
                    cartItem.ProductVariant == null
                )
                {
                    continue;
                }

                var quantity =
                    Math.Max(
                        1,
                        cartItem.Quantity
                    );

                var originalPrice =
                    Math.Max(
                        0m,
                        cartItem.ProductVariant.Price
                    );

                var discountPercentage =
                    Math.Max(
                        0m,
                        cartItem.Product.DiscountPercentage ?? 0m
                    );

                var finalUnitPrice =
                    cartItem.Product.IsHotDeal &&
                    discountPercentage > 0m
                        ? originalPrice -
                          (
                              originalPrice *
                              discountPercentage /
                              100m
                          )
                        : originalPrice;

                finalUnitPrice =
                    Math.Max(
                        0m,
                        finalUnitPrice
                    );

                var originalLineTotal =
                    originalPrice *
                    quantity;

                var finalLineTotal =
                    finalUnitPrice *
                    quantity;

                var itemDiscount =
                    originalLineTotal -
                    finalLineTotal;

                subtotal += finalLineTotal;

                productDiscount +=
                    Math.Max(
                        0m,
                        itemDiscount
                    );
            }

            subtotal =
                Math.Round(
                    subtotal,
                    2,
                    MidpointRounding.AwayFromZero
                );

            productDiscount =
                Math.Round(
                    productDiscount,
                    2,
                    MidpointRounding.AwayFromZero
                );

            // -------------------------------------------------
            // COUPON
            // Coupon is applied to the GST-INCLUSIVE
            // product selling amount.
            // -------------------------------------------------

            var couponDiscount =
                _couponService.CalculateDiscount(
                    couponCode,
                    subtotal
                );

            couponDiscount =
                Math.Clamp(
                    Math.Round(
                        couponDiscount,
                        2,
                        MidpointRounding.AwayFromZero
                    ),
                    0m,
                    subtotal
                );

            // -------------------------------------------------
            // DELIVERY
            // -------------------------------------------------

            decimal delivery =
                subtotal >= 500m
                    ? 0m
                    : 80m;

            // -------------------------------------------------
            // FINAL PAYABLE
            // -------------------------------------------------

            var total =
                subtotal +
                delivery -
                couponDiscount;

            total =
                Math.Max(
                    0m,
                    total
                );

            total =
                Math.Round(
                    total,
                    2,
                    MidpointRounding.AwayFromZero
                );

            // -------------------------------------------------
            // GST-INCLUSIVE EXTRACTION
            //
            // IMPORTANT:
            // GST is NOT added to subtotal.
            // It is extracted from the GST-inclusive amount.
            //
            // Coupon is a reduction of the customer-facing
            // product amount, so GST shown here is based on
            // the amount after coupon.
            // -------------------------------------------------

            decimal amountAfterCoupon =
                Math.Max(
                    0m,
                    subtotal - couponDiscount
                );

            decimal gst = 0m;

            decimal taxableAmount =
                0m;

            if (carts.Count > 0)
            {
                foreach (var cartItem in carts)
                {
                    if (
                        cartItem.Product == null ||
                        cartItem.ProductVariant == null
                    )
                    {
                        continue;
                    }

                    var quantity =
                        Math.Max(
                            1,
                            cartItem.Quantity
                        );

                    var originalPrice =
                        Math.Max(
                            0m,
                            cartItem.ProductVariant.Price
                        );

                    var discountPercentage =
                        Math.Max(
                            0m,
                            cartItem.Product.DiscountPercentage ?? 0m
                        );

                    var finalUnitPrice =
                        cartItem.Product.IsHotDeal &&
                        discountPercentage > 0m
                            ? originalPrice -
                              (
                                  originalPrice *
                                  discountPercentage /
                                  100m
                              )
                            : originalPrice;

                    finalUnitPrice =
                        Math.Max(
                            0m,
                            finalUnitPrice
                        );

                    var lineAmount =
                        finalUnitPrice *
                        quantity;

                    // Allocate coupon proportionally
                    // across product lines.
                    decimal allocatedCoupon = 0m;

                    if (
                        subtotal > 0m &&
                        couponDiscount > 0m
                    )
                    {
                        allocatedCoupon =
                            couponDiscount *
                            lineAmount /
                            subtotal;
                    }

                    var lineAfterCoupon =
                        Math.Max(
                            0m,
                            lineAmount -
                            allocatedCoupon
                        );

                    var gstPercentage =
                        Math.Max(
                            0m,
                            cartItem.Product.GSTPercentage
                        );

                    // GST-inclusive extraction
                    var lineGst =
                        gstPercentage > 0m
                            ? lineAfterCoupon *
                              gstPercentage /
                              (100m + gstPercentage)
                            : 0m;

                    var lineTaxable =
                        lineAfterCoupon -
                        lineGst;

                    gst += lineGst;

                    taxableAmount +=
                        lineTaxable;
                }
            }

            gst =
                Math.Round(
                    gst,
                    2,
                    MidpointRounding.AwayFromZero
                );

            taxableAmount =
                Math.Round(
                    taxableAmount,
                    2,
                    MidpointRounding.AwayFromZero
                );

            // -------------------------------------------------
            // RETURN
            // -------------------------------------------------

            return new CartTotalsDto
            {
                Subtotal =
                    subtotal,

                GST =
                    gst,

                CouponDiscount =
                    couponDiscount,

                Delivery =
                    delivery,

                Saved =
                    productDiscount +
                    couponDiscount,

                Total =
                    total
            };
        }
    }
}