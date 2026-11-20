using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services;

public class DeliveryBatchService
{
    private readonly ApplicationDbContext _db;

    public DeliveryBatchService(ApplicationDbContext db)
    {
        _db = db;
    }

    // Backwards-compatible method name used by existing controllers.
    public Task<(int BatchId, int InvoiceId, string InvoiceNumber)>
        AddOutForDeliveryItemAsync(
            OrderItemModel item,
            CancellationToken cancellationToken = default)
    {
        return EnsureBatchAndInvoiceAsync(item, cancellationToken);
    }

    /// <summary>
    /// Creates or reuses a delivery batch and its batch-item record.
    /// Also creates or updates the seller invoice for that batch.
    /// Payment status and seller GST verification are deliberately
    /// not used as conditions for batch or invoice creation.
    /// </summary>
    public async Task<(int BatchId, int InvoiceId, string InvoiceNumber)>
        EnsureBatchAndInvoiceAsync(
            OrderItemModel item,
            CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (!item.SellerId.HasValue)
        {
            throw new InvalidOperationException(
                "A seller must be assigned before creating a delivery batch.");
        }

        var now = DateTime.UtcNow;
        var batchDate = (
            item.OutForDeliveryDate ??
            item.DeliveredDate ??
            now).Date;

        await using var transaction =
            await _db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Verify the order exists before creating any delivery records.
            var order = await _db.Orders
                .Include(x => x.UserAddress)
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.OrderId == item.OrderId && !x.IsDeleted,
                    cancellationToken);

            if (order == null)
            {
                throw new InvalidOperationException("Order not found.");
            }

