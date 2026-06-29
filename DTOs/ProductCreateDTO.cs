using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.DTOs
{
    public class ProductCreateDto
    {
        [Required(ErrorMessage = "Product Name is required")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Brand is required")]
        public string Brand { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; }

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Product Image is required")]
        public IFormFile ImageFile { get; set; }

        public IFormFile? QuotationFile { get; set; }

        [Required(ErrorMessage = "GST Percentage is required")]
        public decimal GSTPercentage { get; set; }

        public string? HSNCode { get; set; }

        public string PriceType { get; set; } = "Normal";

        public bool IsHotDeal { get; set; }

        public decimal? DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }

        public decimal? Weight { get; set; }

        public bool IsFragile { get; set; }

        public string? BatchNumber { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MinLength(1,
            ErrorMessage = "At least one variant is required")]
        public List<ProductVariantDto> Variants { get; set; }
            = new();
    }
}