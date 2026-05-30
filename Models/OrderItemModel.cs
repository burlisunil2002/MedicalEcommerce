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

    public string ItemStatus { get; set; } = "Pending";

    // audit
    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancelledReason { get; set; }

    public DateTime? ItemOrderModifiedDate { get; set; }

    // navigation
    public OrderModel? Order { get; set; }

    public ProductModel? Product { get; set; }
}
