namespace VivekMedicalProducts.Models
{
    public class SubscriptionModel
    {
        public int Id { get; set; }

        public int SellerId { get; set; }

        public int Years { get; set; }
        public string ProductRange { get; set; }

        public decimal Amount { get; set; }

        public DateTime? StartDate { get; set; }  // ✅ nullable
        public DateTime? EndDate { get; set; }    // ✅ nullable

        public string RazorpayOrderId { get; set; }
        public string? PaymentId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Pending";
    }
}
