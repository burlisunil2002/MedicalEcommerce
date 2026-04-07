using System.ComponentModel.DataAnnotations;
using VivekMedicalProducts.Models;

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

        public string? ImageUrl { get; set; }

        public string? QuotationUrl { get; set; }

        // ⭐ CART
        public int CartQuantity { get; set; }

        // 🔥 HOT DEAL FIELDS (NEW)
        public bool IsHotDeal { get; set; }

        public decimal? DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }

        // ⭐ CALCULATED PRICE (BEST PRACTICE)
        public decimal FinalPrice
        {
            get
            {
                if (DiscountPercentage == null || DiscountPercentage == 0)
                    return Price;

                return Price - (Price * DiscountPercentage.Value / 100);
            }
        }

        // ⭐ OPTIONAL: URGENCY (UI USE)
        public int FakeStockLeft
        {
            get
            {
                return new Random(Id).Next(2, 10); // stable random per product
            }
        }
    }
}