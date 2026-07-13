namespace VivekMedicalProducts.Models
{
    public class SuccessOrderItemDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; }

        public string Image { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }
    }
}
