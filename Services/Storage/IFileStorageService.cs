using Microsoft.AspNetCore.Http;

namespace VivekMedicalProducts.Services.Storage
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(IFormFile file, string folder);
    }
}
