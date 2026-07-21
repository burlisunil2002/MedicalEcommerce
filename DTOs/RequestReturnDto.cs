using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.DTOs
{
    public class RequestReturnDto
    {
        public int OrderItemId { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public IFormFile? Image1 { get; set; }

        public IFormFile? Image2 { get; set; }

        public IFormFile? Image3 { get; set; }
    }
}