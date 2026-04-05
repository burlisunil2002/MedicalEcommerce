namespace VivekMedicalProducts.ViewModels
{
    public class OrderInvoiceViewModel
    {
        // 🧾 Invoice Info
        public string InvoiceNumber { get; set; }

        public int OrderId { get; set; }
        public DateTime Date { get; set; }

        // 👤 Customer Details
        public string CustomerName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Pincode { get; set; }
        public string Phone { get; set; }

        // 🏢 Company Details (IMPORTANT FOR INVOICE)
        public string CompanyName { get; set; }
        public string CompanyGST { get; set; }
        public string CompanyAddress { get; set; }
        public string CompanyPhone { get; set; }

        // 💰 Totals
        public decimal SubTotal { get; set; }
        public decimal GSTTotal { get; set; }
        public decimal GrandTotal { get; set; }

        public string PaymentId { get; set; }
        public string PaymentMethod { get; set; }
        public string OrderStatus { get; set; }

        public bool IsPdf { get; set; }

        // 📦 Items
        public List<InvoiceItemViewModel> Items { get; set; } = new();
    }
}
