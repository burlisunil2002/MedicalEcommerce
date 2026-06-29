namespace VivekMedicalProducts.Models
{
    public class ProductVariantImage
    {
        public int Id { get; set; }

        public int ProductVariantId { get; set; }
        public ProductVariant ProductVariant { get; set; }

        public string ImageUrl { get; set; }

        public int DisplayOrder { get; set; }
    }
}
