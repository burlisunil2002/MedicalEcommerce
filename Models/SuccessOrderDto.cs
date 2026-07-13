namespace VivekMedicalProducts.Models
{
    public class SuccessOrderDto
    {
        public string OrderNumber { get; set; }

        public DateTime OrderDate { get; set; }

        public decimal GrandTotal { get; set; }

        public string PaymentMethod { get; set; }

        public string PaymentStatus { get; set; }

        public string DeliveryStatus { get; set; }

        public DateTime EstimatedDelivery { get; set; }

        public string CustomerName { get; set; }

        public string Mobile { get; set; }

        public string Address { get; set; }

        public List<SuccessOrderItemDto> Items { get; set; }
    }
}
