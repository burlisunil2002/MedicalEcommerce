using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    [Table("Carts")]
    public class CartModel
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }

        public int? SellerId { get; set; }

        public int ProductVariantId { get; set; }

        public int Quantity { get; set; }

        public string? GuestId { get; set; }

        public string? UserId { get; set; }

        public DateTime CreatedDate { get; set; }
            = DateTime.UtcNow;

        // -------------------------
        // PRICE SNAPSHOT
        // -------------------------

        // Original MRP/unit price
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // discounted unit price
        [Column(TypeName = "decimal(18,2)")]
        public decimal FinalPrice { get; set; }

        // qty × final price
        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }

        // optional for display / analytics
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        // navigation
        public SellerModel? Seller { get; set; }

        public ProductVariant? ProductVariant { get; set; }

        public ProductModel? Product { get; set; }
    }
}
