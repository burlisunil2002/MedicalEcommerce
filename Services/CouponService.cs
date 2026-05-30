
namespace VivekMedicalProducts.Services
{
    public interface ICouponService
    {
        decimal CalculateDiscount(
            string couponCode,
            decimal subtotal
        );

        bool IsValidCoupon(
            string couponCode
        );
    }

    public class CouponService :
        ICouponService
    {
        public decimal CalculateDiscount(
            string couponCode,
            decimal subtotal)
        {
            if (
                string.IsNullOrWhiteSpace(
                    couponCode
                )
            )
                return 0;

            couponCode =
                couponCode
                    .Trim()
                    .ToUpper();

            return couponCode switch
            {
                "FIRST20"
                    => subtotal * 0.20m,

                "SAVE10"
                    => subtotal * 0.10m,

                "FLAT100"
                    => 100m,

                _ => 0m
            };
        }

        public bool IsValidCoupon(
            string couponCode)
        {
            if (
                string.IsNullOrWhiteSpace(
                    couponCode
                )
            )
                return false;

            couponCode =
                couponCode
                    .Trim()
                    .ToUpper();

            return new[]
            {
                "FIRST20",
                "SAVE10",
                "FLAT100"
            }
            .Contains(couponCode);
        }
    }
}

