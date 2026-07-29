namespace VivekMedicalProducts.DTOs
{
    public class UpdateOrderStatusDto
    {
        public int OrderId { get; set; }

        public string? PaymentStatus
        {
            get;
            set;
        }

        public string? ItemOrderStatus
        {
            get;
            set;
        }
    }
}
