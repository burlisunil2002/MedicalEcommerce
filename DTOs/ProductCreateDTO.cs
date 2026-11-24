
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace VivekMedicalProducts.DTOs
{
    public class ProductCreateDto
    {
        [Required(ErrorMessage = "Product Name is required")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Brand is required")]
        public string Brand { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product Image is required")]
        public IFormFile? ImageFile { get; set; }

        public IFormFile? QuotationFile { get; set; }

        [Required(ErrorMessage = "GST Percentage is required")]
        [Range(0, 100, ErrorMessage = "GST Percentage must be between 0 and 100")]
        public decimal GSTPercentage { get; set; }

        // HSN Information
        [Required(ErrorMessage = "HSN Code is required")]
        [StringLength(20, ErrorMessage = "HSN Code cannot exceed 20 characters")]
        public string HSNCode { get; set; } = string.Empty;

        // Pricing
        public string PriceType { get; set; } = "Normal";

        // Hot Deals
        public bool IsHotDeal { get; set; }

        [Range(0, 100, ErrorMessage = "Discount must be between 0 and 100")]
        public decimal? DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }

        // Delivery Information
        [Range(1, 365, ErrorMessage = "Delivery days must be between 1 and 365")]
        public int DeliveryDays { get; set; } = 7;

        // Shipping Information
        [Range(0, 100000, ErrorMessage = "Weight cannot be negative")]
        public decimal? Weight { get; set; }

        public bool IsFragile { get; set; }

        // Medical Information
        public string? BatchNumber { get; set; }

        public DateTime? ExpiryDate { get; set; }

        // Product Variants
        [MinLength(1, ErrorMessage = "At least one variant is required")]
        public List<ProductVariantDto> Variants { get; set; } = new();
    }
}
