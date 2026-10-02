using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
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
            [FromQuery] string search = "",
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string paymentStatus = "",
            [FromQuery] string orderStatus = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 200);

                // =====================================================
                // BASE QUERY
                // One row = one order item.
                // This keeps order-item status and seller ownership accurate.
                // =====================================================

                var query =
                    from item in _context.OrderItems.AsNoTracking()
                    join order in _context.Orders.AsNoTracking()
                        on item.OrderId equals order.OrderId
                    join user in _context.Users.AsNoTracking()
                        on order.UserId equals user.Id
                    join product in _context.Products.AsNoTracking()
                        on item.ProductId equals product.Id into productJoin
                    from product in productJoin.DefaultIfEmpty()
                    select new
                    {
                        OrderId = order.OrderId,
                        OrderItemId = item.OrderItemId,
                        OrderNumber = order.OrderNumber,
                        OrderDate = order.OrderDate,

                        CustomerId = order.UserId,
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
                        CouponDiscountAmount = item.CouponDiscountAmount,
                        TaxableAmount = item.TaxableAmount,
                        GSTPercentage = item.GSTPercentage,
                        GSTAmount = item.GSTAmount,
                        FinalPaidAmount = item.FinalPaidAmount,
                        LineTotal = item.LineTotal,

                        PaymentStatus = order.PaymentStatus ?? "Pending",
                        RazorpayPaymentId = order.RazorpayPaymentId ?? "-",

                        IsOnlinePayment = !string.IsNullOrWhiteSpace(order.RazorpayPaymentId),

                        // Item amount after discount/coupon allocation.
                        ItemFinalPaidAmount = item.FinalPaidAmount,
                        // Complete order amount, including any order-level delivery charge.
                        OrderFinalPaidAmount = order.GrandTotal,

                        OrderStatus = item.OrderItemStatus ?? "Placed",

                        PackedDate = item.PackedDate,
                        ShippedDate = item.ShippedDate,
                        OutForDeliveryDate = item.OutForDeliveryDate,
                        DeliveredDate = item.DeliveredDate,

                        ReturnStatus = item.ReturnStatus,
                        IsReturnEligible = item.IsReturnEligible,
                        ReturnEligibleTill = item.ReturnEligibleTill,

                        CancelledAt = item.CancelledAt,
                        TrackingNumber = item.TrackingNumber,
                        CourierPartner = item.CourierPartner,

                        GrandTotal = order.GrandTotal
                    };

                // =====================================================
                // SEARCH
                // Product + customer + order number + IDs
                // =====================================================

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchValue = search.Trim().ToLower();

                    query = query.Where(x =>
                        (x.ProductName ?? "").ToLower().Contains(searchValue) ||
                        (x.Customer ?? "").ToLower().Contains(searchValue) ||
                        (x.OrderNumber ?? "").ToLower().Contains(searchValue) ||
                        x.OrderId.ToString().Contains(searchValue) ||
                        x.OrderItemId.ToString().Contains(searchValue) ||
                        (x.TrackingNumber ?? "").ToLower().Contains(searchValue) ||
                        (x.CourierPartner ?? "").ToLower().Contains(searchValue));
                }

                // =====================================================
                // DATE FILTER
                // =====================================================

                if (fromDate.HasValue)
                {
                    var from = fromDate.Value.Date;
                    query = query.Where(x => x.OrderDate >= from);
                }

                if (toDate.HasValue)
                {
                    var toExclusive = toDate.Value.Date.AddDays(1);
                    query = query.Where(x => x.OrderDate < toExclusive);
                }

                // =====================================================
                // PAYMENT FILTER
                // =====================================================

                if (!string.IsNullOrWhiteSpace(paymentStatus))
                {
                    query = query.Where(x => x.PaymentStatus == paymentStatus.Trim());
                }

                // =====================================================
                // ORDER ITEM STATUS FILTER
                // =====================================================

                if (!string.IsNullOrWhiteSpace(orderStatus))
                {
                    query = query.Where(x => x.OrderStatus == orderStatus.Trim());
                }

                // =====================================================
                // CORE STATISTICS - SINGLE AGGREGATE QUERY
                // =====================================================

                var core = await query
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        TotalOrderItems = g.Count(),

                        CompletedItems = g.Count(x =>
                            x.PaymentStatus == "Completed" &&
                            x.OrderStatus == "Delivered"),

                        Placed = g.Count(x => x.OrderStatus == "Placed"),
                        Accepted = g.Count(x => x.OrderStatus == "Accepted"),
                        Packed = g.Count(x => x.OrderStatus == "Packed"),
                        Shipped = g.Count(x => x.OrderStatus == "Shipped"),
                        OutForDelivery = g.Count(x => x.OrderStatus == "OutForDelivery"),
                        Delivered = g.Count(x => x.OrderStatus == "Delivered"),
                        Cancelled = g.Count(x => x.OrderStatus == "Cancelled"),

                        ReturnRequested = g.Count(x => x.ReturnStatus == "Requested"),
                        ReturnApproved = g.Count(x => x.ReturnStatus == "Approved"),
                        Returned = g.Count(x => x.ReturnStatus == "Returned"),
                        Refunded = g.Count(x => x.ReturnStatus == "Refunded"),

                        Revenue = g
                            .Where(x =>
                                x.PaymentStatus == "Completed" &&
                                x.OrderStatus == "Delivered")
                            .Sum(x => (decimal?)x.FinalPaidAmount) ?? 0m
                    })
                    .FirstOrDefaultAsync();

                var totalOrderItems = core?.TotalOrderItems ?? 0;
                var completedItems = core?.CompletedItems ?? 0;
                var pendingItems = totalOrderItems - completedItems;

                // =====================================================
                // UNIQUE ORDERS + CUSTOMERS
                // =====================================================

                var totalOrders = await query
                    .Select(x => x.OrderId)
                    .Distinct()
                    .CountAsync();

                var customers = await query
                    .Where(x => x.CustomerId != null)
                    .Select(x => x.CustomerId)
                    .Distinct()
                    .CountAsync();

                // =====================================================
                // PAYMENT STATISTICS - UNIQUE ORDERS
                // =====================================================

                var paymentRows = await query
                    .Select(x => new
                    {
                        x.OrderId,
                        x.PaymentStatus
                    })
                    .Distinct()
                    .GroupBy(x => x.PaymentStatus)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                int PaymentCount(params string[] statuses) =>
                    paymentRows
                        .Where(x => statuses.Contains(x.Status ?? "", StringComparer.OrdinalIgnoreCase))
                        .Sum(x => x.Count);

                var cashOnDelivery = PaymentCount("Cash On Delivery", "COD");
                var initiatedPayments = PaymentCount("Initiated");
                var pendingPayments = PaymentCount("Pending");
                var completedPayments = PaymentCount("Completed");
                var failedPayments = PaymentCount("Failed");
                var refundPendingPayments = PaymentCount("Refund Pending");
                var refundedPayments = PaymentCount("Refunded");
                var cancelledPayments = PaymentCount("Cancelled");

                // =====================================================
                // MONTHLY STATISTICS
                // Same filters/search as the current view.
                // Revenue is only Completed + Delivered.
                // =====================================================

                var monthlyStatistics = await query
                    .GroupBy(x => new
                    {
                        Year = x.OrderDate.Year,
                        Month = x.OrderDate.Month
                    })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        OrderItems = g.Count(),
                        Orders = g.Select(x => x.OrderId).Distinct().Count(),
                        Customers = g
                            .Where(x => x.CustomerId != null)
                            .Select(x => x.CustomerId)
                            .Distinct()
                            .Count(),

                        Completed = g.Count(x =>
                            x.PaymentStatus == "Completed" &&
                            x.OrderStatus == "Delivered"),

                        Pending = g.Count(x =>
                            !(x.PaymentStatus == "Completed" &&
                              x.OrderStatus == "Delivered")),

                        Revenue = g
                            .Where(x =>
                                x.PaymentStatus == "Completed" &&
                                x.OrderStatus == "Delivered")
                            .Sum(x => (decimal?)x.FinalPaidAmount) ?? 0m,

                        Placed = g.Count(x => x.OrderStatus == "Placed"),
                        Accepted = g.Count(x => x.OrderStatus == "Accepted"),
                        Packed = g.Count(x => x.OrderStatus == "Packed"),
                        Shipped = g.Count(x => x.OrderStatus == "Shipped"),
                        OutForDelivery = g.Count(x => x.OrderStatus == "OutForDelivery"),
                        Delivered = g.Count(x => x.OrderStatus == "Delivered"),
                        Cancelled = g.Count(x => x.OrderStatus == "Cancelled"),

                        ReturnRequested = g.Count(x => x.ReturnStatus == "Requested"),
                        ReturnApproved = g.Count(x => x.ReturnStatus == "Approved"),
                        Returned = g.Count(x => x.ReturnStatus == "Returned"),
                        Refunded = g.Count(x => x.ReturnStatus == "Refunded")
                    })
                    .OrderByDescending(x => x.Year)
                    .ThenByDescending(x => x.Month)
                    .ToListAsync();

                // =====================================================
                // PAGINATION
                // =====================================================

                var totalPages = totalOrderItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        totalOrderItems / (double)pageSize);

                if (totalPages > 0 && page > totalPages)
                {
                    page = totalPages;
                }

                var orders = await query
                    .OrderByDescending(x => x.OrderDate)
                    .ThenByDescending(x => x.OrderId)
                    .ThenByDescending(x => x.OrderItemId)
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
                        totalOrderItems,
                        totalItems = totalOrderItems
                    },

                    statistics = new
                    {
                        totalOrders,
                        totalOrderItems,

                        completed = completedItems,
                        completedItems,

                        pending = pendingItems,
                        pendingItems,

                        customers,

                        revenue = core?.Revenue ?? 0m,

                        payment = new
                        {
                            cod = cashOnDelivery,
                            cashOnDelivery,
                            initiated = initiatedPayments,
                            pending = pendingPayments,
                            completed = completedPayments,
                            failed = failedPayments,
                            refundPending = refundPendingPayments,
                            refunded = refundedPayments,
                            cancelled = cancelledPayments
                        },

                        delivery = new
                        {
                            placed = core?.Placed ?? 0,
                            accepted = core?.Accepted ?? 0,
                            packed = core?.Packed ?? 0,
                            shipped = core?.Shipped ?? 0,
                            outForDelivery = core?.OutForDelivery ?? 0,
                            delivered = core?.Delivered ?? 0,
                            cancelled = core?.Cancelled ?? 0
                        },

                        returns = new
                        {
                            requested = core?.ReturnRequested ?? 0,
                            approved = core?.ReturnApproved ?? 0,
                            returned = core?.Returned ?? 0,
                            refunded = core?.Refunded ?? 0
                        }
                    },

                    monthlyStatistics,

                    orders
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Admin Get Orders Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to load admin orders.",
                        error = ex.Message,
                        innerException = ex.InnerException?.Message
                    });
            }
        }




        // =========================================================
        // SELLER MANAGEMENT - LIST ALL SELLERS
        // Used by:
        // GET /api/admin/orders/sellers
        //
        // This endpoint is the single source of truth for the
        // Admin Dashboard and Seller Management page.
        // =========================================================

        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers()
        {
            try
            {
                // -------------------------------------------------
                // 1. SELLER ACCOUNT DATA
                // -------------------------------------------------

                var sellers = await _context.Sellers
    .IgnoreQueryFilters()
    .AsNoTracking()
    .Select(s => new
    {
        s.SellerId,
        s.BusinessName,
        s.OwnerName,
        s.Email,
        s.Phone,
        s.ProductType,
        s.Status,
        s.IsActive,
        s.SubscriptionEndDate,
        s.CreatedAt
    })
    .OrderBy(s => s.BusinessName)
    .ToListAsync();

                if (sellers.Count == 0)
                {
                    return Ok(new
                    {
                        success = true,
                        totalSellers = 0,
                        activeSellers = 0,
                        inactiveSellers = 0,
                        sellers = Array.Empty<object>()
                    });
                }

                var sellerIds = sellers
                    .Select(s => s.SellerId)
                    .ToList();

                // -------------------------------------------------
                // 2. PRODUCT COUNTS
                // -------------------------------------------------

                var productCounts = await _context.Products
    .AsNoTracking()
    .Where(p =>
        p.SellerId.HasValue &&
        sellerIds.Contains(p.SellerId.Value))
    .GroupBy(p => p.SellerId.Value)
    .Select(g => new
    {
        SellerId = g.Key,
        ProductCount = g.Count()
    })
    .ToDictionaryAsync(
        x => x.SellerId,
        x => x.ProductCount);

                // -------------------------------------------------
                // 3. ORDER / CUSTOMER / REVENUE METRICS
                //
                // Seller ownership comes from OrderItems.SellerId.
                //
                // Completed revenue:
                // PaymentStatus = Completed
                // AND OrderItemStatus = Delivered
                // -------------------------------------------------

                var sellerOrderRows = await (
     from item in _context.OrderItems.AsNoTracking()
     join order in _context.Orders.AsNoTracking()
         on item.OrderId equals order.OrderId
     where item.SellerId.HasValue &&
           sellerIds.Contains(item.SellerId.Value)
     select new
     {
         SellerId = item.SellerId.Value,
         OrderId = item.OrderId,
         CustomerId = order.UserId,
         PaymentStatus = order.PaymentStatus ?? "Pending",
         OrderItemStatus = item.OrderItemStatus ?? "Placed",
         FinalPaidAmount = item.FinalPaidAmount
     })
     .ToListAsync();

                var sellerMetrics = sellerOrderRows
                    .GroupBy(x => x.SellerId)
                    .ToDictionary(
                        g => g.Key,
                        g => new
                        {
                            OrderCount = g
                                .Select(x => x.OrderId)
                                .Distinct()
                                .Count(),

                            OrderItems = g.Count(),

                            Customers = g
                                .Where(x => x.CustomerId != null)
                                .Select(x => x.CustomerId)
                                .Distinct()
                                .Count(),

                            CompletedOrders = g.Count(x =>
                                string.Equals(
                                    x.PaymentStatus,
                                    "Completed",
                                    StringComparison.OrdinalIgnoreCase) &&
                                string.Equals(
                                    x.OrderItemStatus,
                                    "Delivered",
                                    StringComparison.OrdinalIgnoreCase)),

                            DeliveredOrders = g.Count(x =>
                                string.Equals(
                                    x.OrderItemStatus,
                                    "Delivered",
                                    StringComparison.OrdinalIgnoreCase)),

                            PendingOrders = g.Count(x =>
                                !(string.Equals(
                                      x.PaymentStatus,
                                      "Completed",
                                      StringComparison.OrdinalIgnoreCase) &&
                                  string.Equals(
                                      x.OrderItemStatus,
                                      "Delivered",
                                      StringComparison.OrdinalIgnoreCase))),

                            Revenue = g
                                .Where(x =>
                                    string.Equals(
                                        x.PaymentStatus,
                                        "Completed",
                                        StringComparison.OrdinalIgnoreCase) &&
                                    string.Equals(
                                        x.OrderItemStatus,
                                        "Delivered",
                                        StringComparison.OrdinalIgnoreCase))
                                .Sum(x => x.FinalPaidAmount)
                        });

                // -------------------------------------------------
                // 4. BUILD RESPONSE
                // -------------------------------------------------

                var result = sellers.Select(s =>
                {
                    sellerMetrics.TryGetValue(s.SellerId, out var metrics);

                    return new
                    {
                        sellerId = s.SellerId,
                        businessName = s.BusinessName ?? "Seller",
                        ownerName = s.OwnerName ?? "-",
                        email = s.Email ?? "-",
                        phone = s.Phone ?? "-",
                        productType = s.ProductType ?? "-",
                        status = string.IsNullOrWhiteSpace(s.Status)
    ? (s.IsActive ? "Active" : "Inactive")
    : s.Status,

                        isActive = s.IsActive,
                        subscriptionEndDate = s.SubscriptionEndDate,
                        createdAt = s.CreatedAt,

                        productCount = productCounts.TryGetValue(
                            s.SellerId,
                            out var productCount)
                            ? productCount
                            : 0,

                        orderCount = metrics?.OrderCount ?? 0,
                        orderItems = metrics?.OrderItems ?? 0,
                        customers = metrics?.Customers ?? 0,
                        completedOrders = metrics?.CompletedOrders ?? 0,
                        pendingOrders = metrics?.PendingOrders ?? 0,
                        deliveredOrders = metrics?.DeliveredOrders ?? 0,
                        revenue = metrics?.Revenue ?? 0m
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    totalSellers = result.Count,
                    activeSellers = result.Count(x => x.isActive),
                    inactiveSellers = result.Count(x => !x.isActive),
                    sellers = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Admin Seller List Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to load seller management data.",
                        error = ex.Message,
                        innerException = ex.InnerException?.Message
                    });
            }
        }


        // =========================================================
        // SELLER MANAGEMENT - SINGLE SELLER DETAILS
        // Used by:
        // GET /api/admin/orders/sellers/{sellerId}
        //
        // The Seller Management "View" button calls this endpoint
        // so the modal always gets fresh seller data.
        // =========================================================

        [HttpGet("sellers/{sellerId:int}")]
        public async Task<IActionResult> GetSellerDetails(int sellerId)
        {
            try
            {
                
                var seller = await _context.Sellers
                        .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(s => s.SellerId == sellerId)
                    .Select(s => new
                    {
                        s.SellerId,
                        s.BusinessName,
                        s.OwnerName,
                        s.Email,
                        s.Phone,
                        s.ProductType,
                        s.Status,
                        s.IsActive,
                        s.SubscriptionEndDate,
                        s.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (seller == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Seller not found."
                    });
                }

                var productCount = await _context.Products
                    .AsNoTracking()
                    .CountAsync(p => p.SellerId == sellerId);

                var orderRows = await (
                    from item in _context.OrderItems.AsNoTracking()
                    join order in _context.Orders.AsNoTracking()
                        on item.OrderId equals order.OrderId
                    where item.SellerId == sellerId
                    select new
                    {
                        OrderId = item.OrderId,
                        CustomerId = order.UserId,
                        PaymentStatus = order.PaymentStatus ?? "Pending",
                        OrderItemStatus = item.OrderItemStatus ?? "Placed",
                        FinalPaidAmount = item.FinalPaidAmount
                    })
                    .ToListAsync();

                var orderCount = orderRows
                    .Select(x => x.OrderId)
                    .Distinct()
                    .Count();

                var orderItems = orderRows.Count;

                var customers = orderRows
                    .Where(x => x.CustomerId != null)
                    .Select(x => x.CustomerId)
                    .Distinct()
                    .Count();

                var completedOrders = orderRows.Count(x =>
                    string.Equals(
                        x.PaymentStatus,
                        "Completed",
                        StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(
                        x.OrderItemStatus,
                        "Delivered",
                        StringComparison.OrdinalIgnoreCase));

                var deliveredOrders = orderRows.Count(x =>
                    string.Equals(
                        x.OrderItemStatus,
                        "Delivered",
                        StringComparison.OrdinalIgnoreCase));

                var pendingOrders = orderRows.Count(x =>
                    !(string.Equals(
                          x.PaymentStatus,
                          "Completed",
                          StringComparison.OrdinalIgnoreCase) &&
                      string.Equals(
                          x.OrderItemStatus,
                          "Delivered",
                          StringComparison.OrdinalIgnoreCase)));

                var revenue = orderRows
                    .Where(x =>
                        string.Equals(
                            x.PaymentStatus,
                            "Completed",
                            StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(
                            x.OrderItemStatus,
                            "Delivered",
                            StringComparison.OrdinalIgnoreCase))
                    .Sum(x => x.FinalPaidAmount);

                return Ok(new
                {
                    success = true,
                    seller = new
                    {
                        sellerId = seller.SellerId,
                        businessName = seller.BusinessName ?? "Seller",
                        ownerName = seller.OwnerName ?? "-",
                        email = seller.Email ?? "-",
                        phone = seller.Phone ?? "-",
                        productType = seller.ProductType ?? "-",
                        status = string.IsNullOrWhiteSpace(seller.Status)
                            ? (seller.IsActive ? "Active" : "Inactive")
                            : seller.Status,
                        isActive = seller.IsActive,
                        subscriptionEndDate = seller.SubscriptionEndDate,
                        createdAt = seller.CreatedAt,

                        productCount,
                        orderCount,
                        orderItems,
                        customers,
                        completedOrders,
                        pendingOrders,
                        deliveredOrders,
                        revenue
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Admin Seller Details Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to load seller details.",
                        error = ex.Message,
                        innerException = ex.InnerException?.Message
                    });
            }
        }


        // =========================================================
        // SELLER MANAGEMENT - UPDATE SELLER ACCOUNT STATUS
        //
        // PUT:
        // /api/admin/orders/sellers/{sellerId}/status
        //
        // Body:
        // {
        //     "status": "Active"
        // }
        // =========================================================

        [HttpPut("sellers/{sellerId:int}/status")]
        public async Task<IActionResult> UpdateSellerStatus(
            int sellerId,
            [FromBody] UpdateSellerStatusDto model)
        {
            try
            {
                if (model == null ||
                    string.IsNullOrWhiteSpace(model.Status))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Seller status is required."
                    });
                }

                var requestedStatus = model.Status.Trim();

                // -------------------------------------------------
                // VALID STATUS VALUES
                // -------------------------------------------------

                var validStatuses = new[]
                {
            "Active",
            "Inactive",
            "Pending",
            "Suspended"
        };

                if (!validStatuses.Contains(
                        requestedStatus,
                        StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Invalid seller status. Allowed values: Active, Inactive, Pending, Suspended."
                    });
                }

                // Normalize status
                requestedStatus = validStatuses.First(
                    x => x.Equals(
                        requestedStatus,
                        StringComparison.OrdinalIgnoreCase));

                // -------------------------------------------------
                // FIND SELLER
                // -------------------------------------------------

                var seller = await _context.Sellers
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(s => s.SellerId == sellerId);

                if (seller == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Seller not found."
                    });
                }

                // -------------------------------------------------
                // UPDATE STATUS
                // -------------------------------------------------

                seller.Status = requestedStatus;

                // Keep IsActive synchronized with account status.
                seller.IsActive =
                    requestedStatus.Equals(
                        "Active",
                        StringComparison.OrdinalIgnoreCase);

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // RESPONSE
                // -------------------------------------------------

                return Ok(new
                {
                    success = true,
                    message = "Seller status updated successfully.",
                    seller = new
                    {
                        sellerId = seller.SellerId,
                        status = seller.Status,
                        isActive = seller.IsActive
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Update Seller Status Error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to update seller status.",
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
                // =========================================================
                // 1. VALIDATE REQUEST
                // =========================================================

                if (model == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid request."
                    });
                }

                // At least one status must be supplied
                if (string.IsNullOrWhiteSpace(model.PaymentStatus) &&
                    string.IsNullOrWhiteSpace(model.ItemOrderStatus))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Please provide PaymentStatus or ItemOrderStatus."
                    });
                }

                // =========================================================
                // 2. GET ORDER ITEM + ORDER
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
                        message = $"Order item with ID {orderItemId} was not found."
                    });
                }

                if (item.Order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Associated order was not found."
                    });
                }

                var now = DateTime.UtcNow;

                // Track what was changed
                bool paymentStatusChanged = false;
                bool itemStatusChanged = false;

                // =========================================================
                // 3. PAYMENT STATUS
                //
                // PaymentStatus belongs to Orders table.
                // =========================================================

                if (!string.IsNullOrWhiteSpace(model.PaymentStatus))
                {
                    var requestedPaymentStatus =
                        model.PaymentStatus.Trim();

                    var validPaymentStatuses = new[]
                    {
                "Pending",
                "Completed",
                "Failed",
                "Refunded"
            };

                    var normalizedPaymentStatus =
                        validPaymentStatuses.FirstOrDefault(x =>
                            x.Equals(
                                requestedPaymentStatus,
                                StringComparison.OrdinalIgnoreCase));

                    if (normalizedPaymentStatus == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Invalid payment status '{requestedPaymentStatus}'.",
                            allowedStatuses = validPaymentStatuses
                        });
                    }

                    // Update payment status
                    item.Order.PaymentStatus =
                        normalizedPaymentStatus;

                    item.Order.OrderModifiedDate =
                        now;

                    paymentStatusChanged = true;
                }

                // =========================================================
                // 4. ORDER ITEM / DELIVERY STATUS
                //
                // OrderItemStatus belongs to OrderItems table.
                // =========================================================

                if (!string.IsNullOrWhiteSpace(model.ItemOrderStatus))
                {
                    var requestedItemStatus =
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

                    var normalizedItemStatus =
                        validItemStatuses.FirstOrDefault(x =>
                            x.Equals(
                                requestedItemStatus,
                                StringComparison.OrdinalIgnoreCase));

                    if (normalizedItemStatus == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Invalid order item status '{requestedItemStatus}'.",
                            allowedStatuses = validItemStatuses
                        });
                    }

                    // =====================================================
                    // PREVENT DELIVERED → OTHER STATUS
                    // =====================================================

                    if (string.Equals(
                            item.OrderItemStatus,
                            "Delivered",
                            StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(
                            normalizedItemStatus,
                            "Delivered",
                            StringComparison.OrdinalIgnoreCase))
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

                    if (string.Equals(
                            normalizedItemStatus,
                            "Cancelled",
                            StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(
                            item.OrderItemStatus,
                            "Placed",
                            StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(
                            item.OrderItemStatus,
                            "Packed",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "This order item cannot be cancelled at its current stage."
                        });
                    }

                    // =====================================================
                    // UPDATE ORDER ITEM STATUS
                    // =====================================================

                    item.OrderItemStatus =
                        normalizedItemStatus;

                    itemStatusChanged = true;

                    // =====================================================
                    // STATUS TIMESTAMPS
                    // =====================================================

                    switch (normalizedItemStatus)
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
                // 5. COMMON AUDIT FIELDS
                // =========================================================

                item.UpdatedAt = now;

                item.ItemOrderModifiedDate = now;

                // =========================================================
                // 6. SAVE CHANGES
                // =========================================================

                await _context.SaveChangesAsync();

                // =========================================================
                // 7. RESPONSE MESSAGE
                // =========================================================

                string message;

                if (paymentStatusChanged && itemStatusChanged)
                {
                    message =
                        "Payment status and order delivery status updated successfully.";
                }
                else if (paymentStatusChanged)
                {
                    message =
                        "Payment status updated successfully.";
                }
                else
                {
                    message =
                        "Order delivery status updated successfully.";
                }

                // =========================================================
                // 8. RESPONSE
                // =========================================================

                return Ok(new
                {
                    success = true,

                    message = message,

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
                            item.CancelledAt,

                        updatedAt =
                            item.UpdatedAt,

                        itemOrderModifiedDate =
                            item.ItemOrderModifiedDate,

                        orderModifiedDate =
                            item.Order.OrderModifiedDate
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
                            "An unexpected error occurred while updating the order status.",
                        error = ex.Message,
                        innerException =
                            ex.InnerException?.Message
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