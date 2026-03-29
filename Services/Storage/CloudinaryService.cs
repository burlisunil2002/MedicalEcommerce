using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace VivekMedicalProducts.Services.Storage
{

    public class CloudinaryService : IFileStorageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var account = new Account(
                config["CloudinarySettings:CloudName"],
                config["CloudinarySettings:ApiKey"],
                config["CloudinarySettings:ApiSecret"]
            );

            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            using var stream = file.OpenReadStream();

            if (file.ContentType.StartsWith("image"))
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };

                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.StatusCode != System.Net.HttpStatusCode.OK)
                    throw new Exception("Image upload failed");

                return result.SecureUrl.ToString();
            }
            else
            {
                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };

                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.StatusCode != System.Net.HttpStatusCode.OK)
                    throw new Exception("File upload failed");

                return result.SecureUrl.ToString();
            }
        }
    }
}
