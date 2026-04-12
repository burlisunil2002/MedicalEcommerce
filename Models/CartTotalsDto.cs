namespace VivekMedicalProducts.Models
{
    public class CartTotalsDto
    {
        public decimal Subtotal { get; set; }
        public decimal GST { get; set; }
        public decimal Discount { get; set; }
        public decimal Delivery { get; set; }
        public decimal GrandTotal { get; set; }
    }
}