using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
    public class ProductViewModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public string Category { get; set; }

        public decimal Price { get; set; }

        public int GSTPercentage { get; set; }

        [Required(ErrorMessage = "Please select price type")]
        public string PriceType { get; set; }

        public string ImagePath { get; set; }

        public string? QuotationPath { get; set; }

        // ⭐ important for cart quantity
        public int CartQuantity { get; set; }
    }
}