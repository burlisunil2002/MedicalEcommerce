namespace VivekMedicalProducts.Models
{
    public class AdminOrderTableModel
    {
        public int AdminOrderId { get; set; }

        public int OrderId { get; set; }

        public string AdminName { get; set; }

        public DateTime AdminModifiedDate { get; set; }
    }
}
