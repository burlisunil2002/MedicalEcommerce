using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class ProductVariant
    {
        public int ProductVariantId { get; set; }

        public int ProductId { get; set; }
        public ProductModel Product { get; set; }

        public string Model { get; set; }
        public string? Size { get; set; }
        public string? Unit { get; set; }
        public int? PackSize { get; set; }

        public int MinQuantity { get; set; } = 1;
        public int? MaxQuantity { get; set; }
        public int StepQuantity { get; set; } = 1;

        public decimal Price { get; set; }
        public int? StockQuantity { get; set; }


        public ICollection<ProductVariantImage> Images { get; set; }
     = new List<ProductVariantImage>();

        [NotMapped]
        public List<IFormFile> ImageFiles { get; set; }
            = new();

        public ICollection<ProductSpecifications> Specifications { get; set; } = new List<ProductSpecifications>();

        public string Status { get; set; } = "Active";
    }
}
