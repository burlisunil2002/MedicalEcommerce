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

        public decimal? Total { get; set; }

        public string? PaymentScreenshot { get; set; }

        public string? UTRNumber { get; set; }

        public string? PaymentStatus { get; set; }

        public DateTime? PaymentVerifiedDate { get; set; }

        public string? ItemStatus { get; set; }

        public DateTime? ItemOrderModifiedDate { get; set; }

        
    }
}