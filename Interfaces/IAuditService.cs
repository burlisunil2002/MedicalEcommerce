namespace VivekMedicalProducts.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string module,
        string status = "Success",
        string? entityType = null,
        string? entityId = null,
        string? description = null,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken cancellationToken = default,
        string? actorUserId = null,
        string? actorRole = null,
        string? actorUserName = null);
}