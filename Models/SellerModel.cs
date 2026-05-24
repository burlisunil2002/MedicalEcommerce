using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class SellerModel
    {
        [Key]
        public int SellerId { get; set; }

        // 🔥 LOGIN LINK
        [Required]
        public string UserId { get; set; }

        // 🔹 BASIC
        [Required]
        public string BusinessName { get; set; }

        [Required]
        public string OwnerName { get; set; }

        [Required]
        public string ProductType { get; set; }

        public string? Brand { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public string Phone { get; set; }

        // 🔹 GST / PAN (MANDATORY)
        [Required]
        public string GSTNumber { get; set; } = "";

        public bool IsGSTVerified { get; set; }

        [Required]
        public string PAN { get; set; } = "";

        public bool IsPANVerified { get; set; }

        // 🔹 ADDRESS
        [Required]
        public string AddressLine1 { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string State { get; set; }

        [Required]
        public string Pincode { get; set; }

        // 🔹 BANK
        [Required]
        public string AccountHolderName { get; set; }

        [Required]
        public string AccountNumber { get; set; }

        [Required]
        public string IFSCCode { get; set; }

        [Required]
        public string BankName { get; set; }

        // 🔥 SUBSCRIPTION CONTROL
        public DateTime? SubscriptionEndDate { get; set; }

        public bool IsActive { get; set; } = false;

        public string Status { get; set; } = "Inactive";

        // 🔹 AUDIT
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<ProductModel>? Products { get; set; }
    }
}