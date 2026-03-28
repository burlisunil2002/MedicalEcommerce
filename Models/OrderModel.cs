using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VivekMedicalProducts.Services;

namespace VivekMedicalProducts.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        // 🔢 Order Identity
        [Required]
        public string OrderNumber { get; set; } = "ORD-" + DateTime.UtcNow.Ticks;

        // ---------- SHIPPING ----------
        [Required, StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required, StringLength(300)]
        public string Address { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string City { get; set; } = string.Empty;

        [Required, StringLength(10)]
        public string Pincode { get; set; } = string.Empty;

        public string State { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // ---------- PRICE ----------
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GST { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingCharge { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; } = 0;

        public string Currency { get; set; } = "INR";

        // ---------- STATUS ----------
        public string OrderStatus { get; set; } = "Pending";
        // Pending → Confirmed → Shipped → Delivered → Cancelled

        public string PaymentStatus { get; set; } = "Created";
        // Created → Initiated → Completed → Failed → Refunded

        // ---------- RAZORPAY ----------
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;

        // ---------- SECURITY ----------
        public bool IsPaymentVerified { get; set; } = false;
        public DateTime? PaymentVerifiedAt { get; set; }

        // ---------- FAILURE ----------
        public string FailureReason { get; set; } = string.Empty;
        public string FailureCode { get; set; } = string.Empty;

        // ---------- REFUND ----------
        public string RefundId { get; set; } = string.Empty;
        public decimal? RefundAmount { get; set; }
        public string RefundStatus { get; set; } = string.Empty;

        // ---------- TRACKING ----------
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;

        // ---------- AUDIT ----------
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? UpdatedAt { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;

        public bool IsDeleted { get; set; } = false;

        // ---------- NAVIGATION ----------
        public ICollection<OrderItemModel> OrderItems { get; set; } = new List<OrderItemModel>();

        public PaymentModel? Payment { get; set; }
    }
}