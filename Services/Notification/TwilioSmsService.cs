using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using VivekMedicalProducts.Configuration;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Templates;
using VivekMedicalProducts.Services.Storage;


namespace VivekMedicalProducts.Services.Notification
{
    public class TwilioSmsService : ISmsService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<TwilioSmsService> _logger;

        public TwilioSmsService(
     IConfiguration configuration,
     ILogger<TwilioSmsService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var sid = _configuration["Twilio:AccountSid"];
            var token = _configuration["Twilio:AuthToken"];
            var from = _configuration["Twilio:FromNumber"];

            TwilioClient.Init(sid, token);
        }

        public async Task SendOrderPlacedAsync(OrderModel order)
        {
            await SendNotification(order, "Placed");
        }

        public async Task SendOrderStatusAsync(OrderModel order, string status)
        {
            await SendNotification(order, status);
        }

        public async Task SendPaymentSuccessAsync(OrderModel order)
        {
            await SendNotification(order, "Payment Success");
        }

        public async Task SendPaymentFailedAsync(OrderModel order)
        {
            await SendNotification(order, "Payment Failed");
        }

        private async Task SendNotification(OrderModel order, string status)
        {
            try
            {
                if (order == null)
                    throw new Exception("Order is NULL");

                if (order.UserAddress == null)
                    throw new Exception("UserAddress is NULL");

                var mobile = NormalizeMobile(order.UserAddress.MobileNumber);

                if (string.IsNullOrWhiteSpace(mobile))
                    throw new Exception("Mobile number is empty");

                var message = SmsTemplateBuilder.Build(order, status);

                _logger.LogInformation("Mobile: {Mobile}", mobile);
                _logger.LogInformation("Message:\n{Message}", message);

                var response = await MessageResource.CreateAsync(
                    body: message,
                    from: new PhoneNumber(_configuration["Twilio:FromNumber"]),
                    to: new PhoneNumber(mobile));

                _logger.LogInformation("SMS Sent. SID: {Sid}", response.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS Sending Failed");
                throw;
            }
        }

        private string NormalizeMobile(string mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile))
                return string.Empty;

            mobile = mobile.Replace(" ", "")
                           .Replace("-", "");

            if (!mobile.StartsWith("+"))
            {
                if (mobile.Length == 10)
                    mobile = "+91" + mobile;
            }

            return mobile;
        }
    }
}