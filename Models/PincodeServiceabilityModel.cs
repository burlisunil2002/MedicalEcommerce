using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VivekMedicalProducts.Models
{
    public class PincodeServiceabilityModel
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(10)]
        public string Pincode { get; set; } = string.Empty;

        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [StringLength(100)]
        public string State { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public int DeliveryDays { get; set; } = 2;

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingCharge { get; set; } = 0;

        [StringLength(20)]
        public string Zone { get; set; } = "Regional"; // Local / Regional / National

        public bool IsCODAvailable { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}