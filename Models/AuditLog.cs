using System.ComponentModel.DataAnnotations;

namespace VivekMedicalProducts.Models;

/// <summary>
/// Immutable-style record of a security or business event.
/// Do not store passwords, OTPs, access tokens, payment credentials,
/// PAN/GST values, or document contents in this entity.
/// </summary>
public class AuditLog
{
    public long Id { get; set; }

    public Guid EventId { get; set; } = Guid.NewGuid();

    [MaxLength(450)]
    public string? UserId { get; set; }

    // Snapshot of the display name at the time the event was recorded.
    [MaxLength(256)]
    public string? UserName { get; set; }

    [MaxLength(100)]
    public string? UserRole { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Module { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? EntityType { get; set; }

    [MaxLength(200)]
    public string? EntityId { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    // JSON serialized values stored in PostgreSQL jsonb.
    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    [Required, MaxLength(30)]
    public string Status { get; set; } = "Success";

    [MaxLength(100)]
    public string? IpAddress { get; set; }

    [MaxLength(1000)]
    public string? UserAgent { get; set; }

    [MaxLength(500)]
    public string? RequestPath { get; set; }

    [MaxLength(20)]
    public string? HttpMethod { get; set; }

    [MaxLength(100)]
    public string? CorrelationId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
