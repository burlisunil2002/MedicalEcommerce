using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
    public class ProductViewModel
    {
        public int Id { get; set; }

        // 🔹 BASIC
        public string Name { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }

        // 🔹 SELLER
        public int SellerId { get; set; }
        public string? SellerName { get; set; }

        // 🔹 PRICING
        public decimal Price { get; set; }
        public int GSTPercentage { get; set; }

        [Required(ErrorMessage = "Please select price type")]
        public string PriceType { get; set; }

        // 🔹 IMAGES
        public string? ImageUrl { get; set; }
        public string? ImageUrl2 { get; set; }
        public string? ImageUrl3 { get; set; }
        public string? ImageUrl4 { get; set; }

        public string? QuotationUrl { get; set; }

        // 🔹 CART
        public int CartQuantity { get; set; }

        // 🔥 DEALS
        public bool IsHotDeal { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public DateTime? DealEndDate { get; set; }

        // 🔹 INVENTORY
        public int? StockQuantity { get; set; }

        // 🔹 SHIPPING
        public string? ProductType { get; set; }
        public decimal? Weight { get; set; }
        public bool? IsFragile { get; set; }

        // 🔹 STATUS
        public bool IsActive { get; set; }

        // 🔹 MEDICAL
        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; }

        // ⭐ FINAL PRICE
        public decimal FinalPrice
        {
            get
            {
                if (DiscountPercentage == null || DiscountPercentage == 0)
                    return Price;

                return Price - (Price * DiscountPercentage.Value / 100);
            }
        }

        // ⭐ URGENCY (UI)
        public int FakeStockLeft
        {
            get
            {
                return new Random(Id).Next(2, 10);
            }
        }
    }
}