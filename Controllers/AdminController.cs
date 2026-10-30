
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Interfaces;


namespace VivekMedicalProducts.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            ApplicationDbContext context,
            IAuditService auditService,
            ILogger<AdminController> logger)
        {
            _context = context;
            _auditService = auditService;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            try
            {
                var totalProducts =
                    await _context.Products.CountAsync();

                var totalOrders =
                    await _context.Orders.CountAsync();

                var totalUsers =
                    await _context.Users.CountAsync();

                var completedOrderItemsQuery =
                    _context.OrderItems
                        .Where(item =>
                            item.Order.PaymentStatus == "Completed" &&
                            item.OrderItemStatus == "Delivered");

                var completedItems =
                    await completedOrderItemsQuery.CountAsync();

                var totalOrderItems =
                    await _context.OrderItems.CountAsync();

                var pendingItems =
                    totalOrderItems - completedItems;

                var revenue =
                    await completedOrderItemsQuery
                        .SumAsync(item =>
                            (decimal?)item.FinalPaidAmount) ?? 0;

                var completedPayments =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.Order.PaymentStatus == "Completed");

                var failedPayments =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.Order.PaymentStatus == "Failed");

                var refundedPayments =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.Order.PaymentStatus == "Refunded");

                var deliveredItems =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.OrderItemStatus == "Delivered");

                var shippedItems =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.OrderItemStatus == "Shipped");

                var outForDeliveryItems =
                    await _context.OrderItems
                        .CountAsync(item =>
                            item.OrderItemStatus == "OutForDelivery");

                // Audit successful dashboard access.
                await LogDashboardAuditAsync(
                    "Success",
                    "Admin viewed the dashboard successfully.");

                return Ok(new
                {
                    totalProducts,
                    totalOrders,
                    totalUsers,

                    revenue,

                    totalOrderItems,
                    completedItems,
                    pendingItems,

                    completedPayments,
                    failedPayments,
                    refundedPayments,

                    deliveredItems,
                    shippedItems,
                    outForDeliveryItems
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Admin dashboard loading failed.");

                await LogDashboardAuditAsync(
                    "Failed",
                    "Admin dashboard loading failed.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to load dashboard data."
                    });
            }
        }

        private async Task LogDashboardAuditAsync(
            string status,
            string description)
        {
            try
            {
                await _auditService.LogAsync(
                    action: "ViewDashboard",
                    module: "Admin Dashboard",
                    status: status,
                    entityType: "Dashboard",
                    entityId: null,
                    description: description
                );
            }
            catch (Exception ex)
            {
                // Audit failure should not expose internal errors
                // or unnecessarily break dashboard access.
                _logger.LogError(
                    ex,
                    "Failed to save Admin Dashboard audit log.");
            }

        }

        [HttpGet("audit-logs")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAuditLogs(
    [FromQuery] string? search = null,
    [FromQuery] string? role = null,
    [FromQuery] string? module = null,
    [FromQuery] string? action = null,
    [FromQuery] string? status = null,
    [FromQuery] DateTime? from = null,
    [FromQuery] DateTime? to = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    CancellationToken cancellationToken = default)
        {
            try
            {
                // Pagination validation
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.AuditLogs.AsNoTracking();

                // Search by username, user ID, event ID and description
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchPattern = $"%{search.Trim()}%";

                    query = query.Where(x =>
                        (x.UserName != null &&
                         EF.Functions.ILike(x.UserName, searchPattern)) ||

                        (x.UserId != null &&
                         EF.Functions.ILike(x.UserId, searchPattern)) ||

                        (x.Description != null &&
                         EF.Functions.ILike(x.Description, searchPattern)));
                }

                // Role filter
                if (!string.IsNullOrWhiteSpace(role))
                {
                    query = query.Where(x => x.UserRole == role.Trim());
                }

                // Module filter
                if (!string.IsNullOrWhiteSpace(module))
                {
                    var modulePattern = $"%{module.Trim()}%";

                    query = query.Where(x =>
                        x.Module != null &&
                        EF.Functions.ILike(x.Module, modulePattern));
                }

                // Action filter
                if (!string.IsNullOrWhiteSpace(action))
                {
                    var actionPattern = $"%{action.Trim()}%";

                    query = query.Where(x =>
                        x.Action != null &&
                        EF.Functions.ILike(x.Action, actionPattern));
                }

                // Status filter
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(x => x.Status == status.Trim());
                }

                // From date filter
                if (from.HasValue)
                {
                    var fromDate = from.Value.Date;

                    query = query.Where(x =>
                        x.CreatedAt >= fromDate);
                }

                // To date filter (inclusive)
                if (to.HasValue)
                {
                    var toDate = to.Value.Date.AddDays(1);

                    query = query.Where(x =>
                        x.CreatedAt < toDate);
                }

                // Total matching records
                var totalRecords = await query.CountAsync(cancellationToken);

                // Fetch newest records first
                var auditLogs = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new
                    {
                        id = x.Id,
                        userId = x.UserId,
                        userName = x.UserName,
                        userRole = x.UserRole,
                        action = x.Action,
                        module = x.Module,
                        entityType = x.EntityType,
                        entityId = x.EntityId,
                        description = x.Description,
                        status = x.Status,
                        createdAt = x.CreatedAt
                    })
                    .ToListAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    items = auditLogs,
                    total = totalRecords,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling(
                        totalRecords / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                // Log server-side; do not expose internal exception details.
                _logger.LogError(ex, "Failed to retrieve audit logs.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to retrieve audit logs."
                });
            }
        }
    }
}
