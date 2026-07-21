public class InvoiceItemViewModel
{
    // Product
    public int ProductId { get; set; }

    public int ProductVariantId { get; set; }

    public int? SellerId { get; set; }

    public string ProductName { get; set; } = "";

    public string VariantName { get; set; } = "";

    // Quantity
    public int Quantity { get; set; }

    // Original Unit Price
    public decimal Price { get; set; }

    // Product Discount (Per Unit)
    public decimal DiscountAmount { get; set; }

    // Taxable Amount
    public decimal TaxableAmount { get; set; }

    // GST
    public decimal GSTPercentage { get; set; }

    public decimal GSTAmount { get; set; }

    // Coupon Allocation
    public decimal CouponDiscountAmount { get; set; }

    // Final Paid Amount
    public decimal FinalPaidAmount { get; set; }

    // Line Total
    public decimal Total { get; set; }

    // Item Status
    public string ItemStatus { get; set; } = "";

    // Return
    public string ReturnStatus { get; set; } = "";

    // Optional
    public string? HSNCode { get; set; }

    public string? SKU { get; set; }
}