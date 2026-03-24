using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace VivekMedicalProducts.ViewModels
{
    public class PaymentViewModel
    {
        public int OrderId { get; set; }   // ✅ ADD THIS

        [Required(ErrorMessage = "Please enter UTR Number")]
        [StringLength(50)]
        public string UTRNumber { get; set; }

        [Required(ErrorMessage = "Please upload payment screenshot")]
        public IFormFile PaymentScreenshot { get; set; }

        // Display purpose only
        public decimal SubTotal { get; set; }
        public decimal GST { get; set; }
        public decimal GrandTotal { get; set; }
    }
}