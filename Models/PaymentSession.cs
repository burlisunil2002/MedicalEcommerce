using System.ComponentModel.DataAnnotations;


namespace VivekMedicalProducts.Models
{
    public class PaymentSession
    {
        [Key]
        public int Id { get; set; }

        //--------------------------------------------------
        // Checkout
        //--------------------------------------------------

        public int CheckoutSessionId { get; set; }

        public string? UserId { get; set; }

        public string? GuestId { get; set; }

        //--------------------------------------------------
        // Payment Provider
        //--------------------------------------------------

        public string PaymentGateway { get; set; } = "Razorpay";

        public string PaymentMethod { get; set; } = "Online";
        // Online, COD, Card, UPI, Wallet

        public string RazorpayOrderId { get; set; } = string.Empty;

        public string? RazorpayPaymentId { get; set; }

        public string? RazorpaySignature { get; set; }

        //--------------------------------------------------
        // Financial Snapshot
        //--------------------------------------------------

        public decimal SubTotal { get; set; }

        public decimal ProductDiscount { get; set; }

        public decimal CouponDiscount { get; set; }

        public decimal ShippingCharge { get; set; }

        public decimal TaxableAmount { get; set; }

        public decimal GSTAmount { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "INR";

        //--------------------------------------------------
        // Coupon Snapshot
        //--------------------------------------------------

        public int? CouponId { get; set; }

        [MaxLength(100)]
        public string? CouponCode { get; set; }

        //--------------------------------------------------
        // Payment Status
        //--------------------------------------------------

        public string PaymentStatus { get; set; } = "Initiated";
        // Initiated
        // Pending
        // Completed
        // Failed
        // Cancelled
        // Refunded

        public bool IsCompleted { get; set; }

        public bool IsVerified { get; set; }

        //--------------------------------------------------
        // Failure
        //--------------------------------------------------

        public string? FailureReason { get; set; }

        //--------------------------------------------------
        // Refund
        //--------------------------------------------------

        public bool RefundInitiated { get; set; }

        public bool RefundCompleted { get; set; }

        public decimal RefundAmount { get; set; }

        public string? RefundTransactionId { get; set; }

        public DateTime? RefundDate { get; set; }

        //--------------------------------------------------
        // Audit
        //--------------------------------------------------

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? PaymentCompletedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        public DateTime ExpiryDate { get; set; }
            = DateTime.UtcNow.AddMinutes(30);

        //--------------------------------------------------
        // Retry Information
        //--------------------------------------------------

        public int RetryCount { get; set; }

        public DateTime? LastRetryDate { get; set; }

        //--------------------------------------------------
        // Soft Delete
        //--------------------------------------------------

        public bool IsDeleted { get; set; }

        public DateTime? DeletedDate { get; set; }
    }
}