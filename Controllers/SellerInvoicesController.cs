using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Controllers;

[ApiController]
[Route("api/seller-invoices")]
public class SellerInvoicesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<SellerInvoicesController> _logger;

    public SellerInvoicesController(ApplicationDbContext db, IConfiguration config, ILogger<SellerInvoicesController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // Seller invoices are created automatically per delivery batch by DeliveryBatchService.
    [Authorize(Roles = "Seller")]
    [HttpPost("seller/orders/{orderId:int}/issue")]
    public async Task<IActionResult> IssueSellerInvoice(int orderId, [FromBody] IssueSellerInvoiceRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var seller = await _db.Sellers.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (seller == null) return Forbid();

        if (!seller.IsGSTVerified || string.IsNullOrWhiteSpace(seller.GSTNumber))
            return BadRequest(new { message = "A GST-verified seller account is required. Seller tax invoices are generated automatically when a delivery batch is created." });

        var ownsItems = await _db.OrderItems.AnyAsync(
            i => i.OrderId == orderId && i.SellerId == seller.SellerId, cancellationToken);

        if (!ownsItems)
            return NotFound(new { message = "No items belonging to this seller were found in the order." });

        return Conflict(new
        {
            message = "Seller tax invoices are generated automatically, one invoice per delivery batch. Update the item status to OutForDelivery or Delivered to create or complete its batch invoice."
        });
    }

    // JEDE/admin invoice remains order-level for JEDE-supplied items (SellerId == null).
    [Authorize(Roles = "Admin")]
    [HttpPost("admin/orders/{orderId:int}/issue-jede")]
    public async Task<IActionResult> IssueJedeInvoice(int orderId, [FromBody] IssueSellerInvoiceRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PlaceOfSupply))
            return BadRequest(new { message = "Place of supply is required." });

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        var order = await _db.Orders
            .Include(o => o.UserAddress)
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && !o.IsDeleted, cancellationToken);

        if (order == null) return NotFound(new { message = "Order not found." });

        if (!IsInvoiceableOrder(order.PaymentStatus, order.PaymentMethod))
            return BadRequest(new { message = "Invoice can be issued only after payment is completed or for an accepted COD order." });

        var items = order.OrderItems.Where(i => i.SellerId == null).ToList();
        if (items.Count == 0)
            return BadRequest(new { message = "No JEDE-supplied items were found for this order." });

        if (items.Any(i => i.Quantity <= 0 || i.TaxableAmount < 0 || i.GSTAmount < 0))
            return BadRequest(new { message = "Order item quantity or tax values are invalid." });

        var existing = await _db.SellerInvoices.AnyAsync(
            x => x.OrderId == orderId && x.SellerId == null, cancellationToken);

        if (existing)
            return Conflict(new { message = "A JEDE invoice has already been issued for this order." });

        var supplierName = _config["JEDE:LegalName"] ?? "";
        var supplierGstin = _config["JEDE:GSTIN"] ?? "";
        var supplierAddress = _config["JEDE:RegisteredAddress"] ?? "";

        if (string.IsNullOrWhiteSpace(supplierName) || string.IsNullOrWhiteSpace(supplierGstin) || string.IsNullOrWhiteSpace(supplierAddress))
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Configure JEDE:LegalName, JEDE:GSTIN and JEDE:RegisteredAddress before issuing JEDE invoices."
            });

        var invoice = BuildInvoice(order, items, null, "JEDE", supplierName, supplierGstin, supplierAddress, request);
        _db.SellerInvoices.Add(invoice);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogWarning(ex, "JEDE invoice creation conflict for OrderId {OrderId}", orderId);
            return Conflict(new { message = "The JEDE invoice could not be issued. It may already exist; refresh and check the order." });
        }

        return Ok(new { invoiceId = invoice.SellerInvoiceId, invoiceNumber = invoice.InvoiceNumber, message = "JEDE invoice issued successfully." });
    }

    [Authorize(Roles = "Seller")]
    [HttpGet("seller/mine")]
    public async Task<IActionResult> SellerInvoices(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var sellerId = await _db.Sellers.IgnoreQueryFilters()
            .Where(s => s.UserId == userId)
            .Select(s => (int?)s.SellerId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!sellerId.HasValue) return Forbid();

        var rows = await _db.SellerInvoices.AsNoTracking()
            .Where(x => x.SellerId == sellerId.Value)
            .OrderByDescending(x => x.IssuedAtUtc)
            .Select(x => new
            {
                x.SellerInvoiceId,
                x.InvoiceNumber,
                x.OrderId,
                x.OrderNumber,
                x.DeliveryBatchId,
                x.IssuedAtUtc,
                x.InvoiceTotal,
                x.Status
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    // Customer sees invoices only for their own order. canDownload is also enforced by the server below.
    [Authorize]
    [HttpGet("customer/order/{orderId:int}")]
    public async Task<IActionResult> CustomerOrderInvoices(int orderId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ownsOrder = await _db.Orders.AnyAsync(
            o => o.OrderId == orderId && o.UserId == userId && !o.IsDeleted, cancellationToken);

        if (!ownsOrder) return NotFound();

        var invoices = await _db.SellerInvoices.AsNoTracking()
            .Where(x => x.OrderId == orderId)
            .OrderBy(x => x.SellerInvoiceId)
            .Select(x => new
            {
                sellerInvoiceId = x.SellerInvoiceId,
                invoiceNumber = x.InvoiceNumber,
                orderId = x.OrderId,
                orderNumber = x.OrderNumber,
                sellerId = x.SellerId,
                supplierType = x.SupplierType,
                supplierName = x.SupplierName,
                supplierGSTIN = x.SupplierGSTIN,
                supplierAddress = x.SupplierAddress,
                customerName = x.CustomerName,
                customerAddress = x.CustomerAddress,
                customerPhone = x.CustomerPhone,
                customerGSTIN = x.CustomerGSTIN,
                placeOfSupply = x.PlaceOfSupply,
                issuedAtUtc = x.IssuedAtUtc,
                status = x.Status,
                taxableTotal = x.TaxableTotal,
                gstTotal = x.GstTotal,
                invoiceTotal = x.InvoiceTotal,
                deliveryBatchId = x.DeliveryBatchId,
                batchNumber = _db.DeliveryBatches
                    .Where(b => b.DeliveryBatchId == x.DeliveryBatchId)
                    .Select(b => b.BatchNumber).FirstOrDefault(),
                deliveryBatchStatus = _db.DeliveryBatches
                    .Where(b => b.DeliveryBatchId == x.DeliveryBatchId)
                    .Select(b => b.Status).FirstOrDefault(),
                canDownload = x.Status == "Issued" && x.DeliveryBatchId.HasValue &&
                    _db.DeliveryBatches.Any(b => b.DeliveryBatchId == x.DeliveryBatchId.Value && b.Status == "Delivered"),
                downloadUrl = $"/api/seller-invoices/{x.SellerInvoiceId}/download",
                items = x.Items.Select(i => new
                {
                    i.SellerInvoiceItemId,
                    i.OrderItemId,
                    i.ProductId,
                    i.ProductName,
                    i.HSNCode,
                    i.Quantity,
                    i.UnitPrice,
                    i.TaxableAmount,
                    i.GstPercentage,
                    i.GstAmount,
                    i.LineTotal
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return Ok(invoices);
    }

    // Detail endpoint: customer ownership and delivered-batch checks are mandatory.
    [Authorize]
    [HttpGet("{invoiceId:int}")]
    public async Task<IActionResult> CustomerInvoice(int invoiceId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var invoice = await _db.SellerInvoices.AsNoTracking()
            .FirstOrDefaultAsync(x => x.SellerInvoiceId == invoiceId && x.Status == "Issued", cancellationToken);

        if (invoice == null) return NotFound();

        var ownsOrder = await _db.Orders.AnyAsync(
            o => o.OrderId == invoice.OrderId && o.UserId == userId && !o.IsDeleted, cancellationToken);

        if (!ownsOrder) return NotFound();

        if (!invoice.DeliveryBatchId.HasValue)
            return Conflict(new { message = "This invoice is not linked to a delivery batch." });

        var batchStatus = await _db.DeliveryBatches
            .Where(b => b.DeliveryBatchId == invoice.DeliveryBatchId.Value)
            .Select(b => b.Status)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.Equals(batchStatus, "Delivered", StringComparison.OrdinalIgnoreCase))
            return Conflict(new
            {
                message = "The tax invoice will be available after the delivery batch is delivered.",
                deliveryBatchStatus = batchStatus
            });

        var items = await _db.SellerInvoices.AsNoTracking()
            .Where(x => x.SellerInvoiceId == invoiceId)
            .SelectMany(x => x.Items)
            .Select(i => new
            {
                i.SellerInvoiceItemId,
                i.OrderItemId,
                i.ProductId,
                i.ProductName,
                i.HSNCode,
                i.Quantity,
                i.UnitPrice,
                i.TaxableAmount,
                i.GstPercentage,
                i.GstAmount,
                i.LineTotal
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            invoice.SellerInvoiceId,
            invoice.InvoiceNumber,
            invoice.OrderId,
            invoice.OrderNumber,
            invoice.SellerId,
            invoice.DeliveryBatchId,
            invoice.SupplierType,
            invoice.SupplierName,
            invoice.SupplierGSTIN,
            invoice.SupplierAddress,
            invoice.CustomerName,
            invoice.CustomerAddress,
            invoice.CustomerPhone,
            invoice.CustomerGSTIN,
            invoice.PlaceOfSupply,
            invoice.IssuedAtUtc,
            invoice.Status,
            invoice.TaxableTotal,
            invoice.GstTotal,
            invoice.InvoiceTotal,
            items
        });
    }

    // React's existing download URL is secured here. Connect the actual PDF view/service
    // at the final return once the seller GST invoice PDF renderer is identified.
    [Authorize]
    [HttpGet("{invoiceId:int}/download")]
    public async Task<IActionResult> DownloadInvoice(int invoiceId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var invoice = await _db.SellerInvoices.AsNoTracking()
            .Where(x => x.SellerInvoiceId == invoiceId && x.Status == "Issued")
            .Select(x => new { x.SellerInvoiceId, x.OrderId, x.DeliveryBatchId })
            .FirstOrDefaultAsync(cancellationToken);

        if (invoice == null) return NotFound();

        var ownsOrder = await _db.Orders.AnyAsync(
            o => o.OrderId == invoice.OrderId && o.UserId == userId && !o.IsDeleted, cancellationToken);

        if (!ownsOrder) return NotFound();

        if (!invoice.DeliveryBatchId.HasValue)
            return Conflict(new { message = "This invoice is not linked to a delivery batch." });

        var delivered = await _db.DeliveryBatches.AnyAsync(
            b => b.DeliveryBatchId == invoice.DeliveryBatchId.Value && b.Status == "Delivered",
            cancellationToken);

        if (!delivered)
            return Conflict(new { message = "The tax invoice will be available after the delivery batch is delivered." });

        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = "Access is verified, but the seller tax-invoice PDF renderer has not yet been connected."
        });
    }

    private static bool IsInvoiceableOrder(string? paymentStatus, string? paymentMethod) =>
        string.Equals(paymentStatus, "Completed", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(paymentMethod, "COD", StringComparison.OrdinalIgnoreCase);

    private static SellerInvoiceModel BuildInvoice(
        OrderModel order,
        IReadOnlyCollection<OrderItemModel> items,
        int? sellerId,
        string supplierType,
        string supplierName,
        string supplierGstin,
        string supplierAddress,
        IssueSellerInvoiceRequest request)
    {
        var invoiceItems = items.Select(i => new SellerInvoiceItemModel
        {
            OrderItemId = i.OrderItemId,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            HSNCode = i.Product?.HSNCode,
            Quantity = i.Quantity,
            UnitPrice = i.Price,
            TaxableAmount = i.TaxableAmount,
            GstPercentage = i.GSTPercentage,
            GstAmount = i.GSTAmount,
            LineTotal = i.NetAmount > 0 ? i.NetAmount : i.FinalPaidAmount
        }).ToList();

        var invoice = new SellerInvoiceModel
        {
            InvoiceNumber = $"{(sellerId.HasValue ? "SELL" + sellerId : "JEDE")}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}",
            OrderId = order.OrderId,
            OrderNumber = order.OrderNumber,
            SellerId = sellerId,
            SupplierType = supplierType,
            SupplierName = supplierName,
            SupplierGSTIN = supplierGstin,
            SupplierAddress = supplierAddress,
            CustomerName = order.User?.UserName ?? "Customer",
            CustomerAddress = order.UserAddress == null ? "Address not available" : ReadAddress(order.UserAddress),
            CustomerPhone = ReadOptional(order.UserAddress, "Phone", "PhoneNumber", "MobileNumber"),
            CustomerGSTIN = request.CustomerGSTIN,
            PlaceOfSupply = request.PlaceOfSupply.Trim(),
            IssuedAtUtc = DateTime.UtcNow,
            Items = invoiceItems
        };

        invoice.TaxableTotal = invoice.Items.Sum(x => x.TaxableAmount);
        invoice.GstTotal = invoice.Items.Sum(x => x.GstAmount);
        invoice.InvoiceTotal = invoice.Items.Sum(x => x.LineTotal);
        return invoice;
    }

    private static string ReadAddress(object address)
    {
        var parts = new[] { "AddressLine1", "AddressLine2", "City", "District", "State", "Pincode", "PostalCode" }
            .Select(p => ReadOptional(address, p))
            .Where(x => !string.IsNullOrWhiteSpace(x));
        return string.Join(", ", parts);
    }

    private static string? ReadOptional(object? obj, params string[] names)
    {
        if (obj == null) return null;
        foreach (var name in names)
        {
            var value = obj.GetType().GetProperty(name)?.GetValue(obj)?.ToString();
            if (!string.IsNullOrWhiteSpace(value)) return value;
        }
        return null;
    }
}
