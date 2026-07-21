namespace VivekMedicalProducts.ViewModels
{
    public class OrderInvoiceViewModel
    {
        // Invoice
        public string InvoiceNumber { get; set; } = "";

        public int OrderId { get; set; }

        public string OrderNumber { get; set; } = "";

        public DateTime Date { get; set; }

        // Customer
        public string CustomerName { get; set; } = "";

        public string Address { get; set; } = "";

        public string City { get; set; } = "";

        public string State { get; set; } = "";

        public string Pincode { get; set; } = "";

        public string Phone { get; set; } = "";

        // Company
        public string CompanyName { get; set; } = "";

        public string CompanyGST { get; set; } = "";

        public string CompanyAddress { get; set; } = "";

        public string CompanyPhone { get; set; } = "";

        public string CompanyEmail { get; set; } = "";

        public string CompanyWebsite { get; set; } = "";

        // Currency
        public string Currency { get; set; } = "INR";

        // Totals
        public decimal SubTotal { get; set; }

        public decimal DiscountTotal { get; set; }

        public decimal TaxableAmount { get; set; }

        public decimal CouponDiscount { get; set; }

        public decimal GSTTotal { get; set; }

        public decimal ShippingCharge { get; set; }

        public decimal FinalPaidAmount { get; set; }

        public decimal GrandTotal { get; set; }

        // Payment
        public string PaymentId { get; set; } = "";

        public string PaymentMethod { get; set; } = "";

        public string PaymentStatus { get; set; } = "";

        // Derived Order Status
        public string OrderStatus { get; set; } = "";

        // PDF
        public bool IsPdf { get; set; }

        // Items
        public List<InvoiceItemViewModel> Items { get; set; }
            = new();
    }
}