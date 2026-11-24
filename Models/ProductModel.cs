
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class ProductModel
    {
        [Key]
        public int Id { get; set; }

        // Basic Information
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(150)]
        public string? Brand { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        public string? Description { get; set; }

        // Seller Information
        public int? SellerId { get; set; }

        [ForeignKey(nameof(SellerId))]
        public virtual SellerModel? Seller { get; set; }

        // Product Images
        public string? ImageUrl { get; set; }

        public string? QuotationUrl { get; set; }

        // GST and Tax Information
        [Required(ErrorMessage = "HSN Code is required.")]
        [StringLength(20)]
        public string HSNCode { get; set; } = string.Empty;

        [Range(0, 100)]
        [Column(TypeName = "decimal(5,2)")]
        public decimal GSTPercentage { get; set; }

        // Pricing
        [Required]
        [StringLength(50)]
        public string PriceType { get; set; } = "Fixed";

        // Offers and Deals
        public bool IsHotDeal { get; set; }

        [Range(0, 100)]
        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }

        // Delivery Information
        [Range(1, 365, ErrorMessage = "Delivery days must be between 1 and 365.")]
        public int DeliveryDays { get; set; } = 7;

        // Shipping Information
        [Range(0, 100000)]
        [Column(TypeName = "decimal(10,3)")]
        public decimal? Weight { get; set; }

        public bool IsFragile { get; set; }

        // Medical / Product Information
        [StringLength(100)]
        public string? BatchNumber { get; set; }

        public DateTime? ExpiryDate { get; set; }

        // Product Status
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Product Variants
        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    }
}
