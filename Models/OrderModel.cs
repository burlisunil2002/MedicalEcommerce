using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        // =====================================
        // Customer
        // =====================================

        public string? UserId { get; set; }

        public string? GuestId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        // =====================================
        // Order Details
        // =====================================

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        // =====================================
        // Shipping Address
        // =====================================

        public int? UserAddressId { get; set; }

        [ForeignKey(nameof(UserAddressId))]
        public UserAddress? UserAddress { get; set; }

        // =====================================
        // Order Summary
        // =====================================

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }

        public string Currency { get; set; } = "INR";

        // =====================================
        // Payment
        // =====================================

        // Payment
        public string PaymentMethod { get; set; } = "Online";
        // Online, COD, UPI, Card, NetBanking, Wallet

        public string PaymentStatus { get; set; } = "Pending";
        // Pending, Completed, Failed, Refunded, PartiallyRefunded

        public string? RazorpayOrderId { get; set; }

        public string? RazorpayPaymentId { get; set; }

        public string? RazorpaySignature { get; set; }

        public bool IsPaymentVerified { get; set; }

        public DateTime? PaymentDate { get; set; }

        public DateTime? PaymentVerifiedAt { get; set; }


        // Payment Failure

        public string? FailureReason { get; set; }

        public string? FailureCode { get; set; }

        // Full Order Refund
        // (Use only when entire payment is refunded)

        public string? RefundId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? RefundAmount { get; set; }

        public string? RefundStatus { get; set; }

        // =====================================
        // Security & Audit
        // =====================================

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }

        public string? CreatedBy { get; set; }

        public DateTime? OrderModifiedDate { get; set; }

        public string? UpdatedBy { get; set; }

        public bool IsDeleted { get; set; } = false;

        // =====================================
        // Navigation
        // =====================================

        public ICollection<OrderItemModel> OrderItems { get; set; }
            = new List<OrderItemModel>();
    }
}