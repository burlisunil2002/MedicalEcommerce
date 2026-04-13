using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    [Table("Wishlists")]
    public class WishlistModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProductId { get; set; }

        public string? UserId { get; set; }
        public string? GuestId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // 🔥 Navigation Property
        [ForeignKey(nameof(ProductId))]
        public virtual ProductModel? Product { get; set; }
    }
}