using Microsoft.EntityFrameworkCore;

namespace VivekMedicalProducts.Models
{
    [Keyless]
    public class AdminOrderModel
    {
        public int OrderId { get; set; }
        public int OrderItemId { get; set; }
        public DateTime OrderDate { get; set; }
        public string? Customer { get; set; }
        public string? ProductName { get; set; }
        public int? Quantity { get; set; }
        public decimal? GrandTotal { get; set; }
        public string? RazorpayPaymentId { get; set; }
        public string? PaymentStatus { get; set; }
        public string? OrderStatus { get; set; }

    }
}