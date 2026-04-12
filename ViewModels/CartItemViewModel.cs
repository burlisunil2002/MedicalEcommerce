using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.ViewModels
{
    public class CartItemViewModel
    {
        public List<CartModel> CartItems { get; set; }

        public decimal SubTotal { get; set; }

        public decimal GSTTotal { get; set; }

        public decimal GrandTotal { get; set; }

        public decimal GST { get; set; }

        public decimal Discount { get; set; }
        public decimal Delivery { get; set; }


    }
}