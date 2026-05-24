using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VivekMedicalProducts.Models;

public class OrderItemModel
{
    [Key]
    public int OrderItemId { get; set; }

    [Required]
    public int OrderId { get; set; }

    public int? SellerId { get; set; }

    public SellerModel Seller { get; set; }

    [Required]
    public int ProductId { get; set; }

    public int ProductVariantId { get; set; }


    public ProductVariant ProductVariant { get; set; } // navigation

    [Required]
    public string ProductName { get; set; } // 🔥 snapshot (important)

    [Required]
    [Range(1, 1000)]
    public int Quantity { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal GSTPercentage { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    public decimal Price { get; set; }


    public string ItemStatus { get; set; } = "Pending";

    // Navigation
    [ForeignKey("OrderId")]
    public OrderModel Order { get; set; }

    [ForeignKey("ProductId")]
    public ProductModel Product { get; set; }

    public DateTime? ItemOrderModifiedDate { get; set; }
}