namespace VivekMedicalProducts.Models
{
    public class PaymentDto
    {
        public string razorpay_payment_id { get; set; } = string.Empty;
        public string razorpay_order_id { get; set; } = string.Empty;
        public string razorpay_signature { get; set; } = string.Empty;

        // optional but useful for debugging & fallback
        public int orderId { get; set; }
    }
}