using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class ProductModel
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;

        public decimal Price { get; set; }
        public int GSTPercentage { get; set; }

        [Required(ErrorMessage = "Please select price type")]
        public string PriceType { get; set; }

        // 🔥 CLOUDINARY URLS (NOT PATHS)
        public string? ImageUrl { get; set; } = string.Empty;
        public string? QuotationUrl { get; set; }

        public bool IsHotDeal { get; set; } = false;

        public decimal? DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
