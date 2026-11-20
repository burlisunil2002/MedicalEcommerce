
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models;

public class DeliveryBatchItemModel
{
    [Key]
    public int DeliveryBatchItemId { get; set; }

    public int DeliveryBatchId { get; set; }
    public DeliveryBatchModel? DeliveryBatch { get; set; }

    public int OrderItemId { get; set; }
    public OrderItemModel? OrderItem { get; set; }

    // Quantity included in this particular dispatch
    [Range(1, int.MaxValue)]
    public int DispatchedQuantity { get; set; }

    // Financial snapshot for this dispatched quantity
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxableAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal GstAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }
}