            // Seller existence is required for ownership and invoice details.
            // GST verification and payment status are not validated here.
            var seller = await _db.Sellers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    x => x.SellerId == item.SellerId.Value,
                    cancellationToken);

            if (seller == null)
            {
                throw new InvalidOperationException("Seller not found.");
            }

            // Prefer the batch already linked to this order item.
            DeliveryBatchModel? batch = null;

            if (item.DeliveryBatchId.HasValue)
            {
                batch = await _db.DeliveryBatches
                    .Include(x => x.BatchItems)
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeliveryBatchId == item.DeliveryBatchId.Value &&
                            x.OrderId == item.OrderId &&
                            x.SellerId == item.SellerId.Value,
                        cancellationToken);
            }

            // Otherwise reuse the batch for the same order, seller and date.
            batch ??= await _db.DeliveryBatches
                .Include(x => x.BatchItems)
                .FirstOrDefaultAsync(
                    x =>
                        x.OrderId == item.OrderId &&
                        x.SellerId == item.SellerId.Value &&
                        x.OutForDeliveryDate == batchDate,
                    cancellationToken);

            // Create the batch if no matching batch exists.
            if (batch == null)
            {
                batch = new DeliveryBatchModel
                {
                    OrderId = item.OrderId,
                    SellerId = item.SellerId.Value,
                    BatchNumber =
                        $"DB-{item.OrderId}-{item.SellerId.Value}-{batchDate:yyyyMMdd}",
                    OutForDeliveryDate = batchDate,
                    Status = "OutForDelivery",
                    CreatedAt = now
                };

                _db.DeliveryBatches.Add(batch);
                await _db.SaveChangesAsync(cancellationToken);
            }

            // Add this order item to the batch only once.
            var batchItem = await _db.DeliveryBatchItems
                .FirstOrDefaultAsync(
                    x =>
                        x.DeliveryBatchId == batch.DeliveryBatchId &&
                        x.OrderItemId == item.OrderItemId,
                    cancellationToken);

            if (batchItem == null)
            {
                batchItem = new DeliveryBatchItemModel
                {
                    DeliveryBatchId = batch.DeliveryBatchId,
                    OrderItemId = item.OrderItemId,
                    DispatchedQuantity = item.Quantity,
                    TaxableAmount = item.TaxableAmount,
                    GstAmount = item.GSTAmount,
                    LineTotal = item.NetAmount > 0
                        ? item.NetAmount
                        : item.FinalPaidAmount
                };

                _db.DeliveryBatchItems.Add(batchItem);
            }
            else
            {
                // Keep the existing batch line synchronized if this method
                // is retried after the order item's amounts were corrected.
                batchItem.DispatchedQuantity = item.Quantity;
                batchItem.TaxableAmount = item.TaxableAmount;
                batchItem.GstAmount = item.GSTAmount;
                batchItem.LineTotal = item.NetAmount > 0
                    ? item.NetAmount
                    : item.FinalPaidAmount;
            }

            // Link the order item to the batch.
            item.DeliveryBatchId = batch.DeliveryBatchId;

            await _db.SaveChangesAsync(cancellationToken);

            // One seller invoice per delivery batch.
            var invoice = await _db.SellerInvoices
                .Include(x => x.Items)
                .FirstOrDefaultAsync(
                    x =>
                        x.DeliveryBatchId == batch.DeliveryBatchId &&
                        x.SellerId == item.SellerId.Value,
                    cancellationToken);

            if (invoice == null)
            {
                var customerAddress = order.UserAddress == null
                    ? "Address not available"
                    : ReadAddress(order.UserAddress);

                var supplierAddress = string.Join(
                    ", ",
                    new[]
                    {
                        seller.AddressLine1,
                        seller.City,
                        seller.State,
                        seller.Pincode
                    }.Where(x => !string.IsNullOrWhiteSpace(x)));

                invoice = new SellerInvoiceModel
                {
                    InvoiceNumber =
                        $"SELL{seller.SellerId}-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}",
                    OrderId = order.OrderId,
                    OrderNumber = order.OrderNumber,
                    SellerId = seller.SellerId,
                    DeliveryBatchId = batch.DeliveryBatchId,
                    SupplierType = "Seller",
                    SupplierName = seller.BusinessName,
                    SupplierGSTIN = seller.GSTNumber,
                    SupplierAddress = supplierAddress,
                    CustomerName =
                        order.User?.UserName ??
                        order.UserAddress?.FullName ??
                        "Customer",
                    CustomerAddress = customerAddress,
                    CustomerPhone = order.UserAddress?.MobileNumber,
                    CustomerGSTIN = null,
                    PlaceOfSupply =
                        order.UserAddress?.State ?? seller.State ?? "India",
                    IssuedAtUtc = now,
                    Status = "Issued"
                };

                _db.SellerInvoices.Add(invoice);
                await _db.SaveChangesAsync(cancellationToken);
            }

            // Avoid inserting a duplicate invoice line when this operation
            // is retried for the same order item or batch item.
            var invoiceItemExists = await _db.SellerInvoiceItems
                .AnyAsync(
                    x =>
                        x.DeliveryBatchItemId == batchItem.DeliveryBatchItemId ||
                        x.OrderItemId == item.OrderItemId,
                    cancellationToken);

            if (!invoiceItemExists)
            {
                var orderItem = await _db.OrderItems
                    .Include(x => x.Product)
                    .FirstOrDefaultAsync(
                        x => x.OrderItemId == item.OrderItemId,
                        cancellationToken);

                if (orderItem == null)
                {
                    throw new InvalidOperationException("Order item not found.");
                }

                invoice.Items.Add(new SellerInvoiceItemModel
                {
                    OrderItemId = item.OrderItemId,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    HSNCode = orderItem.Product?.HSNCode,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    TaxableAmount = item.TaxableAmount,
                    GstPercentage = item.GSTPercentage,
                    GstAmount = item.GSTAmount,
                    LineTotal = item.NetAmount > 0
                        ? item.NetAmount
                        : item.FinalPaidAmount,
                    DeliveryBatchItemId = batchItem.DeliveryBatchItemId
                });
            }

            // Recalculate invoice totals from its persisted/current lines.
            invoice.TaxableTotal =
                invoice.Items.Sum(x => x.TaxableAmount);

            invoice.GstTotal =
                invoice.Items.Sum(x => x.GstAmount);

            invoice.InvoiceTotal =
                invoice.Items.Sum(x => x.LineTotal);

            await _db.SaveChangesAsync(cancellationToken);

            // A batch is Delivered only when every linked order item
            // has reached Delivered status.
            var batchOrderItemIds = await _db.DeliveryBatchItems
                .Where(x => x.DeliveryBatchId == batch.DeliveryBatchId)
                .Select(x => x.OrderItemId)
                .ToListAsync(cancellationToken);

            var allItemsDelivered = batchOrderItemIds.Count > 0 &&
                await _db.OrderItems
                    .Where(x => batchOrderItemIds.Contains(x.OrderItemId))
                    .AllAsync(
                        x => x.OrderItemStatus == "Delivered",
                        cancellationToken);

            batch.Status = allItemsDelivered
                ? "Delivered"
                : "OutForDelivery";

            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return (
                batch.DeliveryBatchId,
                invoice.SellerInvoiceId,
                invoice.InvoiceNumber
            );
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static string ReadAddress(object address)
    {
        var names = new[]
        {
            "AddressLine1",
            "AddressLine2",
            "City",
            "District",
            "State",
            "Pincode",
            "PostalCode"
        };

        return string.Join(
            ", ",
            names.Select(name =>
                address.GetType()
                    .GetProperty(name)?
                    .GetValue(address)?
                    .ToString())
            .Where(value => !string.IsNullOrWhiteSpace(value)));
    }
}
