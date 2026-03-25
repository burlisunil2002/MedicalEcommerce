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
        public string ImagePath { get; set; } = string.Empty; // file path only

        public string? QuotationPath { get; set; }   // 👈 Add this

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
