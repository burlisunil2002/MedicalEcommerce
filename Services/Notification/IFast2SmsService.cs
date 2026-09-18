namespace VivekMedicalProducts.Services.Notification
{
    public interface IFast2SmsService
    {
        Task<bool> SendOrderSmsAsync(
            string mobile,
            string customerName,
            string orderNumber,
            decimal amount);
    }
}