using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models
{
    public class CheckoutSessionModel
    {
        [Key]
        public int Id { get; set; }

        public string? UserId { get; set; }

        public string? GuestId { get; set; }

        public int? SelectedAddressId { get; set; }

        public UserAddress? SelectedAddress { get; set; }

        public string? CouponCode { get; set; }

        public decimal SubTotal { get; set; }

        public decimal GSTAmount { get; set; }

        public decimal ShippingCharge { get; set; }

        public decimal CouponDiscount { get; set; }

        public decimal GrandTotal { get; set; }

        public string Currency { get; set; } = "INR";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }
            = DateTime.UtcNow;

        public DateTime ModifiedDate { get; set; }
            = DateTime.UtcNow;
    }
}