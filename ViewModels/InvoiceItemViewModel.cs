public class InvoiceItemViewModel
{
    public string ProductName { get; set; }

    public string VariantName { get; set; }

    public int Quantity { get; set; }

    // Original Unit Price
    public decimal Price { get; set; }

    // Discount Per Unit
    public decimal DiscountAmount { get; set; }

    // Amount After Product Discount × Qty
    public decimal TaxableAmount { get; set; }

    // GST %
    public decimal GSTPercentage { get; set; }

    // GST Amount
    public decimal GSTAmount { get; set; }

    // Coupon Share
    public decimal CouponDiscountAmount { get; set; }

    // Final Amount Paid For This Item
    public decimal FinalPaidAmount { get; set; }

    // Line Total
    public decimal Total { get; set; }
}