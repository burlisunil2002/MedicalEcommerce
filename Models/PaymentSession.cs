using System.ComponentModel.DataAnnotations;

public class PaymentSession
{
    [Key]
    public int Id { get; set; }

    public int CheckoutSessionId { get; set; }

    public string RazorpayOrderId { get; set; } = string.Empty;

    public string? RazorpayPaymentId { get; set; }

    public string? RazorpaySignature { get; set; }

    public string? UserId { get; set; }

    public string? GuestId { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "INR";

    public string PaymentStatus { get; set; } = "Initiated";

    public bool IsCompleted { get; set; }

    public string? FailureReason { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public DateTime? PaymentCompletedDate { get; set; }

    public DateTime ExpiryDate { get; set; } =
        DateTime.UtcNow.AddMinutes(30);
}