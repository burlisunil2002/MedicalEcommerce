using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public string UserId { get; set; }

        // 🔢 Order Identity
        [Required]
        public string OrderNumber { get; set; } = Guid.NewGuid().ToString();

        // ---------- SHIPPING ----------
        [Required, StringLength(100)]
        public string FullName { get; set; }

        [Required, StringLength(15)]
        public string PhoneNumber { get; set; }

        [Required, StringLength(300)]
        public string Address { get; set; }

        [Required, StringLength(100)]
        public string City { get; set; }

        [Required, StringLength(10)]
        public string Pincode { get; set; }

        public string State { get; set; }
        public string Email { get; set; }

        // ---------- PRICE ----------
        [Column(TypeName = "decimal(18,2)")]
        public decimal? SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? GST { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingCharge { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? GrandTotal { get; set; }

        public string Currency { get; set; } = "INR";

        // ---------- STATUS ----------
        public string? OrderStatus { get; set; } = "Pending";
        public string? PaymentStatus { get; set; } = "Created";

        // ---------- RAZORPAY ----------
        public string RazorpayOrderId { get; set; }
        public string RazorpayPaymentId { get; set; }
        public string RazorpaySignature { get; set; }

        // ---------- SECURITY ----------
        public bool? IsPaymentVerified { get; set; } = false;
        public DateTime? PaymentVerifiedAt { get; set; }

        // ---------- FAILURE ----------
        public string FailureReason { get; set; }
        public string FailureCode { get; set; }

        // ---------- REFUND ----------
        public string RefundId { get; set; }
        public decimal? RefundAmount { get; set; }
        public string RefundStatus { get; set; }

        // ---------- TRACKING ----------
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }

        // ---------- AUDIT ----------
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
        public string UpdatedBy { get; set; }

        public bool IsDeleted { get; set; } = false;

        // ---------- NAVIGATION ----------
        public ICollection<OrderItemModel> OrderItems { get; set; }

        public PaymentModel Payment { get; set; }
    }
}