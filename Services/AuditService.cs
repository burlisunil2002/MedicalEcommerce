using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services;

public sealed class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public AuditService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
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
        string? actorUserName = null)
    {
        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("Audit action is required.", nameof(action));

        if (string.IsNullOrWhiteSpace(module))
            throw new ArgumentException("Audit module is required.", nameof(module));

        var http = _httpContextAccessor.HttpContext;
        var principal = http?.User;

        var userId = actorUserId
            ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal?.FindFirstValue("sub");

        var userName = actorUserName
            ?? principal?.FindFirstValue(ClaimTypes.Name)
            ?? principal?.Identity?.Name
            ?? principal?.FindFirstValue(ClaimTypes.Email);

        var userRole = actorRole;

        if (string.IsNullOrWhiteSpace(userRole))
        {
            if (principal?.IsInRole("Admin") == true)
                userRole = "Admin";
            else if (principal?.IsInRole("Seller") == true)
                userRole = "Seller";
            else if (principal?.IsInRole("Customer") == true)
                userRole = "Customer";
            else if (principal?.Identity?.IsAuthenticated == true)
                userRole = "Authenticated";
            else
                userRole = "Anonymous";
        }

        var audit = new AuditLog
        {
            EventId = Guid.NewGuid(),
            UserId = Limit(userId, 450),
            UserName = Limit(userName, 256),
            UserRole = Limit(userRole, 100),
            Action = Limit(action.Trim(), 100)!,
            Module = Limit(module.Trim(), 100)!,
            Status = Limit(string.IsNullOrWhiteSpace(status) ? "Success" : status.Trim(), 30)!,
            EntityType = Limit(entityType, 150),
            EntityId = Limit(entityId, 200),
            Description = Limit(description, 1000),
            OldValues = SerializeSafeValues(oldValues),
            NewValues = SerializeSafeValues(newValues),
            IpAddress = Limit(http?.Connection.RemoteIpAddress?.ToString(), 100),
            UserAgent = Limit(http?.Request.Headers.UserAgent.ToString(), 1000),
            RequestPath = Limit(http?.Request.Path.Value, 500),
            HttpMethod = Limit(http?.Request.Method, 20),
            CorrelationId = Limit(http?.TraceIdentifier, 100),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(audit);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string? SerializeSafeValues(object? value)
    {
        if (value is null)
            return null;

        // Callers must pass explicitly selected, non-sensitive fields only.
        return JsonSerializer.Serialize(value, JsonOptions);
    }

    private static string? Limit(string? value, int maxLength)
    {
        if (value is null)
            return null;

        return value.Length <= maxLength
            ? value
            : value[..maxLength];
    }
}
