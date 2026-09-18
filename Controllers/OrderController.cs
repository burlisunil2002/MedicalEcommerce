using DocumentFormat.OpenXml.Drawing.Charts;
using DocumentFormat.OpenXml.InkML;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using Rotativa.AspNetCore;
using System.Security.Cryptography;
using System.Text;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Notification;
using VivekMedicalProducts.Services.Storage;
using VivekMedicalProducts.ViewModels;
using static ClosedXML.Excel.XLPredefinedFormat;
using DateTime = System.DateTime;

namespace VivekMedicalProducts.Controllers
{
    // ============================================================
    // STATUS CONSTANTS
    // Replaces magic strings scattered across the controller.
    // Using these everywhere removes an entire class of typo bugs
    // (e.g. "Cancled" silently never matching "Cancelled").
    // ============================================================
    public static class OrderItemStatuses
    {
        public const string Pending = "Pending";
        public const string Placed = "Placed";
        public const string Accepted = "Accepted";
        public const string Packed = "Packed";
        public const string Shipped = "Shipped";
        public const string OutForDelivery = "OutForDelivery";
        public const string Delivered = "Delivered";
        public const string Cancelled = "Cancelled";
    }

    public static class PaymentStatuses
    {
        public const string CashOnDelivery = "Cash On Delivery";
        public const string Created = "Created";
        public const string Completed = "Completed";
        public const string PartiallyRefunded = "PartiallyRefunded";
        public const string Cancelled = "Cancelled";
        public const string Failed = "Failed";
    }

    public static class ReturnStatuses
    {
        public const string None = "None";
        public const string Requested = "Requested";
        public const string Rejected = "Rejected";
        public const string RefundCompleted = "RefundCompleted";
    }

    [ApiController]
    [Route("api/order")]
    public class OrderController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;
        private readonly InvoiceService _invoiceService;
        private readonly EmailService _emailService;
        private readonly ICartCalculationService _calc;
        private readonly IFileStorageService _fileStorageService;
        private readonly ICheckoutService _checkoutService;
        private readonly ISmsService _sms;
        private readonly ILogger<OrderController> _logger;
        private readonly IWebHostEnvironment _env;

        public OrderController(
            IConfiguration config,
            ApplicationDbContext context,
            IUserContextService userContext,
            IFileStorageService fileStorageService,
            ICheckoutService checkoutService,
            InvoiceService invoiceService,
            EmailService emailService,
            ICartCalculationService calc,
            ISmsService sms,
            ILogger<OrderController> logger,
            IWebHostEnvironment env)
        {
            _config = config;
            _context = context;
            _userContext = userContext;
            _invoiceService = invoiceService;
            _emailService = emailService;
            _calc = calc;
            _fileStorageService = fileStorageService;
            _checkoutService = checkoutService;
            _sms = sms;
            _logger = logger;
            _env = env;
        }

        // ============================================================
        // SHARED HELPERS
        // ============================================================

        /// <summary>
        /// Standard error response. Logs the full exception server-side with
        /// context, but only echoes internal exception details to the client
        /// in Development. In Production the client gets a safe, generic
        /// message — never raw SQL/exception text.
        /// </summary>
        private IActionResult ErrorResponse(
            Exception ex,
            string logContext,
            int statusCode = StatusCodes.Status400BadRequest,
            string? userId = null)
        {
            _logger.LogError(
                ex,
                "{Context} | UserId={UserId}",
                logContext,
                userId ?? "unknown");

            var message = _env.IsDevelopment()
                ? (ex.InnerException?.Message ?? ex.Message)
                : "Something went wrong while processing your request. Please try again.";

            return StatusCode(statusCode, new
            {
                success = false,
                message
            });
        }

