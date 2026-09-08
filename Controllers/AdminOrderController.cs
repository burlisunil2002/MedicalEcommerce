using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Controllers
{
    [ApiController]
    [Route("api/admin/orders")]
    [Authorize(Roles = "Admin")]
    public class AdminOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminOrderController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ORDERS - ADMIN
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetOrders(
            string search = "",
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string paymentStatus = "",
            string orderStatus = "",
            int page = 1,
            int pageSize = 100)
        {
            try
            {
                if (page < 1)
                    page = 1;

                if (pageSize < 1)
                    pageSize = 100;

                if (pageSize > 200)
                    pageSize = 200;

                // =====================================================
                // BASE QUERY
                // =====================================================

                var query =
                    from item in _context.OrderItems
                    join order in _context.Orders
                        on item.OrderId equals order.OrderId
                    join user in _context.Users
                        on order.UserId equals user.Id

                    join product in _context.Products
                        on item.ProductId equals product.Id
                        into productJoin

                    from product in productJoin.DefaultIfEmpty()

                    select new
                    {
                        OrderId = order.OrderId,
                        OrderItemId = item.OrderItemId,
                        OrderNumber = order.OrderNumber,
                        OrderDate = order.OrderDate,

                        Customer =
                            !string.IsNullOrWhiteSpace(user.CustomerName)
                                ? user.CustomerName
                                : user.UserName,

                        SellerId = item.SellerId,

                        ProductId = item.ProductId,

                        ProductName =
                            !string.IsNullOrWhiteSpace(item.ProductName)
                                ? item.ProductName
                                : product != null
                                    ? product.Name
                                    : "Product",

                        Quantity = item.Quantity,

                        Price = item.Price,

                        DiscountAmount = item.DiscountAmount,

                        CouponDiscountAmount =
                            item.CouponDiscountAmount,

                        TaxableAmount = item.TaxableAmount,

                        GSTPercentage = item.GSTPercentage,

                        GSTAmount = item.GSTAmount,

                        FinalPaidAmount = item.FinalPaidAmount,

                        LineTotal = item.LineTotal,

                        PaymentStatus =
                            order.PaymentStatus ?? "Pending",

                        RazorpayPaymentId =
                            order.RazorpayPaymentId ?? "-",

                        OrderStatus =
                            item.OrderItemStatus ?? "Placed",

                        PackedDate = item.PackedDate,

                        ShippedDate = item.ShippedDate,

                        OutForDeliveryDate =
                            item.OutForDeliveryDate,

                        DeliveredDate =
                            item.DeliveredDate,

                        ReturnStatus =
                            item.ReturnStatus,

                        IsReturnEligible =
                            item.IsReturnEligible,

                        ReturnEligibleTill =
                            item.ReturnEligibleTill,

                        CancelledAt =
                            item.CancelledAt,

                        TrackingNumber =
                            item.TrackingNumber,

                        CourierPartner =
                            item.CourierPartner,

                        GrandTotal =
                            order.GrandTotal
                    };

                // =====================================================
                // SEARCH
                // =====================================================

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchValue =
                        search.Trim().ToLower();

                    query = query.Where(x =>
                        (x.ProductName ?? "")
                            .ToLower()
                            .Contains(searchValue)

                        ||

                        (x.Customer ?? "")
                            .ToLower()
                            .Contains(searchValue)

                        ||

                        (x.OrderNumber ?? "")
                            .ToLower()
                            .Contains(searchValue)

                        ||

                        x.OrderId
                            .ToString()
                            .Contains(searchValue)
                    );
                }

                // =====================================================
                // DATE FILTER
                // =====================================================

                if (fromDate.HasValue)
                {
                    var from =
                        fromDate.Value.Date;

                    query = query.Where(x =>
                        x.OrderDate >= from);
                }

                if (toDate.HasValue)
                {
                    var to =
                        toDate.Value.Date.AddDays(1);

                    query = query.Where(x =>
                        x.OrderDate < to);
                }

                // =====================================================
                // PAYMENT FILTER
                // =====================================================

                if (!string.IsNullOrWhiteSpace(paymentStatus))
                {
                    query = query.Where(x =>
                        x.PaymentStatus == paymentStatus);
                }

                // =====================================================
                // ORDER STATUS FILTER
                // =====================================================

                if (!string.IsNullOrWhiteSpace(orderStatus))
                {
                    query = query.Where(x =>
                        x.OrderStatus == orderStatus);
                }

                // =====================================================
                // TOTAL ORDER ITEMS
                // =====================================================

                var totalOrderItems =
                    await query.CountAsync();

                // =====================================================
                // TOTAL UNIQUE ORDERS
                // =====================================================

                var totalOrders =
                    await query
                        .Select(x => x.OrderId)
                        .Distinct()
                        .CountAsync();

                var totalPages =
                    (int)Math.Ceiling(
                        (double)totalOrderItems /
                        pageSize
                    );

                // =====================================================
                // COMPLETED ITEMS
                //
                // Payment Completed + Delivered
                // =====================================================

                var completedItems =
                    await query
                        .Where(x =>
                            x.PaymentStatus == "Completed" &&
                            x.OrderStatus == "Delivered")
                        .CountAsync();

                // =====================================================
                // PENDING ITEMS
                //
                // Everything except Completed + Delivered
                // =====================================================

                var pendingItems =
                    totalOrderItems -
                    completedItems;

                // =====================================================
                // PAYMENT STATISTICS
                // =====================================================

                var completedPayments =
                    await query
                        .Where(x =>
                            x.PaymentStatus == "Completed")
                        .Select(x => x.OrderId)
                        .Distinct()
                        .CountAsync();

                var pendingPayments =
                    await query
                        .Where(x =>
                            x.PaymentStatus == "Pending")
                        .Select(x => x.OrderId)
                        .Distinct()
                        .CountAsync();

                var failedPayments =
                    await query
                        .Where(x =>
                            x.PaymentStatus == "Failed")
                        .Select(x => x.OrderId)
                        .Distinct()
                        .CountAsync();

                // =====================================================
                // DELIVERY STATISTICS
                // =====================================================

                var placed =
                    await query
                        .Where(x => x.OrderStatus == "Placed")
                        .CountAsync();

                var packed =
                    await query
                        .Where(x => x.OrderStatus == "Packed")
                        .CountAsync();

                var shipped =
                    await query
                        .Where(x => x.OrderStatus == "Shipped")
                        .CountAsync();

                var outForDelivery =
                    await query
                        .Where(x =>
                            x.OrderStatus == "OutForDelivery")
                        .CountAsync();

                var delivered =
                    await query
                        .Where(x =>
                            x.OrderStatus == "Delivered")
                        .CountAsync();

                var cancelled =
                    await query
                        .Where(x =>
                            x.OrderStatus == "Cancelled")
                        .CountAsync();

                // =====================================================
                // REVENUE
                //
                // ONLY PAYMENT COMPLETED + DELIVERED
                // =====================================================

                var revenue =
                    await query
                        .Where(x =>
                            x.PaymentStatus == "Completed" &&
                            x.OrderStatus == "Delivered")
                        .SumAsync(x =>
                            (decimal?)x.FinalPaidAmount
                        ) ?? 0m;

                // =====================================================
                // GET ORDERS
                // =====================================================

                var orders =
                    await query
                        .OrderByDescending(x => x.OrderDate)
                        .ThenByDescending(x => x.OrderId)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                // =====================================================
                // RESPONSE
                // =====================================================

                return Ok(new
                {
                    success = true,

                    pagination = new
                    {
                        page,
                        pageSize,
                        totalPages,
                        totalOrders,
                        totalOrderItems
                    },

                    statistics = new
                    {
                        totalOrders,
                        totalOrderItems,

                        completed = completedItems,
                        completedItems,

                        pending = pendingItems,
                        pendingItems,

                        completedPayments,
                        pendingPayments,
                        failedPayments,

                        placed,
                        packed,
                        shipped,
                        outForDelivery,
                        delivered,
                        cancelled,

                        revenue
                    },

                    orders
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Admin Get Orders Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load admin orders.",
                        error = ex.Message,
                        innerException =
                            ex.InnerException?.Message
                    });
            }
        }
       

        [Authorize(Roles = "Admin")]
        [HttpPut("items/{orderItemId}/status")]
        public async Task<IActionResult> UpdateOrderItemStatusDTO(
    int orderItemId,
    [FromBody] UpdateOrderStatusDto model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid request."
                    });
                }

                // =========================================================
                // GET ORDER ITEM
                // =========================================================

                var item = await _context.OrderItems
                    .Include(x => x.Order)
                    .FirstOrDefaultAsync(x =>
                        x.OrderItemId == orderItemId);

                if (item == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order item not found."
                    });
                }

                var now = DateTime.UtcNow;


                // =========================================================
                // PAYMENT STATUS
                //
                // PaymentStatus belongs to Orders table.
                // =========================================================

                if (!string.IsNullOrWhiteSpace(model.PaymentStatus))
                {
                    var paymentStatus =
                        model.PaymentStatus.Trim();

                    var validPaymentStatuses = new[]
                    {
                "Pending",
                "Completed",
                "Failed",
                "Refunded"
            };

                    if (!validPaymentStatuses.Contains(
                        paymentStatus,
                        StringComparer.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Invalid payment status."
                        });
                    }

                    paymentStatus =
                        validPaymentStatuses.First(x =>
                            x.Equals(
                                paymentStatus,
                                StringComparison.OrdinalIgnoreCase));

                    item.Order.PaymentStatus =
                        paymentStatus;

                    item.Order.OrderModifiedDate =
                        now;
                }


                // =========================================================
                // ORDER ITEM STATUS
                //
                // Delivery status belongs to OrderItems table.
                // =========================================================

                if (!string.IsNullOrWhiteSpace(model.ItemOrderStatus))
                {
                    var itemStatus =
                        model.ItemOrderStatus.Trim();

                    var validItemStatuses = new[]
                    {
                "Placed",
                "Packed",
                "Shipped",
                "OutForDelivery",
                "Delivered",
                "Cancelled"
            };

                    if (!validItemStatuses.Contains(
                        itemStatus,
                        StringComparer.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Invalid order item status."
                        });
                    }

                    itemStatus =
                        validItemStatuses.First(x =>
                            x.Equals(
                                itemStatus,
                                StringComparison.OrdinalIgnoreCase));


                    // =====================================================
                    // PREVENT DELIVERED → OTHER STATUS
                    // =====================================================

                    if (item.OrderItemStatus == "Delivered" &&
                        itemStatus != "Delivered")
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "A delivered order item cannot be moved back to another status."
                        });
                    }


                    // =====================================================
                    // PREVENT INVALID CANCELLATION
                    // =====================================================

                    if (itemStatus == "Cancelled" &&
                        item.OrderItemStatus != "Placed" &&
                        item.OrderItemStatus != "Packed")
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "This order item cannot be cancelled at its current stage."
                        });
                    }


                    // =====================================================
                    // UPDATE ITEM STATUS
                    // =====================================================

                    item.OrderItemStatus =
                        itemStatus;


                    // =====================================================
                    // STATUS TIMESTAMPS
                    // =====================================================

                    switch (itemStatus)
                    {
                        case "Packed":

                            item.PackedDate ??= now;

                            break;


                        case "Shipped":

                            item.ShippedDate ??= now;

                            break;


                        case "OutForDelivery":

                            item.OutForDeliveryDate ??= now;

                            break;


                        case "Delivered":

                            item.DeliveredDate ??= now;

                            item.IsReturnEligible = true;

                            item.ReturnEligibleTill ??=
                                now.AddDays(7);

                            break;


                        case "Cancelled":

                            item.CancelledAt ??= now;

                            break;
                    }
                }


                // =========================================================
                // COMMON AUDIT FIELDS
                // =========================================================

                item.UpdatedAt = now;

                item.ItemOrderModifiedDate = now;


                // =========================================================
                // SAVE
                // =========================================================

                await _context.SaveChangesAsync();


                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(new
                {
                    success = true,

                    message =
                        "Order status updated successfully.",

                    data = new
                    {
                        orderItemId = item.OrderItemId,

                        orderId = item.OrderId,

                        paymentStatus =
                            item.Order.PaymentStatus,

                        orderItemStatus =
                            item.OrderItemStatus,

                        packedDate =
                            item.PackedDate,

                        shippedDate =
                            item.ShippedDate,

                        outForDeliveryDate =
                            item.OutForDeliveryDate,

                        deliveredDate =
                            item.DeliveredDate,

                        cancelledAt =
                            item.CancelledAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Admin Order Status Update Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "An unexpected error occurred while updating the order."
                    });
            }
        }

        private sealed class StatusResult
        {
            public bool Success { get; private set; }

            public string Message { get; private set; } = "";

            public static StatusResult Ok()
            {
                return new StatusResult
                {
                    Success = true
                };
            }

            public static StatusResult Fail(
                string message)
            {
                return new StatusResult
                {
                    Success = false,
                    Message = message
                };
            }
        }
    }
}