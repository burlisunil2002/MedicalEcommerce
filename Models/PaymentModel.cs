using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VivekMedicalProducts.Models
{
    [Index(nameof(UTRNumber), IsUnique = true)]
    public class PaymentModel
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string UTRNumber { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [StringLength(100)]
        public string PaymentScreenshot { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentStatus { get; set; } = "Pending";
        // Pending, Verified, Rejected

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public DateTime? VerifiedDate { get; set; }

        // Navigation
        [ForeignKey("OrderId")]
        public OrderModel Order { get; set; }

        public string RazorpayPaymentId { get; set; } 
        public string RazorpayOrderId  { get; set; }
        public string RazorpaySignature { get; set; }
    }
}