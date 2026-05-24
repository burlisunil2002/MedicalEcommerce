using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

public class ApplicationUser : IdentityUser
{
    public string Status { get; set; } = "Active";

    public string? CompanyName { get; set; }
    public string? CustomerName { get; set; }
    public string? IndustrySector { get; set; }
    public string? MobileNo { get; set; }
    public string? SecondaryEmail { get; set; }
    public string? SecondaryMobile { get; set; }
    public string? GSTNo { get; set; }
    public string? PANNo { get; set; }
    public string? Address { get; set; }
    public string? DocumentPath { get; set; }

    public bool? GSTVerified { get; set; }
    public string? GSTBusinessName { get; set; }
    public string? GSTState { get; set; }

    public bool IsApproved { get; set; } = false;

    // 🔐 OTP Fields
    public string? LoginOTP { get; set; }
    public DateTime? OTPExpiry { get; set; }
    public DateTime? OTPLastSentAt { get; set; }

    // 🧠 Flow control
    public bool IsProfileCompleted { get; set; } = false;
    public bool IsOtpUser { get; set; } = false;
}