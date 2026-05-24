namespace VivekMedicalProducts.DTOs
{
    public class AddCartItemDto
    {
        public int ProductId { get; set; }
        public int VariantId { get; set; }
        public int Quantity { get; set; }
    }
}