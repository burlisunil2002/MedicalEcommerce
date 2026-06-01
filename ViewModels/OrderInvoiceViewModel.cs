namespace VivekMedicalProducts.ViewModels
{
    public class OrderInvoiceViewModel
    {
        public string InvoiceNumber { get; set; }

        public int OrderId { get; set; }

        public DateTime Date { get; set; }

        // customer
        public string CustomerName { get; set; }

        public string Address { get; set; }

        public string City { get; set; }

        public string Pincode { get; set; }

        public string Phone { get; set; }

        // company
        public string CompanyName { get; set; }

        public string CompanyGST { get; set; }

        public string CompanyAddress { get; set; }

        public string CompanyPhone { get; set; }

        // totals
        public decimal SubTotal { get; set; }

        public decimal DiscountTotal { get; set; }

        public decimal CouponDiscount { get; set; }

        public decimal GSTTotal { get; set; }

        public decimal FinalPaidAmount { get; set; }

        public decimal GrandTotal { get; set; }

        public string PaymentId { get; set; }

        public string PaymentMethod { get; set; }

        public string OrderStatus { get; set; }

        public bool IsPdf { get; set; }

        public List<InvoiceItemViewModel> Items { get; set; }
            = new();
    }
}