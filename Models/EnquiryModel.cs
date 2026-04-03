using System;
using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{

    public class EnquiryModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public string Contact { get; set; }

        public string ProductName { get; set; }

        [Required]
        public string Remarks { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}