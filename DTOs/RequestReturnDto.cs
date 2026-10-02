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

        [Required]
        [MaxLength(200)]
        public string AccountHolderName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string IFSCCode { get; set; } = string.Empty;
    }
}