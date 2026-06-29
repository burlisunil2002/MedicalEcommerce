

namespace VivekMedicalProducts.Models
{
    public class ProductModel
    {
        public int Id { get; set; }

        public string Brand { get; set; }

        public string Name { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }

        public int? SellerId { get; set; }
        public SellerModel Seller { get; set; }

        public string ImageUrl { get; set; }
        public string? QuotationUrl { get; set; }

        public decimal GSTPercentage { get; set; }
        public string? HSNCode { get; set; }
        public string PriceType { get; set; }

        public bool IsHotDeal { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public DateTime? DealEndDate { get; set; } = DateTime.UtcNow;

        public decimal? Weight { get; set; }
        public bool IsFragile { get; set; }

        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Active";
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ✅ ONLY THESE TWO (CORRECT)

        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    }
}