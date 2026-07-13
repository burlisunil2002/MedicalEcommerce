    using System.ComponentModel.DataAnnotations;

    namespace VivekMedicalProducts.Models
    {
        public class OrderReturnModel
        {
            [Key]
            public int ReturnId { get; set; }

            public int OrderId { get; set; }

            public OrderModel Order { get; set; }

            public string UserId { get; set; }

            [Required]
            public string Reason { get; set; }

            public string? Remarks { get; set; }

            public string Status { get; set; } = "Requested";

            public DateTime RequestedDate { get; set; } = DateTime.UtcNow;

            public DateTime? ApprovedDate { get; set; }

            public DateTime? PickupDate { get; set; }

            public DateTime? CompletedDate { get; set; }

            public string? RejectReason { get; set; }

            public bool RefundCompleted { get; set; }

            public string? Image1 { get; set; }

            public string? Image2 { get; set; }

            public string? Image3 { get; set; }
        }
    }

