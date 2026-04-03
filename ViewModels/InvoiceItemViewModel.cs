namespace VivekMedicalProducts.ViewModels
{
    public class InvoiceItemViewModel
    {
        public string ProductName { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal GSTPercentage { get; set; }

        public decimal GSTAmount { get; set; }

        public decimal Total { get; set; }
    }
}
