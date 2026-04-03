namespace VivekMedicalProducts.ViewModels
{
    public class MyOrderViewModel
    {
        public int? OrderId { get; set; }

        public DateTime OrderDate { get; set; }

        public string? ProductName { get; set; }

        public string? ProductImage { get; set; }

        public int? Quantity { get; set; }

        public decimal? Total { get; set; }

        public string? OrderStatus { get; set; }

        public string? PaymentStatus { get; set; }
    }
}
