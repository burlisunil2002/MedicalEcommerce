namespace VivekMedicalProducts.DTOs
{
    public class CartItemDto
    {
        // 🔹 IDENTIFIERS
        public int ProductId { get; set; }
        public int VariantId { get; set; }
        public int? SellerId { get; set; }

        // 🔹 USER CONTEXT (important for debugging / tracking)
        public string? UserId { get; set; }
        public string? GuestId { get; set; }

        // 🔹 PRODUCT INFO
        public string ProductName { get; set; }
        public string ImageUrl { get; set; }

        // 🔹 VARIANT INFO
        public string VariantName { get; set; }   // e.g. "500ml", "Pack of 10"
        public decimal Price { get; set; }

        // 🔹 QUANTITY
        public int Quantity { get; set; }

        // 🔹 SELLER INFO
        public string SellerName { get; set; }

        // 🔹 CALCULATED
        public decimal Total => Price * Quantity;
    }
}