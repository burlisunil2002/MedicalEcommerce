using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
    public class ProductViewModel
    {
            public int Id { get; set; }
        public string Brand { get; set; }
        
        public string Name { get; set; }
            public string Description { get; set; }
            public string Category { get; set; }

            // 🔹 SELLER
            public int? SellerId { get; set; }
            public string? SellerName { get; set; }

            // 🔥 PRICING (from Variant)
            public decimal Price { get; set; }

            public decimal? GSTPercentage { get; set; }
            public string HSNCode { get; set; }
            public string PriceType { get; set; }

            // 🔹 IMAGE (single only as per your UI)
            public string ImageUrl { get; set; }
            public string QuotationUrl { get; set; }

            // 🔥 DEALS
            public bool IsHotDeal { get; set; }
            public decimal? DiscountPercentage { get; set; }
            public DateTime? DealEndDate { get; set; } = DateTime.UtcNow;

        // 🔥 STOCK (from Variant)
        public int StockQuantity { get; set; }

            // 🔹 SHIPPING
            public string ProductType { get; set; }
            public decimal Weight { get; set; }
            public bool IsFragile { get; set; }

        // 🔹 STATUS
            public string Status { get; set; } = "Active";

            // 🔹 MEDICAL
            public string BatchNumber { get; set; }
            public DateTime? ExpiryDate { get; set; } = DateTime.UtcNow;

        // 🛒 CART
        public int CartQuantity { get; set; }

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
