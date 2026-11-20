namespace VivekMedicalProducts.Models
{
    using System.ComponentModel.DataAnnotations;

    public class DeliveryBatchModel
    {
        [Key]
        public int DeliveryBatchId { get; set; }

        public int OrderId { get; set; }

        public int? SellerId { get; set; }

        [Required, MaxLength(50)]
        public string BatchNumber { get; set; } = "";

        public DateTime? ExpectedDeliveryDate { get; set; }

        public DateTime? DispatchedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "Pending";

        // Pending, Processing, Packed,
        // Shipped, OutForDelivery, Delivered

        public DateTime CreatedAt { get; set; }
            = DateTime.UtcNow;

        public DateTime OutForDeliveryDate { get; set; }

        public ICollection<OrderItemModel> Items { get; set; }
            = new List<OrderItemModel>();

        public ICollection<DeliveryBatchItemModel> BatchItems { get; set; }
    = new List<DeliveryBatchItemModel>();
    }
}
