using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VivekMedicalProducts.Models;

public class OrderItemModel
{
    [Key]
    public int OrderItemId { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int ProductVariantId { get; set; }

    public int? SellerId { get; set; }

    public string ProductName { get; set; } = "";

    public int Quantity { get; set; }

    // Original unit price
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    // Product discount
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    // Coupon allocation
    [Column(TypeName = "decimal(18,2)")]
    public decimal CouponDiscountAmount { get; set; }

    // Final paid by customer
    [Column(TypeName = "decimal(18,2)")]
    public decimal FinalPaidAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal GSTPercentage { get; set; }

    // GST Amount for this line
    [Column(TypeName = "decimal(18,2)")]
    public decimal GSTAmount { get; set; }

    // Total before GST
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxableAmount { get; set; }

    // Final amount after GST & coupon allocation
    [Column(TypeName = "decimal(18,2)")]
    public decimal NetAmount { get; set; }

    public string OrderItemStatus { get; set; } = "Pending";

    // audit
    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime? PackedDate { get; set; }

    public DateTime? ShippedDate { get; set; }

    public DateTime? OutForDeliveryDate { get; set; }

    public DateTime? DeliveredDate { get; set; }

    public string? TrackingNumber { get; set; }

    public string? CourierPartner { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? CancelledBy { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancelledReason { get; set; }

    public DateTime? ItemOrderModifiedDate { get; set; }

    public bool IsReturnEligible { get; set; }

    public DateTime? ReturnEligibleTill { get; set; }

    public string ReturnStatus { get; set; } = "None";
    // None
    // Requested
    // Approved
    // Rejected
    // PickupScheduled
    // PickedUp
    // RefundInitiated
    // Refunded

    public string? ReturnReason { get; set; }

    public string? ReturnRemarks { get; set; }

    public DateTime? ReturnRequestedDate { get; set; }

    public DateTime? ReturnApprovedDate { get; set; }

    public DateTime? PickupDate { get; set; }

    public DateTime? RefundCompletedDate { get; set; }

    public decimal? RefundAmount { get; set; }

    public string? ReturnImages { get; set; }   // JSON or comma-separated URLs

    public string? ReturnReviewedBy { get; set; }

    public string RefundStatus { get; set; } = "None";

    // navigation
    [ForeignKey(nameof(OrderId))]
    public OrderModel? Order { get; set; }

    [ForeignKey(nameof(ProductId))]
    public ProductModel? Product { get; set; }

    [ForeignKey(nameof(ProductVariantId))]
    public ProductVariant? ProductVariant { get; set; }

}
