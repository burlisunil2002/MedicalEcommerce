using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Interfaces
{
    public interface ICheckoutService
    {
        Task<CheckoutResponseDto> GetCheckoutAsync();

        Task<List<CartModel>> GetCurrentCartAsync();

        Task<CheckoutSessionModel> GetCurrentSessionAsync();

        Task<UserAddress> AddAddressAsync(UserAddress model);

        Task<UserAddress> UpdateAddressAsync(
            int id,
            UserAddress model);

        Task SaveSelectedAddressAsync(
            int addressId);

        Task ApplyCouponAsync(
            string couponCode);

        Task RemoveCouponAsync();
    }
}