using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class ProductSpecifications
    {
        public int Id { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }

        public int ProductVariantId { get; set; }

        public ProductVariant ProductVariant { get; set; }
    }
}
