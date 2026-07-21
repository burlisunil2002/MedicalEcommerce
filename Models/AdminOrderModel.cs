using Microsoft.EntityFrameworkCore;

namespace VivekMedicalProducts.Models
{
    [Keyless]
    public class AdminOrderModel
    {
        // Order Details
        public int OrderId { get; set; }

        public int OrderItemId { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        // Customer
        public string Customer { get; set; } = string.Empty;

        // Seller
        public int? SellerId { get; set; }

        // Product
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string VariantName { get; set; } = string.Empty;

        public int Quantity { get; set; }

        // Pricing
        public decimal Price { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal CouponDiscountAmount { get; set; }

        public decimal TaxableAmount { get; set; }

        public decimal GSTPercentage { get; set; }

        public decimal GSTAmount { get; set; }

        public decimal FinalPaidAmount { get; set; }

        public decimal LineTotal { get; set; }

        public decimal GrandTotal { get; set; }

        // Payment
        public string PaymentStatus { get; set; } = string.Empty;

        public string RazorpayPaymentId { get; set; } = string.Empty;

        // Order Item Status
        public string OrderStatus { get; set; } = string.Empty;

        // Delivery Timeline
        public DateTime? PackedDate { get; set; }

        public DateTime? ShippedDate { get; set; }

        public DateTime? OutForDeliveryDate { get; set; }

        public DateTime? DeliveredDate { get; set; }

        // Cancellation
        public DateTime? CancelledAt { get; set; }

        // Return
        public string ReturnStatus { get; set; } = string.Empty;

        public bool IsReturnEligible { get; set; }

        public DateTime? ReturnEligibleTill { get; set; }

        // Tracking
        public string? TrackingNumber { get; set; }

        public string? CourierPartner { get; set; }
    }
}