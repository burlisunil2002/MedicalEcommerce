using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        public string? UserId { get; set; }

        public string? GuestId { get; set; }

        public int? SellerId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        // Address reference
        public int? UserAddressId { get; set; }

        [ForeignKey(nameof(UserAddressId))]
        public UserAddress? UserAddress { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }

        public string Currency { get; set; } = "INR";

        public string OrderStatus { get; set; } = "Pending";

        public string PaymentStatus { get; set; } = "Created";

        public string? RazorpayOrderId { get; set; }

        public string? RazorpayPaymentId { get; set; }

        public string? RazorpaySignature { get; set; }

        public bool IsPaymentVerified { get; set; } = false;

        public DateTime? PaymentVerifiedAt { get; set; }

        public string? FailureReason { get; set; }

        public string? FailureCode { get; set; }

        public string? RefundId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? RefundAmount { get; set; }

        public string? RefundStatus { get; set; }

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }

        public DateTime OrderDate { get; set; }
            = DateTime.UtcNow;

        public string? CreatedBy { get; set; }

        public DateTime? OrderModifiedDate { get; set; }

        public string? UpdatedBy { get; set; }

        public DateTime? CancelledAt { get; set; }

        public string? CancelledBy { get; set; }

        public bool IsDeleted { get; set; } = false;

        public ICollection<OrderItemModel> OrderItems
        { get; set; }
            = new List<OrderItemModel>();
    }
}
