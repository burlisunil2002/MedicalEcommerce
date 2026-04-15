using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class ProductModel
    {
        public int Id { get; set; }

        // 🔹 BASIC INFO
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;

        // 🔹 SELLER
        public int? SellerId { get; set; }   // ✅ nullable
        public SellerModel? Seller { get; set; }

        // 🔹 PRICING
        public decimal Price { get; set; }
        public int GSTPercentage { get; set; }

        [Required]
        public string PriceType { get; set; } = "Fixed";

        // 🔹 IMAGES
        public string? ImageUrl { get; set; }
        public string? ImageUrl2 { get; set; }
        public string? ImageUrl3 { get; set; }
        public string? ImageUrl4 { get; set; }
        public string? QuotationUrl { get; set; }

        // 🔹 DEALS
        public bool IsHotDeal { get; set; } = false;
        public decimal? DiscountPercentage { get; set; }
        public DateTime? DealEndDate { get; set; }

        // 🔹 INVENTORY
        public int StockQuantity { get; set; } = 0;

        // 🔹 SHIPPING ✅ FIXED
        public string? ProductType { get; set; }   // ✅ nullable
        public decimal? Weight { get; set; }       // ✅ nullable
        public bool? IsFragile { get; set; }       // ✅ nullable

        // 🔹 STATUS
        public bool IsActive { get; set; } = true;

        // 🔹 MEDICAL
        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; }

        // 🔹 AUDIT
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }
    }
}