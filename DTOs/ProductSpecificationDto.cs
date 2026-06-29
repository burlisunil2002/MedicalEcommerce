using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.DTOs
    {
        public class ProductSpecificationDto
        {
            [Required(ErrorMessage = "Specification name is required")]
            public string Key { get; set; }

            [Required(ErrorMessage = "Specification value is required")]
            public string Value { get; set; }
        }
    }

