using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class SellerModel
    {
        public int Id { get; set; }

        // 🔹 BASIC DETAILS
        [Required]
        public string BusinessName { get; set; }

        [Required]
        public string OwnerName { get; set; }

        [Required]
        public string Email { get; set; }

        public string Phone { get; set; }

        // 🔐 AUTH
        [Required]
        public string PasswordHash { get; set; }

        // 🔹 GST DETAILS
        public string GSTNumber { get; set; }
        public bool IsGSTVerified { get; set; } = false;
        public string? GSTFilePath { get; set; }

        // 🔹 PAN DETAILS
        public string PAN { get; set; }
        public bool IsPANVerified { get; set; } = false;
        public string? PANFilePath { get; set; }

        // 🔹 SHIPPING ADDRESS
        public string AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }

        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }

        // 🔹 BANK DETAILS (FOR PAYOUT)
        public string AccountHolderName { get; set; }
        public string AccountNumber { get; set; }
        public string IFSCCode { get; set; }
        public string BankName { get; set; }

        // 🔹 STATUS CONTROL
        public bool IsActive { get; set; } = false;

        // 🔹 SUBSCRIPTION LINK (optional shortcut)
        public DateTime? SubscriptionEndDate { get; set; }

        // 🔹 AUDIT
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}