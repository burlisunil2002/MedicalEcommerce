    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    namespace VivekMedicalProducts.Models
    {
        public class OrderReturnModel
        {
            [Key]
            public int ReturnId { get; set; }

            //--------------------------------------------------
            // Order
            //--------------------------------------------------

            public int OrderId { get; set; }

            [ForeignKey(nameof(OrderId))]
            public OrderModel Order { get; set; }

            //--------------------------------------------------
            // Order Item
            //--------------------------------------------------

            public int OrderItemId { get; set; }

            [ForeignKey(nameof(OrderItemId))]
            public OrderItemModel OrderItem { get; set; }

            //--------------------------------------------------
            // Customer
            //--------------------------------------------------

            [Required]
            public string UserId { get; set; }

            //--------------------------------------------------
            // Return Details
            //--------------------------------------------------

            [Required]
            [MaxLength(500)]
            public string Reason { get; set; }

            [MaxLength(1000)]
            public string? Remarks { get; set; }

            public string Status { get; set; } = "Requested";
            // Requested
            // Approved
            // Rejected
            // PickupScheduled
            // PickedUp
            // Received
            // Refunded
            // Completed

            //--------------------------------------------------
            // Images
            //--------------------------------------------------

            public string? Image1 { get; set; }

            public string? Image2 { get; set; }

            public string? Image3 { get; set; }

            //--------------------------------------------------
            // Seller / Admin Remarks
            //--------------------------------------------------

            public string? AdminRemarks { get; set; }

            public string? RejectReason { get; set; }

            //--------------------------------------------------
            // Timeline
            //--------------------------------------------------

            public DateTime RequestedDate { get; set; } = DateTime.UtcNow;

            public DateTime? ApprovedDate { get; set; }

            public DateTime? RejectedDate { get; set; }

            public DateTime? PickupScheduledDate { get; set; }

            public DateTime? PickupDate { get; set; }

            public DateTime? ReceivedDate { get; set; }

            public DateTime? RefundInitiatedDate { get; set; }

            public DateTime? RefundCompletedDate { get; set; }

            public DateTime? CompletedDate { get; set; }

            //--------------------------------------------------
            // Refund
            //--------------------------------------------------

            public bool RefundCompleted { get; set; }

            public decimal RefundAmount { get; set; }

            public string? RefundTransactionId { get; set; }

            //--------------------------------------------------
            // Audit
            //--------------------------------------------------

            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public DateTime? UpdatedAt { get; set; }

            public string? CreatedBy { get; set; }

            public string? UpdatedBy { get; set; }
        }
    }


