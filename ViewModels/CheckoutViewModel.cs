using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.ViewModels
{
    public class CheckoutViewModel
    {
        public List<CartModel> CartItems { get; set; } = new List<CartModel>();

        public decimal SubTotal { get; set; }

        public decimal GST { get; set; }

        public decimal GrandTotal { get; set; }

        public string FullName { get; set; }

        public string PhoneNumber { get; set; }

        public string Address { get; set; }

        public string City { get; set; }

        public string Pincode { get; set; }
    }
}