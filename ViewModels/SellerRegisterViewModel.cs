
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace VivekMedicalProducts.ViewModels
{
    public class SellerRegisterViewModel
    {
        // BUSINESS DETAILS
        [Required]
        public string BusinessName { get; set; } = "";

        [Required]
        public string OwnerName { get; set; } = "";

        [Required]
        public string ProductType { get; set; } = "";

        public string? Brand { get; set; }

        // CONTACT DETAILS
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        [RegularExpression(
            @"^[6-9]\d{9}$",
            ErrorMessage = "Enter a valid 10-digit Indian mobile number.")]
        public string Phone { get; set; } = "";

        [Required, MinLength(8)]
        public string Password { get; set; } = "";

        // GST DETAILS
        [Required]
        [RegularExpression(
            @"^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$",
            ErrorMessage = "Enter a valid 15-character GSTIN format.")]
        public string GSTNumber { get; set; } = "";

        [Required]
        [RegularExpression(
            @"^[A-Z]{5}\d{4}[A-Z]$",
            ErrorMessage = "Enter a valid PAN format.")]
        public string PAN { get; set; } = "";

        // REGISTERED BUSINESS ADDRESS
        [Required]
        public string AddressLine1 { get; set; } = "";

        [Required]
        public string City { get; set; } = "";

        [Required]
        public string State { get; set; } = "";

        [Required]
        [RegularExpression(
            @"^[1-9]\d{5}$",
            ErrorMessage = "Enter a valid 6-digit PIN code.")]
        public string Pincode { get; set; } = "";

        // WAREHOUSE DETAILS
       
// WAREHOUSE DETAILS

[Required(ErrorMessage = "Warehouse full address is required.")]
public string WarehouseFullAddress { get; set; } = "";

        [Required(ErrorMessage = "Warehouse contact person name is required.")]
        public string WarehouseContactPersonName { get; set; } = "";

        [Required(ErrorMessage = "Warehouse contact mobile number is required.")]
        [RegularExpression(
            @"^[6-9]\d{9}$",
            ErrorMessage = "Enter a valid 10-digit Indian warehouse contact number.")]
        public string WarehouseContactMobileNumber { get; set; } = "";

        // BANK DETAILS
        [Required]
        public string AccountHolderName { get; set; } = "";

        [Required]
        public string AccountNumber { get; set; } = "";

        [Required]
        [RegularExpression(
            @"^[A-Z]{4}0[A-Z0-9]{6}$",
            ErrorMessage = "Enter a valid IFSC code.")]
        public string IFSCCode { get; set; } = "";

        [Required]
        public string BankName { get; set; } = "";

        // GST CERTIFICATE - REQUIRED DURING REGISTRATION
        [Required(ErrorMessage = "GST certificate is required.")]
        public IFormFile? GSTCertificateDocument { get; set; }

        // PRODUCT LICENCE / MAKE IN INDIA DOCUMENT - OPTIONAL
        public IFormFile? ProductLicenceDocument { get; set; }
    }
}
