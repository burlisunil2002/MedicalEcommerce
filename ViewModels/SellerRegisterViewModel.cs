using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
    public class SellerRegisterViewModel
    {
        // 🔹 BASIC DETAILS
        [Required(ErrorMessage = "Business name is required")]
        public string BusinessName { get; set; }

        [Required(ErrorMessage = "Owner name is required")]
        public string OwnerName { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        public string Email { get; set; }

        [Required(ErrorMessage = "Phone is required")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter valid 10-digit mobile number")]
        public string Phone { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }

        // 🔹 GST DETAILS
        [Required(ErrorMessage = "GST number is required")]
        [StringLength(15, MinimumLength = 15, ErrorMessage = "GST must be 15 characters")]
        public string GSTNumber { get; set; }

        // 🔹 PAN DETAILS
        [Required(ErrorMessage = "PAN is required")]
        [StringLength(10, MinimumLength = 10, ErrorMessage = "PAN must be 10 characters")]
        public string PAN { get; set; }

        // 🔹 ADDRESS
        [Required(ErrorMessage = "Address is required")]
        public string AddressLine1 { get; set; }

        [Required(ErrorMessage = "City is required")]
        public string City { get; set; }

        [Required(ErrorMessage = "State is required")]
        public string State { get; set; }

        [Required(ErrorMessage = "Pincode is required")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Enter valid 6-digit pincode")]
        public string Pincode { get; set; }

        // 🔹 BANK DETAILS
        [Required(ErrorMessage = "Account holder name is required")]
        public string AccountHolderName { get; set; }

        [Required(ErrorMessage = "Account number is required")]
        [MinLength(8)]
        public string AccountNumber { get; set; }

        [Required(ErrorMessage = "IFSC code is required")]
        [RegularExpression(@"^[A-Z]{4}0[A-Z0-9]{6}$", ErrorMessage = "Invalid IFSC code")]
        public string IFSCCode { get; set; }

        [Required(ErrorMessage = "Bank name is required")]
        public string BankName { get; set; }
    }
}