        /// <summary>
        /// Constant-time HMAC-SHA256 signature check. Used for both the
        /// Razorpay webhook and payment verification so we never regress to
        /// a plain string comparison (which leaks timing information).
        /// </summary>
        private static bool VerifyHmacSignature(string payload, string secret, string receivedSignature)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var expected = Convert.ToHexString(
                    hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)))
                .ToLowerInvariant();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(receivedSignature ?? string.Empty));
        }

        private static string GenerateOrderNumber() =>
            $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Random.Shared.Next(1000, 9999)}";

        /// <summary>
        /// Builds OrderItemModel rows for a set of cart lines against a
        /// freshly created order. Single source of truth for pricing math
        /// (discount, GST, coupon-share allocation) — previously duplicated
        /// almost verbatim between PlaceCOD and VerifyPayment, which is how
        /// pricing bugs quietly diverge between COD and prepaid orders.
        /// </summary>
        private List<OrderItemModel> BuildOrderItems(
            int orderId,
            IEnumerable<CartModel> carts,
            decimal couponDiscountTotal)
        {
            var cartList = carts.ToList();

            decimal totalTaxableAmount = cartList.Sum(item =>
            {
                decimal originalPrice = item.ProductVariant?.Price ?? 0;
                decimal discountPercent = item.Product?.DiscountPercentage ?? 0;

                decimal discountAmount = item.Product?.IsHotDeal == true
                    ? originalPrice * discountPercent / 100m
                    : 0;

                decimal finalPrice = originalPrice - discountAmount;
                return finalPrice * item.Quantity;
            });

            return cartList.Select(item =>
            {
                decimal originalPrice = item.ProductVariant?.Price ?? 0;
                decimal discountPercent = item.Product?.DiscountPercentage ?? 0;

                decimal discountAmount = item.Product?.IsHotDeal == true
                    ? originalPrice * discountPercent / 100m
                    : 0;

                decimal finalUnitPrice = originalPrice - discountAmount;
                decimal taxableAmount = finalUnitPrice * item.Quantity;

                decimal gstPercent = item.Product?.GSTPercentage ?? 0;
                decimal gstAmount = taxableAmount * gstPercent / 100m;

                decimal couponShare = 0;

                if (couponDiscountTotal > 0 && totalTaxableAmount > 0)
                {
                    couponShare = (taxableAmount / totalTaxableAmount) * couponDiscountTotal;
                }

                decimal finalPaidAmount = taxableAmount + gstAmount - couponShare;

                return new OrderItemModel
                {
                    OrderId = orderId,
                    SellerId = item.SellerId,
                    ProductId = item.ProductId,
                    ProductVariantId = item.ProductVariantId,
                    ProductName = item.Product?.Name ?? "",
                    Quantity = item.Quantity,

                    Price = Math.Round(originalPrice, 2),
                    DiscountAmount = Math.Round(discountAmount, 2),
                    CouponDiscountAmount = Math.Round(couponShare, 2),
                    TaxableAmount = Math.Round(taxableAmount, 2),
                    GSTPercentage = gstPercent,
                    GSTAmount = Math.Round(gstAmount, 2),
                    NetAmount = Math.Round(finalPaidAmount, 2),
                    FinalPaidAmount = Math.Round(finalPaidAmount, 2),
                    LineTotal = Math.Round(finalPaidAmount, 2),

                    OrderItemStatus = OrderItemStatuses.Placed,

                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ItemOrderModifiedDate = DateTime.UtcNow,

                    // Delivery
                    PackedDate = null,
                    ShippedDate = null,
                    OutForDeliveryDate = null,
                    DeliveredDate = null,

                    // Return
                    IsReturnEligible = false,
                    ReturnEligibleTill = null,
                    ReturnStatus = ReturnStatuses.None,
                    ReturnReason = null,
                    ReturnRemarks = null,
                    ReturnRequestedDate = null,
                    ReturnApprovedDate = null,
                    PickupDate = null,

                    // Refund
                    RefundAmount = null,
                    RefundStatus = "None",
                    RefundCompletedDate = null,

                    // Cancellation
                    CancelledAt = null,
                    CancelledReason = null,
                    CancelledBy = null,

                    // Logistics
                    TrackingNumber = null,
                    CourierPartner = null,
                    ReturnReviewedBy = null
                };
            }).ToList();
        }

        /// <summary>
        /// Derives a single human-facing order status from its line items.
        /// Previously copy-pasted in three different endpoints with slightly
        /// different logic each time — now there is exactly one definition.
        /// </summary>
        private static string DeriveOrderStatus(IEnumerable<string?> itemStatuses)
        {
            var statuses = itemStatuses.ToList();

            if (statuses.Count > 0 && statuses.All(s => s == OrderItemStatuses.Cancelled))
                return "Cancelled";

            if (statuses.Count > 0 && statuses.All(s => s == OrderItemStatuses.Delivered))
                return "Delivered";

            if (statuses.Any(s => s == OrderItemStatuses.OutForDelivery))
                return "Out For Delivery";

            if (statuses.Any(s => s == OrderItemStatuses.Shipped))
                return "Shipped";

            if (statuses.Any(s => s == OrderItemStatuses.Packed))
                return "Packed";

            return "Placed";
        }

        // ============================================================
        // PLACE COD ORDER
        // ============================================================
        [HttpPost("place-cod")]
        public async Task<IActionResult> PlaceCOD(CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    redirect = "/login",
                    message = "Please login first"
                });
            }

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                _logger.LogInformation(
                    "Placing COD order | UserId={UserId} | Authenticated={Authenticated}",
                    userId,
                    User?.Identity?.IsAuthenticated);

                var checkoutSession = await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new { success = false, message = "Checkout session not found." });
                }

                if (!checkoutSession.IsActive)
                {
                    checkoutSession.IsActive = true;
                }

                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId,
                        cancellationToken);

                if (address == null)
                {
                    return BadRequest(new { success = false, message = "Please select a delivery address." });
                }

                var carts = await _checkoutService.GetCurrentCartAsync();

                if (!carts.Any())
                {
                    return BadRequest(new { success = false, message = "Cart is empty." });
                }

                var totals = await _calc.CalculateAsync(userId, null, checkoutSession.CouponCode);

                var order = new OrderModel
                {
                    UserId = userId,
                    UserAddressId = address.Id,
                    UserAddress = address,
                    OrderNumber = GenerateOrderNumber(),
                    GrandTotal = totals.Total,
                    Currency = "INR",
                    PaymentStatus = PaymentStatuses.CashOnDelivery,
                    IsPaymentVerified = false,
                    PaymentVerifiedAt = null,
                    OrderDate = DateTime.UtcNow,
                    OrderModifiedDate = DateTime.UtcNow,
                    CreatedBy = userId,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(cancellationToken); // OrderId generated here

                var orderItems = BuildOrderItems(order.OrderId, carts, totals.CouponDiscount);

                _context.OrderItems.AddRange(orderItems);
                _context.Carts.RemoveRange(carts);
                _context.CheckoutSessions.Remove(checkoutSession);

                await _context.SaveChangesAsync(cancellationToken);

                order.UserAddress = address;
                order.OrderItems = orderItems;

                await _sms.SendOrderPlacedAsync(order);

                await transaction.CommitAsync(cancellationToken);

                // Send invoice email in-line (post-commit) rather than via
                // Task.Run: the previous fire-and-forget task could outlive
                // the request's scoped DbContext / ControllerContext (which
                // Rotativa's PDF renderer depends on), silently dropping
                // invoices in production. A failure here never fails the
                // order — it's just logged.
                try
                {
                    await SendInvoiceEmailAsync(order.OrderId);
                }
                catch (Exception invoiceEx)
                {
                    _logger.LogError(invoiceEx, "Invoice email failed for OrderId={OrderId}", order.OrderId);
                }

                return Ok(new
                {
                    success = true,
                    orderId = order.OrderId,
                    orderNumber = order.OrderNumber,
                    paymentStatus = order.PaymentStatus,
                    items = orderItems.Select(x => new
                    {
                        orderItemId = x.OrderItemId,
                        productId = x.ProductId,
                        itemStatus = x.OrderItemStatus
                    }),
                    message = "Order placed successfully."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ErrorResponse(ex, "Failed to place COD order.", userId: userId);
            }
        }

        // ================= CREATE ORDER (Razorpay) =================
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder(CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, redirect = "/login", message = "Please login first." });
            }

            try
            {
                var checkoutSession = await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new { success = false, message = "Checkout session not found." });
                }

                if (!checkoutSession.IsActive)
                {
                    checkoutSession.IsActive = true;
                    checkoutSession.ModifiedDate = DateTime.UtcNow;
                }

                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId,
                        cancellationToken);

                if (address == null)
                {
                    return BadRequest(new { success = false, message = "Please select a delivery address." });
                }

                var carts = await _checkoutService.GetCurrentCartAsync();

                if (!carts.Any())
                {
                    return BadRequest(new { success = false, message = "Your cart is empty." });
                }

                var totals = await _calc.CalculateAsync(userId, null, checkoutSession.CouponCode);

                if (checkoutSession.GrandTotal != totals.Total ||
                    checkoutSession.SubTotal != totals.Subtotal ||
                    checkoutSession.GSTAmount != totals.GST ||
                    checkoutSession.CouponDiscount != totals.CouponDiscount ||
                    checkoutSession.ShippingCharge != totals.Delivery)
                {
                    checkoutSession.SubTotal = totals.Subtotal;
                    checkoutSession.GSTAmount = totals.GST;
                    checkoutSession.CouponDiscount = totals.CouponDiscount;
                    checkoutSession.ShippingCharge = totals.Delivery;
                    checkoutSession.GrandTotal = totals.Total;

                    await _context.SaveChangesAsync(cancellationToken);
                }

                var amountInPaise = Convert.ToInt32(Math.Round(totals.Total * 100));

                var razorpayKey = _config["Razorpay:Key"];
                var razorpaySecret = _config["Razorpay:Secret"];

                var client = new RazorpayClient(razorpayKey, razorpaySecret);

                var receipt = $"PAY-{Guid.NewGuid():N}".Substring(0, 20).ToUpper();

                var razorpayOrder = client.Order.Create(new Dictionary<string, object>
                {
                    { "amount", amountInPaise },
                    { "currency", "INR" },
                    { "receipt", receipt }
                });

                var razorpayOrderId = razorpayOrder["id"].ToString();

                // Close any previous pending payment session for this user
                // so stale sessions can't be verified later against a new cart.
                var oldSessions = await _context.PaymentSessions
                    .Where(x => x.UserId == userId && !x.IsCompleted)
                    .ToListAsync(cancellationToken);

                foreach (var old in oldSessions)
                {
                    old.IsCompleted = true;
                    old.PaymentStatus = PaymentStatuses.Cancelled;
                    old.FailureReason = "Superseded by new payment session.";
                }

                var session = new PaymentSession
                {
                    CheckoutSessionId = checkoutSession.Id,
                    UserId = userId,
                    RazorpayOrderId = razorpayOrderId,
                    Amount = totals.Total,
                    Currency = checkoutSession.Currency,
                    CouponCode = checkoutSession.CouponCode,
                    CouponDiscount = totals.CouponDiscount,
                    PaymentStatus = PaymentStatuses.Created,
                    CreatedDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(30),
                    IsCompleted = false,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.PaymentSessions.Add(session);
                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    paymentSessionId = session.Id,
                    razorpayOrderId,
                    amount = amountInPaise,
                    currency = checkoutSession.Currency,
                    razorpayKey = _config["Razorpay:Key"],
                    expiresAt = session.ExpiryDate
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to create Razorpay order.", userId: userId);
            }
        }

        // ================= VERIFY PAYMENT =================
        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment([FromBody] PaymentDto model, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, redirect = "/login", message = "Please login first." });
            }

            if (model == null ||
                string.IsNullOrWhiteSpace(model.razorpay_order_id) ||
                string.IsNullOrWhiteSpace(model.razorpay_payment_id) ||
                string.IsNullOrWhiteSpace(model.razorpay_signature))
            {
                return BadRequest(new { success = false, message = "Invalid payment details." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var session = await _context.PaymentSessions
                    .FirstOrDefaultAsync(x => x.RazorpayOrderId == model.razorpay_order_id, cancellationToken);

                if (session == null)
                {
                    return BadRequest(new { success = false, message = "Payment session not found." });
                }

                // Ownership check: the caller must be the user the session
                // belongs to. Without this, anyone who intercepts/guesses a
                // razorpay_order_id could trigger order creation on someone
                // else's checkout session.
                if (!string.Equals(session.UserId, userId, StringComparison.Ordinal))
                {
                    _logger.LogWarning(
                        "VerifyPayment ownership mismatch. SessionUserId={SessionUserId} CallerUserId={CallerUserId}",
                        session.UserId, userId);

                    return Forbid();
                }

                if (session.IsCompleted)
                {
                    return Ok(new { success = true, redirect = "order-success/:id" });
                }

                if (session.ExpiryDate < DateTime.UtcNow)
                {
                    return BadRequest(new { success = false, message = "Payment session expired." });
                }

                // Constant-time signature check (previously a plain string
                // "!=" comparison here, which is timing-attack prone).
                var payload = $"{model.razorpay_order_id}|{model.razorpay_payment_id}";
                var secret = _config["Razorpay:Secret"] ?? string.Empty;

                if (!VerifyHmacSignature(payload, secret, model.razorpay_signature))
                {
                    _logger.LogWarning(
                        "Razorpay signature mismatch for OrderId={RazorpayOrderId}",
                        model.razorpay_order_id);

                    return BadRequest(new { success = false, message = "Payment verification failed." });
                }

                var checkoutSession = await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new { success = false, message = "Checkout session not found." });
                }

                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId,
                        cancellationToken);

                if (address == null)
                {
                    return BadRequest(new { success = false, message = "Delivery address not found." });
                }

                var carts = await _checkoutService.GetCurrentCartAsync();

                if (!carts.Any())
                {
                    return BadRequest(new { success = false, message = "Cart is empty." });
                }

                var totals = await _calc.CalculateAsync(userId, null, checkoutSession.CouponCode);

                var order = new OrderModel
                {
                    UserId = userId,
                    UserAddressId = address.Id,
                    UserAddress = address,
                    OrderNumber = GenerateOrderNumber(),
                    GrandTotal = totals.Total,
                    Currency = checkoutSession.Currency,
                    PaymentStatus = PaymentStatuses.Completed,
                    RazorpayOrderId = model.razorpay_order_id,
                    RazorpayPaymentId = model.razorpay_payment_id,
                    RazorpaySignature = model.razorpay_signature,
                    IsPaymentVerified = true,
                    PaymentVerifiedAt = DateTime.UtcNow,
                    OrderDate = DateTime.UtcNow,
                    OrderModifiedDate = DateTime.UtcNow,
                    CreatedBy = userId,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(cancellationToken);

                var orderItems = BuildOrderItems(order.OrderId, carts, totals.CouponDiscount);

                _context.OrderItems.AddRange(orderItems);
                _context.Carts.RemoveRange(carts);

                session.IsCompleted = true;
                session.PaymentStatus = PaymentStatuses.Completed;
                session.PaymentCompletedDate = DateTime.UtcNow;
                session.RazorpayPaymentId = model.razorpay_payment_id;

                checkoutSession.IsActive = false;
                checkoutSession.SelectedAddressId = null;
                checkoutSession.CouponCode = null;
                checkoutSession.SubTotal = 0;
                checkoutSession.GSTAmount = 0;
                checkoutSession.CouponDiscount = 0;
                checkoutSession.GrandTotal = 0;
                checkoutSession.ShippingCharge = 0;

                await _context.SaveChangesAsync(cancellationToken);

                order.UserAddress = address;
                order.OrderItems = orderItems;

                await _sms.SendOrderPlacedAsync(order);

                await transaction.CommitAsync(cancellationToken);

                try
                {
                    await SendInvoiceEmailAsync(order.OrderId);
                }
                catch (Exception invoiceEx)
                {
                    _logger.LogError(invoiceEx, "Invoice email failed for OrderId={OrderId}", order.OrderId);
                }

                return Ok(new
                {
                    success = true,
                    orderId = order.OrderId,
                    redirect = "order-success/:id"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ErrorResponse(ex, "Payment verification failed unexpectedly.", userId: userId);
            }
        }

        // ================= PAYMENT FAILED =================
        [HttpPost("payment-failed")]
        public async Task<IActionResult> PaymentFailed([FromBody] PaymentDto dto, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, redirect = "/login", message = "Please login first." });
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.razorpay_order_id))
            {
                return BadRequest(new { success = false, message = "Invalid request." });
            }

            // Ownership filter added: previously any caller could flip any
            // session's completion flag just by knowing/guessing an order id.
            var session = await _context.PaymentSessions
                .FirstOrDefaultAsync(x =>
                    x.RazorpayOrderId == dto.razorpay_order_id &&
                    x.UserId == userId,
                    cancellationToken);

            if (session != null)
            {
                session.IsCompleted = false;
                session.PaymentStatus = PaymentStatuses.Failed;

                await _context.SaveChangesAsync(cancellationToken);
            }

            return Ok(new { success = true });
        }

        // ================= WEBHOOK =================
        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> RazorpayWebhook(CancellationToken cancellationToken)
        {
            try
            {
                var webhookSecret = _config["Razorpay:WebhookSecret"];

                if (string.IsNullOrWhiteSpace(webhookSecret))
                {
                    _logger.LogError("Razorpay webhook secret is not configured.");
                    return Unauthorized();
                }

                string body;
                using (var reader = new StreamReader(Request.Body))
                {
                    body = await reader.ReadToEndAsync();
                }

                var receivedSignature = Request.Headers["X-Razorpay-Signature"].ToString();

                if (!VerifyHmacSignature(body, webhookSecret, receivedSignature))
                {
                    _logger.LogWarning("Razorpay webhook signature verification failed.");
                    return Unauthorized();
                }

                dynamic data = JsonConvert.DeserializeObject(body)!;

                string eventType = data.@event;
                string razorpayOrderId = data?.payload?.payment?.entity?.order_id;
                string razorpayPaymentId = data?.payload?.payment?.entity?.id;

                var session = await _context.PaymentSessions
                    .FirstOrDefaultAsync(x => x.RazorpayOrderId == razorpayOrderId, cancellationToken);

                if (session == null)
                {
                    _logger.LogWarning(
                        "Razorpay webhook received for unknown session. RazorpayOrderId={RazorpayOrderId} Event={Event}",
                        razorpayOrderId, eventType);
                    return Ok();
                }

                switch (eventType)
                {
                    case "payment.captured":
                        session.IsCompleted = true;

                        // IMPORTANT PRODUCTION GAP (flagged, not silently
                        // patched): this webhook does not create the Order
                        // itself — order creation currently only happens in
                        // VerifyPayment, driven by the frontend after
                        // redirect. If a user closes the browser right after
                        // paying (before the frontend calls verify-payment),
                        // Razorpay will report the payment as captured but
                        // no Order row will ever exist. Fixing this properly
                        // requires ICheckoutService to expose a
                        // GetCartByUserIdAsync(userId) that doesn't depend on
                        // the current HTTP/cookie context, so this webhook
                        // (which has no logged-in user/cookies) can finalize
                        // the order itself. Until that's done, we at least
                        // surface it loudly so ops can reconcile manually.
                        var orderExists = await _context.Orders
                            .AsNoTracking()
                            .AnyAsync(o => o.RazorpayOrderId == razorpayOrderId, cancellationToken);

                        if (!orderExists)
                        {
                            _logger.LogCritical(
                                "Payment captured but no Order exists yet. RazorpayOrderId={RazorpayOrderId} RazorpayPaymentId={RazorpayPaymentId} UserId={UserId}. Needs manual reconciliation if verify-payment never runs.",
                                razorpayOrderId, razorpayPaymentId, session.UserId);
                        }

                        break;

                    case "payment.failed":
                        session.IsCompleted = false;
                        session.PaymentStatus = PaymentStatuses.Failed;
                        break;

                    default:
                        return Ok();
                }

                await _context.SaveChangesAsync(cancellationToken);

                return Ok();
            }
            catch (Exception ex)
            {
                // Still return 200 so Razorpay doesn't hammer us with
                // retries, but the previous version swallowed this
                // completely — now it's at least logged for visibility.
                _logger.LogError(ex, "Unhandled error while processing Razorpay webhook.");
                return Ok();
            }
        }

        [HttpPut("cancel-item/{orderItemId}")]
        public async Task<IActionResult> CancelOrderItem(
            int orderItemId,
            [FromBody] CancelOrderRequest request,
            CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, message = "Please login first." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var orderItem = await _context.OrderItems
                    .Include(x => x.Order)
                    .FirstOrDefaultAsync(x =>
                        x.OrderItemId == orderItemId &&
                        x.Order.UserId == userId,
                        cancellationToken);

                if (orderItem == null)
                {
                    return NotFound(new { success = false, message = "Order item not found." });
                }

                if (orderItem.OrderItemStatus == OrderItemStatuses.Cancelled)
                {
                    return BadRequest(new { success = false, message = "Item is already cancelled." });
                }

                // Customer can cancel before shipment only.
                var currentStatus = (orderItem.OrderItemStatus ?? string.Empty).Trim();

                var cancellableStatuses = new[]
                {
                    OrderItemStatuses.Pending,
                    OrderItemStatuses.Placed,
                    OrderItemStatuses.Accepted,
                    OrderItemStatuses.Packed
                };

                var canCancel = cancellableStatuses.Any(s =>
                    s.Equals(currentStatus, StringComparison.OrdinalIgnoreCase));

                if (!canCancel)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "This order item cannot be cancelled at its current stage."
                    });
                }

                orderItem.OrderItemStatus = OrderItemStatuses.Cancelled;
                orderItem.CancelledAt = DateTime.UtcNow;
                orderItem.CancelledBy = userId;
                orderItem.CancelledReason = request?.ReasonType ?? "Other";
                orderItem.ReturnRemarks = request?.Remarks;
                orderItem.UpdatedAt = DateTime.UtcNow;
                orderItem.ItemOrderModifiedDate = DateTime.UtcNow;

                if (orderItem.Order.PaymentStatus == PaymentStatuses.Completed)
                {
                    orderItem.RefundStatus = "Initiated";
                    orderItem.RefundAmount = orderItem.FinalPaidAmount;
                }

                var remainingItems = await _context.OrderItems
                    .Where(x =>
                        x.OrderId == orderItem.OrderId &&
                        x.OrderItemStatus != OrderItemStatuses.Cancelled)
                    .CountAsync(cancellationToken);

                if (remainingItems == 0)
                {
                    orderItem.Order.PaymentStatus = orderItem.Order.PaymentStatus == PaymentStatuses.Completed
                        ? PaymentStatuses.PartiallyRefunded
                        : PaymentStatuses.Cancelled;

                    orderItem.Order.OrderModifiedDate = DateTime.UtcNow;
                    orderItem.Order.UpdatedBy = userId;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    message = orderItem.Order.PaymentStatus == PaymentStatuses.Completed ||
                               orderItem.Order.PaymentStatus == PaymentStatuses.PartiallyRefunded
                        ? "Item cancelled successfully. Refund has been initiated."
                        : "Item cancelled successfully."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ErrorResponse(ex, "Failed to cancel order item.", userId: userId);
            }
        }

        public class CancelOrderRequest
        {
            public string ReasonType { get; set; } = "";
            public string? Remarks { get; set; }
        }

        [HttpGet("check-payment-status/{razorpayOrderId}")]
        public async Task<IActionResult> CheckPaymentStatus(string razorpayOrderId, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, redirect = "/login", message = "Please login first." });
            }

            try
            {
                // Ownership filter added — previously any authenticated (or
                // even anonymous) caller could poll any other user's
                // payment/order status just by knowing a Razorpay order id.
                var session = await _context.PaymentSessions
                    .FirstOrDefaultAsync(x =>
                        x.RazorpayOrderId == razorpayOrderId &&
                        x.UserId == userId,
                        cancellationToken);

                if (session == null)
                {
                    return Ok(new { success = false, message = "Payment session not found." });
                }

                if (!session.IsCompleted)
                {
                    return Ok(new
                    {
                        success = false,
                        paymentStatus = session.PaymentStatus,
                        message = "Payment is still processing."
                    });
                }

                var order = await _context.Orders
                    .Include(x => x.OrderItems)
                    .FirstOrDefaultAsync(x =>
                        x.RazorpayOrderId == razorpayOrderId &&
                        x.UserId == userId,
                        cancellationToken);

                if (order == null)
                {
                    return Ok(new
                    {
                        success = false,
                        paymentStatus = session.PaymentStatus,
                        message = "Order is being created."
                    });
                }

                var itemSummary = order.OrderItems
                    .GroupBy(x => x.OrderItemStatus)
                    .Select(x => new { status = x.Key, count = x.Count() })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    orderId = order.OrderId,
                    orderNumber = order.OrderNumber,
                    paymentStatus = order.PaymentStatus,
                    isPaymentVerified = order.IsPaymentVerified,
                    totalItems = order.OrderItems.Count,
                    itemStatuses = itemSummary,
                    redirect = $"/order-success/{order.OrderId}"
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to check payment status.", userId: userId);
            }
        }

        [Authorize]
        [HttpGet("success-order/{id}")]
        public async Task<IActionResult> SuccessOrder(int id, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, message = "Please login first." });
            }

            try
            {
                var order = await _context.Orders
                    .AsNoTracking()
                    .Include(x => x.UserAddress)
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product)
                    .Include(x => x.OrderItems).ThenInclude(x => x.ProductVariant).ThenInclude(x => x.Images)
                    .FirstOrDefaultAsync(x => x.OrderId == id && x.UserId == userId, cancellationToken);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found." });
                }

                var orderStatus = DeriveOrderStatus(order.OrderItems.Select(x => x.OrderItemStatus));

                return Ok(new
                {
                    success = true,
                    order = new
                    {
                        orderId = order.OrderId,
                        orderNumber = order.OrderNumber,
                        orderDate = order.OrderDate,
                        paymentStatus = order.PaymentStatus,
                        paymentMethod = order.PaymentMethod,
                        orderStatus = orderStatus,
                        grandTotal = order.GrandTotal,
                        currency = order.Currency,
                        estimatedDelivery = order.OrderDate.AddDays(4),

                        customer = new
                        {
                            name = order.UserAddress?.FullName,
                            mobile = order.UserAddress?.MobileNumber,
                            address = $"{order.UserAddress?.AddressLine1}, {order.UserAddress?.AddressLine2}",
                            city = order.UserAddress?.City,
                            state = order.UserAddress?.State,
                            pincode = order.UserAddress?.Pincode
                        },

                        items = order.OrderItems.Select(i => new
                        {
                            orderItemId = i.OrderItemId,
                            sellerId = i.SellerId,
                            productId = i.ProductId,
                            productName = i.ProductName,
                            variantName = i.ProductVariant?.Model ?? "",

                            image = i.ProductVariant != null && i.ProductVariant.Images.Any()
                                ? i.ProductVariant.Images
                                    .OrderBy(x => x.DisplayOrder)
                                    .Select(x => x.ImageUrl)
                                    .FirstOrDefault()
                                : i.Product.ImageUrl,

                            quantity = i.Quantity,
                            price = i.Price,
                            discount = i.DiscountAmount,
                            taxableAmount = i.TaxableAmount,
                            gstPercentage = i.GSTPercentage,
                            gst = i.GSTAmount,
                            couponDiscount = i.CouponDiscountAmount,
                            finalPaidAmount = i.FinalPaidAmount,
                            total = i.LineTotal,
                            itemStatus = i.OrderItemStatus,
                            packedDate = i.PackedDate,
                            shippedDate = i.ShippedDate,
                            outForDeliveryDate = i.OutForDeliveryDate,
                            deliveredDate = i.DeliveredDate,
                            trackingNumber = i.TrackingNumber,
                            courierPartner = i.CourierPartner,
                            returnStatus = i.ReturnStatus,
                            isReturnEligible = i.IsReturnEligible,
                            returnEligibleTill = i.ReturnEligibleTill,
                            cancelledAt = i.CancelledAt
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load order success page.", StatusCodes.Status500InternalServerError, userId);
            }
        }

        [Authorize]
        [HttpPost("request-return/{orderItemId}")]
        public async Task<IActionResult> RequestReturn(
            int orderItemId,
            [FromForm] RequestReturnDto dto,
            CancellationToken cancellationToken)
        {
            dto.OrderItemId = orderItemId;

            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, message = "Please login first." });
            }

            if (dto.OrderItemId <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid order item." });
            }

            try
            {
                var orderItem = await _context.OrderItems
                    .Include(x => x.Order)
                    .FirstOrDefaultAsync(x =>
                        x.OrderItemId == dto.OrderItemId &&
                        x.Order.UserId == userId,
                        cancellationToken);

                if (orderItem == null)
                {
                    return NotFound(new { success = false, message = "Order item not found." });
                }

                if (orderItem.OrderItemStatus != OrderItemStatuses.Delivered)
                {
                    return BadRequest(new { success = false, message = "Only delivered items can be returned." });
                }

                if (!orderItem.IsReturnEligible)
                {
                    return BadRequest(new { success = false, message = "This item is not eligible for return." });
                }

                if (!orderItem.ReturnEligibleTill.HasValue)
                {
                    return BadRequest(new { success = false, message = "Return window information is unavailable." });
                }

                if (DateTime.UtcNow > orderItem.ReturnEligibleTill.Value)
                {
                    return BadRequest(new { success = false, message = "Return period has expired." });
                }

                if (!string.IsNullOrWhiteSpace(orderItem.ReturnStatus) &&
                    orderItem.ReturnStatus != ReturnStatuses.None)
                {
                    return BadRequest(new { success = false, message = "A return request has already been submitted for this item." });
                }

                bool alreadyExists = await _context.OrderReturns
                    .AnyAsync(x =>
                        x.OrderItemId == dto.OrderItemId &&
                        x.Status != ReturnStatuses.Rejected,
                        cancellationToken);

                if (alreadyExists)
                {
                    return BadRequest(new { success = false, message = "A return request already exists for this item." });
                }

                string? image1 = dto.Image1 != null ? await _fileStorageService.UploadAsync(dto.Image1, "ReturnImages") : null;
                string? image2 = dto.Image2 != null ? await _fileStorageService.UploadAsync(dto.Image2, "ReturnImages") : null;
                string? image3 = dto.Image3 != null ? await _fileStorageService.UploadAsync(dto.Image3, "ReturnImages") : null;

                var returnRequest = new OrderReturnModel
                {
                    OrderId = orderItem.OrderId,
                    OrderItemId = orderItem.OrderItemId,
                    UserId = userId,
                    Reason = dto.Reason,
                    Remarks = dto.Remarks,
                    Image1 = image1,
                    Image2 = image2,
                    Image3 = image3,
                    Status = ReturnStatuses.Requested,
                    RequestedDate = DateTime.UtcNow
                };

                _context.OrderReturns.Add(returnRequest);

                orderItem.ReturnStatus = ReturnStatuses.Requested;
                orderItem.ReturnReason = dto.Reason;
                orderItem.ReturnRemarks = dto.Remarks;
                orderItem.ReturnRequestedDate = DateTime.UtcNow;
                orderItem.UpdatedAt = DateTime.UtcNow;
                orderItem.ItemOrderModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    message = "Return request submitted successfully.",
                    returnId = returnRequest.ReturnId,
                    status = returnRequest.Status,
                    requestedDate = returnRequest.RequestedDate
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to submit return request.", StatusCodes.Status500InternalServerError, userId);
            }
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpGet("returns")]
        public async Task<IActionResult> GetReturns(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            string? status = null,
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var isAdmin = User.IsInRole("Admin");

            var query = _context.OrderReturns
                .Include(r => r.Order).ThenInclude(o => o.UserAddress)
                .Include(r => r.OrderItem).ThenInclude(i => i.Product)
                .Include(r => r.OrderItem).ThenInclude(i => i.ProductVariant)
                .AsQueryable();

            if (!isAdmin)
            {
                var userId = _userContext.GetUserId();

                var sellerId = await _context.Sellers
                    .Where(s => s.UserId == userId)
                    .Select(s => s.SellerId)
                    .FirstOrDefaultAsync(cancellationToken);

                query = query.Where(r => r.OrderItem.SellerId == sellerId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();

                query = query.Where(r =>
                    r.Order.OrderNumber.ToLower().Contains(term) ||
                    r.Order.UserAddress.FullName.ToLower().Contains(term) ||
                    r.Order.UserAddress.MobileNumber.Contains(term) ||
                    r.OrderItem.ProductName.ToLower().Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(r => r.Status == status);
            }

            var totalRecords = await query.CountAsync(cancellationToken);

            var data = await query
                .OrderByDescending(r => r.RequestedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.ReturnId,
                    r.OrderId,
                    r.OrderItemId,
                    OrderNumber = r.Order.OrderNumber,
                    CustomerName = r.Order.UserAddress.FullName,
                    MobileNumber = r.Order.UserAddress.MobileNumber,
                    ProductName = r.OrderItem.ProductName,
                    ProductImage = r.OrderItem.Product.ImageUrl,
                    VariantName = r.OrderItem.ProductVariant != null ? r.OrderItem.ProductVariant.Model : "",
                    Quantity = r.OrderItem.Quantity,
                    r.Reason,
                    r.Remarks,
                    r.Image1,
                    r.Image2,
                    r.Image3,
                    r.Status,
                    r.RequestedDate,
                    RefundStatus = r.OrderItem.RefundStatus,
                    RefundAmount = r.OrderItem.RefundAmount
                })
                .ToListAsync(cancellationToken);

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalRecords,
                totalPages = (int)Math.Ceiling((double)totalRecords / pageSize),
                data
            });
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("returns/{returnId}")]
        public async Task<IActionResult> UpdateReturnStatus(
            int returnId,
            UpdateReturnStatusDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var userId = _userContext.GetUserId();
                bool isAdmin = User.IsInRole("Admin");

                int? sellerId = null;

                if (!isAdmin)
                {
                    sellerId = await _context.Sellers
                        .Where(x => x.UserId == userId)
                        .Select(x => (int?)x.SellerId)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                var query = _context.OrderReturns
                    .Include(x => x.OrderItem).ThenInclude(x => x.Product)
                    .AsQueryable();

                if (!isAdmin)
                {
                    query = query.Where(x => x.OrderItem.Product.SellerId == sellerId);
                }

                var item = await query.FirstOrDefaultAsync(x => x.ReturnId == returnId, cancellationToken);

                if (item == null)
                {
                    return NotFound(new { success = false, message = "Return request not found." });
                }

                item.Status = dto.Status;
                item.Remarks = dto.Remarks;
                item.OrderItem.ReturnStatus = dto.Status;

                if (dto.Status == ReturnStatuses.RefundCompleted)
                {
                    item.OrderItem.RefundStatus = "Completed";
                    item.OrderItem.RefundCompletedDate = DateTime.UtcNow;

                    if (dto.RefundAmount.HasValue)
                    {
                        item.OrderItem.RefundAmount = dto.RefundAmount.Value;
                    }
                }

                item.OrderItem.UpdatedAt = DateTime.UtcNow;
                item.OrderItem.ItemOrderModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new { success = true, message = "Return status updated successfully." });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to update return status.", StatusCodes.Status500InternalServerError);
            }
        }

        [Authorize]
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders(
            int page = 1,
            int pageSize = 3,
            CancellationToken cancellationToken = default)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Please login to view your orders.",
                    redirect = "/login"
                });
            }

            try
            {
                page = Math.Max(1, page);
                pageSize = Math.Clamp(pageSize, 1, 10);

                var query = _context.Orders
                    .AsNoTracking()
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate);

                // Load one extra record to cheaply know whether another
                // page exists, without a separate COUNT query.
                var orders = await query
                    .Include(o => o.UserAddress)
                    .Include(o => o.OrderItems).ThenInclude(i => i.Product)
                    .Include(o => o.OrderItems).ThenInclude(i => i.ProductVariant).ThenInclude(v => v.Images)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize + 1)
                    .ToListAsync(cancellationToken);

                var hasNextPage = orders.Count > pageSize;

                if (hasNextPage)
                {
                    orders = orders.Take(pageSize).ToList();
                }

                var response = orders.Select(order =>
                {
                    var orderStatus = DeriveOrderStatus(order.OrderItems.Select(x => x.OrderItemStatus));

                    return new
                    {
                        orderId = order.OrderId,
                        orderNumber = order.OrderNumber,
                        orderDate = order.OrderDate,
                        grandTotal = order.GrandTotal,
                        paymentStatus = order.PaymentStatus,

                        deliveryAddress = order.UserAddress == null ? null : new
                        {
                            id = order.UserAddress.Id,
                            fullName = order.UserAddress.FullName,
                            mobileNumber = order.UserAddress.MobileNumber,
                            addressLine1 = order.UserAddress.AddressLine1,
                            addressLine2 = order.UserAddress.AddressLine2,
                            landmark = order.UserAddress.Landmark,
                            city = order.UserAddress.City,
                            state = order.UserAddress.State,
                            pincode = order.UserAddress.Pincode,
                            addressType = order.UserAddress.AddressType
                        },

                        orderStatus,
                        itemCount = order.OrderItems.Count,

                        items = order.OrderItems.Select(item => new
                        {
                            orderItemId = item.OrderItemId,
                            orderDate = order.OrderDate,
                            sellerId = item.SellerId,
                            productId = item.ProductId,
                            variantId = item.ProductVariantId,
                            productName = item.ProductName,
                            variantName = item.ProductVariant?.Model ?? "",

                            productImage = item.ProductVariant != null && item.ProductVariant.Images.Any()
                                ? item.ProductVariant.Images
                                    .OrderBy(x => x.DisplayOrder)
                                    .Select(x => x.ImageUrl)
                                    .FirstOrDefault()
                                : !string.IsNullOrWhiteSpace(item.Product?.ImageUrl)
                                    ? item.Product.ImageUrl
                                    : "/images/no-image.png",

                            productImages = item.ProductVariant != null
                                ? item.ProductVariant.Images.OrderBy(x => x.DisplayOrder).Select(x => x.ImageUrl).ToList()
                                : new List<string>(),

                            quantity = item.Quantity,
                            price = item.Price,
                            discountAmount = item.DiscountAmount,
                            couponDiscountAmount = item.CouponDiscountAmount,
                            gstPercentage = item.GSTPercentage,
                            taxableAmount = item.TaxableAmount,
                            gstAmount = item.GSTAmount,
                            netAmount = item.NetAmount,
                            finalPaidAmount = item.FinalPaidAmount,
                            itemTotal = item.LineTotal,

                            itemStatus = item.OrderItemStatus,
                            isReturnEligible = item.IsReturnEligible,
                            returnStatus = item.ReturnStatus,

                            remainingReturnDays = item.ReturnEligibleTill.HasValue
                                ? Math.Max(0, (item.ReturnEligibleTill.Value - DateTime.UtcNow).Days)
                                : 0,

                            packedDate = item.PackedDate,
                            shippedDate = item.ShippedDate,
                            outForDeliveryDate = item.OutForDeliveryDate,
                            deliveredDate = item.DeliveredDate,
                            cancelledAt = item.CancelledAt,
                            cancelledReason = item.CancelledReason,
                            trackingNumber = item.TrackingNumber,
                            courierPartner = item.CourierPartner,
                            refundAmount = item.RefundAmount,
                            refundStatus = item.RefundStatus,
                            returnReason = item.ReturnReason,
                            returnRemarks = item.ReturnRemarks,
                            returnRequestedDate = item.ReturnRequestedDate,
                            returnApprovedDate = item.ReturnApprovedDate,
                            pickupDate = item.PickupDate,
                            refundCompletedDate = item.RefundCompletedDate,
                            returnImages = item.ReturnImages
                        }).ToList()
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    orders = response,
                    pagination = new
                    {
                        page,
                        pageSize,
                        hasNextPage,
                        returnedCount = response.Count
                    }
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load orders for user.", StatusCodes.Status500InternalServerError, userId);
            }
        }

        [Authorize]
        [HttpGet("invoice/{id}")]
        public async Task<IActionResult> Invoice(int id, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { success = false, message = "Please login first." });
            }

            try
            {
                var order = await _context.Orders
                    .AsNoTracking()
                    .Include(o => o.UserAddress)
                    .Include(o => o.OrderItems).ThenInclude(i => i.Product)
                    .Include(o => o.OrderItems).ThenInclude(i => i.ProductVariant)
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId, cancellationToken);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found." });
                }

                if (!string.Equals(order.PaymentStatus, PaymentStatuses.Completed, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { success = false, message = "Payment is not completed yet." });
                }

                if (order.OrderItems == null || !order.OrderItems.Any())
                {
                    return BadRequest(new { success = false, message = "Order items not found." });
                }

                var model = BuildInvoiceModel(order);
                var pdfBytes = await GenerateInvoicePdf(model);

                if (pdfBytes == null || pdfBytes.Length == 0)
                {
                    return StatusCode(500, new { success = false, message = "Invoice PDF generation failed." });
                }

                return File(pdfBytes, "application/pdf", $"Invoice-{order.OrderNumber}.pdf");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Invoice generation failed.", StatusCodes.Status500InternalServerError, userId);
            }
        }

        private async Task<byte[]> GenerateInvoicePdf(OrderInvoiceViewModel model)
        {
            model.IsPdf = true;

            var pdf = new ViewAsPdf("Invoice", model)
            {
                FileName = $"Invoice-{model.InvoiceNumber}.pdf",
                PageSize = Rotativa.AspNetCore.Options.Size.A4,
                PageOrientation = Rotativa.AspNetCore.Options.Orientation.Portrait,
                PageMargins = new Rotativa.AspNetCore.Options.Margins(8, 8, 8, 8),
                CustomSwitches = "--enable-local-file-access --print-media-type --disable-smart-shrinking"
            };

            return await pdf.BuildFile(ControllerContext);
        }

        public async Task SendInvoiceEmailAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems).ThenInclude(i => i.ProductVariant)
                .Include(o => o.OrderItems).ThenInclude(i => i.Product)
                .Include(o => o.User)
                .Include(o => o.UserAddress)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
            {
                _logger.LogWarning("SendInvoiceEmailAsync: OrderId={OrderId} not found.", orderId);
                return;
            }

            var email = order.User?.Email;

            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogWarning("SendInvoiceEmailAsync: OrderId={OrderId} has no customer email on file.", orderId);
                return;
            }

            var model = BuildInvoiceModel(order);
            var pdfBytes = await GenerateInvoicePdf(model);

            await _emailService.SendEmailWithAttachmentAsync(
                email,
                "Your Invoice",
                $"Thanks for your order #{order.OrderNumber}. Please find your invoice attached.",
                pdfBytes,
                $"Invoice-{order.OrderNumber}.pdf");
        }

        private OrderInvoiceViewModel BuildInvoiceModel(OrderModel order)
        {
            var address = order.UserAddress;

            decimal subtotal = order.OrderItems.Sum(x => x.Price * x.Quantity);
            decimal productDiscount = order.OrderItems.Sum(x => x.DiscountAmount * x.Quantity);
            decimal taxableAmount = order.OrderItems.Sum(x => x.TaxableAmount);
            decimal couponDiscount = order.OrderItems.Sum(x => x.CouponDiscountAmount);
            decimal gstTotal = order.OrderItems.Sum(x => x.GSTAmount);
            decimal finalPaid = order.OrderItems.Sum(x => x.FinalPaidAmount);

            var orderStatus = DeriveOrderStatus(order.OrderItems.Select(x => x.OrderItemStatus));

            return new OrderInvoiceViewModel
            {
                OrderId = order.OrderId,
                InvoiceNumber = $"INV-{order.OrderNumber}",
                Date = order.OrderDate,

                CompanyName = _config["Company:Name"] ?? "Sunil Medical Products Pvt Ltd",
                CompanyGST = _config["Company:GST"] ?? "37ABCDE1234F1Z5",
                CompanyAddress = _config["Company:Address"] ?? "Visakhapatnam, Andhra Pradesh, India",
                CompanyPhone = _config["Company:Phone"] ?? "9014060858",

                CustomerName = address?.FullName ?? "",
                Address = $"{address?.AddressLine1}, {address?.AddressLine2}",
                City = address?.City ?? "",
                Pincode = address?.Pincode ?? "",
                Phone = address?.MobileNumber ?? "",

                PaymentId = order.RazorpayPaymentId ?? "",
                PaymentStatus = order.PaymentStatus,
                OrderStatus = orderStatus,
                Currency = order.Currency,

                SubTotal = subtotal,
                DiscountTotal = productDiscount,
                TaxableAmount = taxableAmount,
                CouponDiscount = couponDiscount,
                GSTTotal = gstTotal,
                FinalPaidAmount = finalPaid,
                GrandTotal = order.GrandTotal,

                Items = order.OrderItems.Select(item => new InvoiceItemViewModel
                {
                    ProductName = item.ProductName,
                    VariantName = item.ProductVariant?.Model ?? "",
                    Quantity = item.Quantity,
                    Price = item.Price,
                    DiscountAmount = item.DiscountAmount,
                    TaxableAmount = item.TaxableAmount,
                    GSTPercentage = item.GSTPercentage,
                    GSTAmount = item.GSTAmount,
                    CouponDiscountAmount = item.CouponDiscountAmount,
                    FinalPaidAmount = item.FinalPaidAmount,
                    Total = item.LineTotal,
                    ItemStatus = item.OrderItemStatus,
                    SellerId = item.SellerId,
                    ReturnStatus = item.ReturnStatus
                }).ToList()
            };
        }

        public static string GetDisplayName(ApplicationUser user)
        {
            if (user == null) return "Unknown";
            return !string.IsNullOrEmpty(user.CustomerName) ? user.CustomerName : user.UserName;
        }

        // =========================
        // ORDER DETAILS (MODAL)
        // =========================
        [Authorize]
        [HttpGet("details/{id}")]
        public async Task<IActionResult> GetOrderDetails(int id, CancellationToken cancellationToken)
        {
            try
            {
                var isAdmin = User.IsInRole("Admin");
                int sellerId = 0;

                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    if (seller == null)
                    {
                        return Unauthorized(new { success = false, message = "Seller not found." });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = "Your subscription has expired."
                        });
                    }

                    sellerId = seller.SellerId;

                    var hasAccess = await _context.OrderItems
                        .AnyAsync(x => x.OrderId == id && x.SellerId == sellerId, cancellationToken);

                    if (!hasAccess)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = "You are not authorized to view this order."
                        });
                    }
                }

                var order = await _context.Orders
                    .AsNoTracking()
                    .Include(x => x.UserAddress)
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product)
                    .Include(x => x.OrderItems).ThenInclude(x => x.ProductVariant)
                    .FirstOrDefaultAsync(x => x.OrderId == id, cancellationToken);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        order.OrderId,
                        order.OrderNumber,
                        order.OrderDate,
                        order.PaymentStatus,
                        order.GrandTotal,

                        CustomerName = order.UserAddress?.FullName,
                        Phone = order.UserAddress?.MobileNumber,
                        Address = $"{order.UserAddress?.AddressLine1}, {order.UserAddress?.AddressLine2}",
                        City = order.UserAddress?.City,
                        Pincode = order.UserAddress?.Pincode,

                        Items = (isAdmin
                                ? order.OrderItems
                                : order.OrderItems.Where(x => x.SellerId == sellerId))
                            .Select(x => new
                            {
                                x.OrderItemId,
                                x.ProductId,
                                x.ProductName,
                                Variant = x.ProductVariant != null ? x.ProductVariant.Model : "",
                                x.Quantity,
                                x.Price,
                                x.LineTotal,
                                x.OrderItemStatus
                            })
                            .ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load order details.", StatusCodes.Status500InternalServerError);
            }
        }

        private async Task<SellerModel?> GetCurrentSellerAsync()
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Sellers.FirstOrDefaultAsync(x => x.UserId == userId);
        }

        private bool HasActiveSubscription(SellerModel seller)
        {
            return seller.SubscriptionEndDate.HasValue &&
                   seller.SubscriptionEndDate.Value >= DateTime.UtcNow;
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { success = true, message = "Backend Updated" });
        }
    }
}
