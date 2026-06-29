
    using System.ComponentModel.DataAnnotations;

    namespace VivekMedicalProducts.DTOs
    {
        public class ProductVariantDto
        {
            [Required(ErrorMessage = "Model is required")]
            public string Model { get; set; }

            public string? Size { get; set; }

            public string? Unit { get; set; }

            public int? PackSize { get; set; }

            public int MinQuantity { get; set; } = 1;

            public int? MaxQuantity { get; set; }

            public int StepQuantity { get; set; } = 1;

            [Range(0.01,
                double.MaxValue,
                ErrorMessage = "Price is required")]
            public decimal Price { get; set; }

            public int? StockQuantity { get; set; }

            public List<IFormFile> ImageFiles { get; set; }
                = new();

            public List<ProductSpecificationDto> Specifications
            { get; set; } = new();
        }
    }

