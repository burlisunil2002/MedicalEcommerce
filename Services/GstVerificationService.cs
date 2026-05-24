using VivekMedicalProducts.Models;
using System.Text.Json;

namespace VivekMedicalProducts.Models
{
    public class GstVerificationService
    {
        private readonly HttpClient _client;

        public GstVerificationService(HttpClient client)
        {
            _client = client;
        }

        public async Task<GstResponseModel?> VerifyGST(string gst)
        {
            var response = await _client.GetAsync(
                $"https://sheet.gstincheck.co.in/check/96f5b4624ca8993a9ebd254007a7d04d/{gst}");

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();

            var result = JsonSerializer.Deserialize<GstResponseModel>(json);

            if (result == null || !result.flag)
                return null;

            return result.data;
        }
    }
}

    