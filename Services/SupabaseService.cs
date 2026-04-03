using System.Net.Http.Headers;
using VivekMedicalProducts.Services.Storage;

public class SupabaseService : IFileStorageService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public SupabaseService(IConfiguration config)
    {
        _config = config;
        _httpClient = new HttpClient();
    }

    public async Task<string> UploadAsync(IFormFile file, string folder)
    {
        var url = _config["Supabase:Url"];
        var apiKey = _config["Supabase:ApiKey"];
        var bucket = _config["Supabase:Bucket"] ?? "uploads";

        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(apiKey))
            throw new Exception("Supabase config missing");

        var fileName = $"{folder}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);
        _httpClient.DefaultRequestHeaders.Add("apikey", apiKey);
        _httpClient.DefaultRequestHeaders.Add("x-upsert", "true");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var content = new ByteArrayContent(ms.ToArray());
        content.Headers.ContentType =
            new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");

        var response = await _httpClient.PutAsync(
            $"{url}/storage/v1/object/{bucket}/{fileName}",
            content);

        if (!response.IsSuccessStatusCode)
            throw new Exception(await response.Content.ReadAsStringAsync());

        return $"{url}/storage/v1/object/public/{bucket}/{fileName}";
    }
}