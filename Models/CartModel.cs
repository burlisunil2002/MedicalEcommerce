using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    [Table("Carts")]   // 👈 This fixes the issue
    public class CartModel
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public int? SellerId { get; set; }

        public SellerModel Seller { get; set; }

        public int ProductVariantId { get; set; }

        public int Quantity { get; set; }

        public string? GuestId { get; set; }

        public string? UserId { get; set; }   // Logged in user

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public ProductVariant ProductVariant { get; set; } // navigation

        public ProductModel Product { get; set; } // navigation

    }
}

