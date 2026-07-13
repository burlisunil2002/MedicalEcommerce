using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.DTOs
{
    public class RequestReturnDto
    {
        public int OrderId { get; set; }

        [Required]
        public string Reason { get; set; }

        public string? Remarks { get; set; }

        public string? Image1 { get; set; }

        public string? Image2 { get; set; }

        public string? Image3 { get; set; }
    }
}