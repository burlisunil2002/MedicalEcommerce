namespace VivekMedicalProducts.Models
{
    public class CartTotalsDto
    {
        public decimal Subtotal { get; set; }

        public decimal GST { get; set; }

        public decimal Saved { get; set; }

        public decimal CouponDiscount { get; set; }

        public decimal Delivery { get; set; }

        public decimal Total { get; set; }
    }
}