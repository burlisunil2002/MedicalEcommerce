namespace VivekMedicalProducts.Models
{
    public class SubscriptionRequestDto
    {
        public string Plan { get; set; }   // ✅ main input
        public string ProductRange { get; set; }
    }

    public class SubscriptionPaymentDto
    {
        public string razorpay_order_id { get; set; }
        public string razorpay_payment_id { get; set; }
        public string razorpay_signature { get; set; }
    }
}
