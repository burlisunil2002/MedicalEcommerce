using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
    public class SellerRegisterViewModel
    {
        [Required]
        public string BusinessName { get; set; }

        [Required]
        public string OwnerName { get; set; }

        [Required]
        public string ProductType { get; set; }

        public string? Brand { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [RegularExpression(@"^[6-9]\d{9}$")]
        public string Phone { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        [Required]
        [StringLength(15)]
        public string GSTNumber { get; set; }

        [Required]
        [StringLength(10)]
        public string PAN { get; set; }

        [Required]
        public string AddressLine1 { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string State { get; set; }

        [Required]
        [RegularExpression(@"^\d{6}$")]
        public string Pincode { get; set; }

        [Required]
        public string AccountHolderName { get; set; }

        [Required]
        public string AccountNumber { get; set; }

        [Required]
        public string IFSCCode { get; set; }

        [Required]
        public string BankName { get; set; }
    }
}