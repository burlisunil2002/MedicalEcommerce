using System;

namespace VivekMedicalProducts.Models
{
    public class PasswordResetOtp
    {
        public int Id { get; set; }

        public string Email { get; set; }

        public string OtpCode { get; set; }

        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; }
    }
}