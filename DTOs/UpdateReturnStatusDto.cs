namespace VivekMedicalProducts.DTOs
{
    public class UpdateReturnStatusDto
    {
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public decimal? RefundAmount { get; set; }
    }
}