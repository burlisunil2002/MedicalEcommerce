using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services.Notification
{
    public interface ISmsService
    {
        Task SendOrderPlacedAsync(OrderModel order);

        Task SendOrderStatusAsync(OrderModel order, string status);

        Task SendPaymentSuccessAsync(OrderModel order);

        Task SendPaymentFailedAsync(OrderModel order);
    }
}