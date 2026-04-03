using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.ViewModels
{
   public class LoginViewModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public bool IsProfileCompleted { get; set; } = false;

    }
}