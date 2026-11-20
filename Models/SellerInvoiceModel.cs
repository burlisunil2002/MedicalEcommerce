using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models;

public class SellerInvoiceModel
{
    [Key] public int SellerInvoiceId { get; set; }
    [Required, MaxLength(40)] public string InvoiceNumber { get; set; } = "";
    public int OrderId { get; set; }
    [Required, MaxLength(50)] public string OrderNumber { get; set; } = "";
    public int? SellerId { get; set; } // null = JEDE-supplied/admin product
    [Required, MaxLength(20)] public string SupplierType { get; set; } = "JEDE";
    [Required, MaxLength(200)] public string SupplierName { get; set; } = "";
    [MaxLength(20)] public string? SupplierGSTIN { get; set; }
    [Required] public string SupplierAddress { get; set; } = "";
    [Required, MaxLength(200)] public string CustomerName { get; set; } = "";
    [Required] public string CustomerAddress { get; set; } = "";
    [MaxLength(20)] public string? CustomerPhone { get; set; }
    [MaxLength(20)] public string? CustomerGSTIN { get; set; }
    [Required, MaxLength(100)] public string PlaceOfSupply { get; set; } = "";
    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    [Column(TypeName = "decimal(18,2)")] public decimal TaxableTotal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal GstTotal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal InvoiceTotal { get; set; }
    [Required, MaxLength(20)] public string Status { get; set; } = "Issued";
    public ICollection<SellerInvoiceItemModel> Items { get; set; } = new List<SellerInvoiceItemModel>();

    public int? DeliveryBatchId { get; set; }

    [ForeignKey(nameof(DeliveryBatchId))]
    public DeliveryBatchModel? DeliveryBatch { get; set; }
}

