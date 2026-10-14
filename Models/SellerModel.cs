using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class SellerModel
    {
        [Key]
        public int SellerId { get; set; }

        // LOGIN LINK
        [Required]
        public string UserId { get; set; } = string.Empty;

        // BASIC DETAILS
        [Required]
        public string BusinessName { get; set; } = string.Empty;

        [Required]
        public string OwnerName { get; set; } = string.Empty;

        [Required]
        public string ProductType { get; set; } = string.Empty;

        public string? Brand { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, Phone]
        public string Phone { get; set; } = string.Empty;

        // GST / PAN
        [Required]
        public string GSTNumber { get; set; } = string.Empty;

        public bool IsGSTVerified { get; set; }

        [Required]
        public string PAN { get; set; } = string.Empty;

        public bool IsPANVerified { get; set; }

        // BUSINESS ADDRESS
        [Required]
        public string AddressLine1 { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string State { get; set; } = string.Empty;

        [Required]
        public string Pincode { get; set; } = string.Empty;

        // WAREHOUSE DETAILS

        [Required]
        public string WarehouseFullAddress { get; set; } = string.Empty;

        [Required]
        public string WarehouseContactPersonName { get; set; } = string.Empty;

        [Phone]
        [Required]
        public string WarehouseContactMobileNumber { get; set; } = string.Empty;

        // BANK DETAILS
        [Required]
        public string AccountHolderName { get; set; } = string.Empty;

        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        public string IFSCCode { get; set; } = string.Empty;

        [Required]
        public string BankName { get; set; } = string.Empty;

        // DOCUMENTS
        public string? GSTCertificateDocumentPath { get; set; }

        public string? ProductLicenceDocumentPath { get; set; }

        // SUBSCRIPTION CONTROL
        public DateTime? SubscriptionStartDate { get; set; }

        public DateTime? SubscriptionEndDate { get; set; }

        public DateTime? FreeSubscriptionStartDate { get; set; }

        public DateTime? FreeSubscriptionEndDate { get; set; }

        public string? SubscriptionPlan { get; set; }

        public bool IsLaunchFreeSubscription { get; set; } = true;

        // ACCOUNT STATUS
        public bool IsActive { get; set; } = false;

        public string Status { get; set; } = "Inactive";

        // AUDIT
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<ProductModel>? Products { get; set; }
    }
}