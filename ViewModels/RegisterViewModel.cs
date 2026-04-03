using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace VivekMedicalProducts.ViewModels
{
    public class RegisterViewModel
    {
        [Required]
        public string CompanyName { get; set; }

        [Required]
        public string CustomerName { get; set; }

        [Required]
        public string IndustrySector { get; set; }

        [Required]
        [Phone]
        public string MobileNo { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? SecondaryEmail { get; set; }

        public string? SecondaryMobile { get; set; }

        [Required]
        [RegularExpression(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$",
        ErrorMessage = "Invalid GST Number")]
        public string GSTNo { get; set; }

        [RegularExpression(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
        ErrorMessage = "Invalid PAN Number")]
        public string? PANNo { get; set; }

        [Required]
        public string Address { get; set; }

        public IFormFile? Document { get; set; }

        public bool AcceptPrivacy { get; set; }
    }
}