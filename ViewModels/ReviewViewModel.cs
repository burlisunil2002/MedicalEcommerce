using VivekMedicalProducts.Models;

public class ReviewViewModel
{
    public OrderModel Address { get; set; }
    public List<CartModel> Carts { get; set; }
    public decimal TotalAmount { get; set; }
}