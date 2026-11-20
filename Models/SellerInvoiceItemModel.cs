using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class SellerInvoiceItemModel
    {
        [Key] public int SellerInvoiceItemId { get; set; }
        public int SellerInvoiceId { get; set; }
        public SellerInvoiceModel? Invoice { get; set; }
        public int OrderItemId { get; set; }
        public int ProductId { get; set; }
        [Required, MaxLength(200)] public string ProductName { get; set; } = "";
        [MaxLength(30)] public string? HSNCode { get; set; }
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal UnitPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal TaxableAmount { get; set; }
        [Column(TypeName = "decimal(5,2)")] public decimal GstPercentage { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal GstAmount { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal LineTotal { get; set; }

        public int? DeliveryBatchItemId { get; set; } 

        [ForeignKey(nameof(DeliveryBatchItemId))]
        public DeliveryBatchItemModel? DeliveryBatchItem { get; set; }
    }

}
