using System.Text;
using System.Text.Json;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services.Notification
{
    public class Fast2SmsService : IFast2SmsService
    {
        private readonly HttpClient _httpClient;
        private readonly Fast2SmsSettings _settings;

        public Fast2SmsService(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;

            _settings = configuration
                .GetSection("Fast2SMS")
                .Get<Fast2SmsSettings>()
                ?? new Fast2SmsSettings();
        }

        public async Task<bool> SendOrderSmsAsync(
            string mobile,
            string customerName,
            string orderNumber,
            decimal amount)
        {
            var variables =
                $"{customerName}|{orderNumber}|{amount:0}";

            var requestBody = new
            {
                route = "dlt",
                sender_id = _settings.SenderId,
                message = _settings.OrderMessageId,
                variables_values = variables,
                numbers = mobile
            };

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://www.fast2sms.com/dev/bulkV2");

            request.Headers.Add(
                "Authorization",
                _settings.ApiKey);

            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var response =
                await _httpClient.SendAsync(request);

            return response.IsSuccessStatusCode;
        }
    }
}