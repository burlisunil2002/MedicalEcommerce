using DocumentFormat.OpenXml.Drawing.Charts;
using DocumentFormat.OpenXml.InkML;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using Rotativa.AspNetCore;
using System.Security.Cryptography;
using System.Text;
using Twilio;
using Twilio.Types;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Notification;
using VivekMedicalProducts.Services.Storage;
using VivekMedicalProducts.ViewModels;
using Twilio.Rest.Api.V2010.Account;




namespace VivekMedicalProducts.Controllers
{
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




        public OrderController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext, IFileStorageService fileStorageService, ICheckoutService checkoutService,
InvoiceService invoiceService, EmailService emailService, ICartCalculationService calc, ISmsService sms, ILogger<OrderController> logger)
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
        }

        private string GetOrCreateGuestId()
        {
            if (!Request.Cookies.TryGetValue("guest_id", out string guestId)
                || string.IsNullOrEmpty(guestId))
            {
                guestId = Guid.NewGuid().ToString();

                Response.Cookies.Append("guest_id", guestId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true, // 🔥 important for production
                    SameSite = SameSiteMode.Lax,
                    Path = "/",
                    IsEssential = true,
                    Expires = DateTime.UtcNow.AddDays(7)
                });
            }

            return guestId;
        }

        [HttpPost("place-cod")]
        public async Task<IActionResult> PlaceCOD()
        {
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
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

                var checkoutSession =
    await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Checkout session not found."
                    });
                }

                if (!checkoutSession.IsActive)
                {
                    checkoutSession.IsActive = true;
                }

                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId);

                if (address == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Please select a delivery address."
                    });
                }

                var carts = await _checkoutService.GetCurrentCartAsync();

                Console.WriteLine($"Cart Count: {carts.Count}");

                if (!carts.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Cart is empty."
                    });
                }

                var couponCode =
    checkoutSession.CouponCode;

                // Totals
                var totals =
                    await _calc.CalculateAsync(
                        userId,
                        null,
                        couponCode);

                var sellerId =
                    carts.FirstOrDefault()?.SellerId;

                // Create Order
                var order = new OrderModel
                {
                    UserId = userId,

                    UserAddressId = address.Id,

                    UserAddress = address,

                    OrderNumber = $"ORD-{DateTime.UtcNow.Ticks}",

                    GrandTotal = totals.Total,

                    Currency = "INR",

                    PaymentStatus = "Cash On Delivery",

                    IsPaymentVerified = false,

                    PaymentVerifiedAt = null,

                    OrderDate = DateTime.UtcNow,

                    OrderModifiedDate = DateTime.UtcNow,

                    CreatedBy = userId,

                    IpAddress =
        HttpContext.Connection.RemoteIpAddress?.ToString(),

                    UserAgent =
        Request.Headers["User-Agent"].ToString()
                };

                _context.Orders.Add(order);

                await _context.SaveChangesAsync();   // OrderId generated here

                decimal totalTaxableAmount =
                    carts.Sum(item =>
                    {
                        decimal originalPrice =
                            item.ProductVariant?.Price ?? 0;

                        decimal discountPercent =
                            item.Product?.DiscountPercentage ?? 0;

                        decimal discountAmount =
                            item.Product?.IsHotDeal == true
                                ? originalPrice *
                                  discountPercent / 100m
                                : 0;

                        decimal finalPrice =
                            originalPrice -
                            discountAmount;

                        return finalPrice *
                               item.Quantity;
                    });

                var orderItems = carts.Select(item =>
                {
                    decimal originalPrice =
                        item.ProductVariant?.Price ?? 0;

                    decimal discountPercent =
                        item.Product?.DiscountPercentage ?? 0;

                    decimal discountAmount =
                        item.Product?.IsHotDeal == true
                            ? originalPrice * discountPercent / 100m
                            : 0;

                    decimal finalUnitPrice =
                        originalPrice - discountAmount;

                    decimal taxableAmount =
                        finalUnitPrice * item.Quantity;

                    decimal gstPercent =
                        item.Product?.GSTPercentage ?? 0;

                    decimal gstAmount =
                        taxableAmount * gstPercent / 100m;

                    decimal couponShare = 0;

                    if (totals.CouponDiscount > 0 &&
                        totalTaxableAmount > 0)
                    {
                        couponShare =
                            (taxableAmount / totalTaxableAmount)
                            * totals.CouponDiscount;
                    }

                    decimal finalPaidAmount =
                        taxableAmount +
                        gstAmount -
                        couponShare;

                    return new OrderItemModel
                    {
                        OrderId = order.OrderId,

                        SellerId = item.SellerId,

                        ProductId = item.ProductId,

                        ProductVariantId = item.ProductVariantId,

                        ProductName = item.Product?.Name ?? "",

                        Quantity = item.Quantity,

                        Price = Math.Round(originalPrice, 2),

                        DiscountAmount =
         Math.Round(discountAmount, 2),

                        CouponDiscountAmount =
         Math.Round(couponShare, 2),

                        TaxableAmount =
         Math.Round(taxableAmount, 2),

                        GSTPercentage = gstPercent,

                        GSTAmount =
         Math.Round(gstAmount, 2),

                        NetAmount =
         Math.Round(finalPaidAmount, 2),

                        FinalPaidAmount =
         Math.Round(finalPaidAmount, 2),

                        LineTotal =
         Math.Round(finalPaidAmount, 2),

                        OrderItemStatus = "Placed",

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

                        ReturnStatus = "None",

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

                _context.OrderItems.AddRange(orderItems);

                _context.Carts.RemoveRange(carts);

                _context.CheckoutSessions.Remove(checkoutSession);

                await _context.SaveChangesAsync();      // Save everything together

                order.UserAddress = address;
                order.OrderItems = orderItems;

                await _sms.SendOrderPlacedAsync(order);

                await transaction.CommitAsync();
                // Send Invoice
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SendInvoiceEmailAsync(order.OrderId);
                    }
                    catch
                    {
                        // Ignore email errors
                    }
                });

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
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,

                    message =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }

        // ================= CREATE ORDER =================
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder()
        {
            try
            {
                var userId = _userContext.GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        redirect = "/login",
                        message = "Please login first."
                    });
                }

                // Active Checkout Session
                var checkoutSession =
 await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Checkout session not found."
                    });
                }

                if (!checkoutSession.IsActive)
                {
                    checkoutSession.IsActive = true;
                    checkoutSession.ModifiedDate = DateTime.UtcNow;
                }

                // Selected Address
                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId);

                if (address == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Please select a delivery address."
                    });
                }

                // Cart
                var carts = await _checkoutService.GetCurrentCartAsync();

                if (!carts.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Your cart is empty."
                    });
                }

                // Recalculate totals
                var totals = await _calc.CalculateAsync(
                    userId,
                    null,
                    checkoutSession.CouponCode);

                // Keep checkout session synchronized
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

                    await _context.SaveChangesAsync();
                }

                // Razorpay Amount (Paise)
                var amountInPaise =
                    Convert.ToInt32(Math.Round(totals.Total * 100));

                // Razorpay Client
                var client = new RazorpayClient(
                    _config["Razorpay:Key"],
                    _config["Razorpay:Secret"]);

                // Unique Receipt Number
                var receipt =
                    $"PAY-{Guid.NewGuid():N}"
                    .Substring(0, 20)
                    .ToUpper();

                // Create Razorpay Order
                var razorpayOrder =
                    client.Order.Create(new Dictionary<string, object>
                    {
                { "amount", amountInPaise },
                { "currency", "INR" },
                { "receipt", receipt }
                    });

                var razorpayOrderId =
                    razorpayOrder["id"].ToString();

                // Close any previous pending payment session
                var oldSessions = await _context.PaymentSessions
                    .Where(x =>
                        x.UserId == userId &&
                        !x.IsCompleted)
                    .ToListAsync();

                foreach (var old in oldSessions)
                {
                    old.IsCompleted = true;
                    old.PaymentStatus = "Cancelled";
                    old.FailureReason =
                        "Superseded by new payment session.";
                }

                // Create Payment Session
                var session = new PaymentSession
                {
                    CheckoutSessionId = checkoutSession.Id,

                    UserId = userId,

                    RazorpayOrderId = razorpayOrderId,

                    Amount = totals.Total,

                    Currency = checkoutSession.Currency,

                    CouponCode = checkoutSession.CouponCode,

                    CouponDiscount = totals.CouponDiscount,

                    PaymentStatus = "Created",

                    CreatedDate = DateTime.UtcNow,

                    ExpiryDate = DateTime.UtcNow.AddMinutes(30),

                    IsCompleted = false,

                    IpAddress =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),

                    UserAgent =
                        Request.Headers["User-Agent"].ToString()
                };

                _context.PaymentSessions.Add(session);

                await _context.SaveChangesAsync();

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
                return BadRequest(new
                {
                    success = false,
                    message =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }


        // ================= VERIFY PAYMENT =================
        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment(
    [FromBody] PaymentDto model)
        {
            await using var transaction =
     await _context.Database.BeginTransactionAsync();

            try
            {
                if (model == null ||
                    string.IsNullOrWhiteSpace(model.razorpay_order_id) ||
                    string.IsNullOrWhiteSpace(model.razorpay_payment_id) ||
                    string.IsNullOrWhiteSpace(model.razorpay_signature))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid payment details."
                    });
                }

                // Payment Session
                var session =
                    await _context.PaymentSessions
                    .FirstOrDefaultAsync(x =>
                        x.RazorpayOrderId ==
                        model.razorpay_order_id);

                if (session == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Payment session not found."
                    });
                }

                if (session.IsCompleted)
                {
                    return Ok(new
                    {
                        success = true,
                        redirect = "order-success/:id"
                    });
                }

                if (session.ExpiryDate < DateTime.UtcNow)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Payment session expired."
                    });
                }

                // Verify Razorpay Signature
                var payload =
                    $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

                using var hmac =
                    new HMACSHA256(
                        Encoding.UTF8.GetBytes(
                            _config["Razorpay:Secret"]));

                var generated =
                    Convert.ToHexString(
                        hmac.ComputeHash(
                            Encoding.UTF8.GetBytes(payload)))
                    .ToLowerInvariant();

                if (generated != model.razorpay_signature)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Payment verification failed."
                    });
                }

                // Load Checkout Session
                var checkoutSession =
     await _checkoutService.GetCurrentSessionAsync();

                if (checkoutSession == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Checkout session not found."
                    });
                }

                var userId = checkoutSession.UserId;

                // Address
                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == checkoutSession.SelectedAddressId &&
                        x.UserId == userId);

                if (address == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Delivery address not found."
                    });
                }

                // Cart
                var carts =
     await _checkoutService.GetCurrentCartAsync();

                if (!carts.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Cart is empty."
                    });
                }

                // Latest Totals
                var totals = await _calc.CalculateAsync(
                    userId,
                    null,
                    checkoutSession.CouponCode);

                var sellerId = carts.FirstOrDefault()?.SellerId;
                // Create Order
                var order = new OrderModel
                {
                    UserId = userId,

                    UserAddressId = address.Id,

                    UserAddress = address,


                    OrderNumber = $"ORD-{DateTime.UtcNow.Ticks}",

                    GrandTotal = totals.Total,

                    Currency = checkoutSession.Currency,

                    PaymentStatus = "Completed",

                    RazorpayOrderId = model.razorpay_order_id,

                    RazorpayPaymentId = model.razorpay_payment_id,

                    RazorpaySignature = model.razorpay_signature,

                    IsPaymentVerified = true,

                    PaymentVerifiedAt = DateTime.UtcNow,

                    OrderDate = DateTime.UtcNow,

                    OrderModifiedDate = DateTime.UtcNow,

                    CreatedBy = userId,

                    IpAddress = HttpContext.Connection
        .RemoteIpAddress?
        .ToString(),

                    UserAgent = Request.Headers["User-Agent"]
        .ToString()
                };

                _context.Orders.Add(order);

                await _context.SaveChangesAsync();

                decimal totalTaxableAmount =
                    carts.Sum(item =>
                    {
                        decimal originalPrice =
                            item.ProductVariant?.Price ?? 0;

                        decimal discountPercent =
                            item.Product?.DiscountPercentage ?? 0;

                        decimal discountAmount =
                            item.Product?.IsHotDeal == true
                                ? originalPrice *
                                  discountPercent / 100m
                                : 0;

                        decimal finalPrice =
                            originalPrice -
                            discountAmount;

                        return finalPrice *
                               item.Quantity;
                    });

                var orderItems = carts.Select(item =>
                {
                    decimal originalPrice =
                        item.ProductVariant?.Price ?? 0;

                    decimal discountPercent =
                        item.Product?.DiscountPercentage ?? 0;

                    decimal discountAmount =
                        item.Product?.IsHotDeal == true
                            ? originalPrice * discountPercent / 100m
                            : 0;

                    decimal finalUnitPrice =
                        originalPrice - discountAmount;

                    decimal taxableAmount =
                        finalUnitPrice * item.Quantity;

                    decimal gstPercent =
                        item.Product?.GSTPercentage ?? 0;

                    decimal gstAmount =
                        taxableAmount * gstPercent / 100m;

                    decimal couponShare = 0;

                    if (totals.CouponDiscount > 0 &&
                        totalTaxableAmount > 0)
                    {
                        couponShare =
                            (taxableAmount / totalTaxableAmount)
                            * totals.CouponDiscount;
                    }

                    decimal finalPaidAmount =
                        taxableAmount +
                        gstAmount -
                        couponShare;

                    return new OrderItemModel
                    {
                        OrderId = order.OrderId,

                        SellerId = item.SellerId,

                        ProductId = item.ProductId,

                        ProductVariantId = item.ProductVariantId,

                        ProductName = item.Product?.Name ?? "",

                        Quantity = item.Quantity,

                        Price = Math.Round(originalPrice, 2),

                        DiscountAmount = Math.Round(discountAmount, 2),

                        CouponDiscountAmount =
         Math.Round(couponShare, 2),

                        TaxableAmount =
         Math.Round(taxableAmount, 2),

                        GSTPercentage = gstPercent,

                        GSTAmount =
         Math.Round(gstAmount, 2),

                        NetAmount =
         Math.Round(finalPaidAmount, 2),

                        FinalPaidAmount =
         Math.Round(finalPaidAmount, 2),

                        LineTotal =
         Math.Round(finalPaidAmount, 2),

                        OrderItemStatus = "Placed",

                        CreatedAt = DateTime.UtcNow,

                        UpdatedAt = DateTime.UtcNow,

                        ItemOrderModifiedDate = DateTime.UtcNow,

                        IsReturnEligible = false,

                        ReturnStatus = "None"
                    };

                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                _context.Carts.RemoveRange(carts);

                session.IsCompleted = true;
                session.PaymentStatus = "Completed";
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

                await _context.SaveChangesAsync();

                order.UserAddress = address;
                order.OrderItems = orderItems;

                await _sms.SendOrderPlacedAsync(order);

                await transaction.CommitAsync();

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SendInvoiceEmailAsync(order.OrderId);
                    }
                    catch
                    {
                    }
                });

                return Ok(new
                {
                    success = true,

                    orderId = order.OrderId,

                    redirect = "order-success/:id"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }



        // ================= PAYMENT FAILED =================
        [HttpPost("payment-failed")]
        public async Task<IActionResult> PaymentFailed([FromBody] PaymentDto dto)
        {
            var session = await _context.PaymentSessions
                .FirstOrDefaultAsync(x =>
                    x.RazorpayOrderId == dto.razorpay_order_id);

            if (session != null)
            {
                session.IsCompleted = false;

                // Optional:
                // session.PaymentStatus = "Failed";

                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                success = true
            });
        }

        // ================= WEBHOOK =================
        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> RazorpayWebhook()
        {
            try
            {
                var webhookSecret = _config["Razorpay:WebhookSecret"];

                if (string.IsNullOrWhiteSpace(webhookSecret))
                    return Unauthorized();

                string body;

                using (var reader = new StreamReader(Request.Body))
                {
                    body = await reader.ReadToEndAsync();
                }

                var receivedSignature =
                    Request.Headers["X-Razorpay-Signature"].ToString();

                var expectedSignature =
                    ComputeHmac(body, webhookSecret);

                if (!CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(expectedSignature),
                        Encoding.UTF8.GetBytes(receivedSignature)))
                {
                    return Unauthorized();
                }

                dynamic data = JsonConvert.DeserializeObject(body)!;

                string eventType = data.@event;

                string razorpayOrderId =
                    data?.payload?.payment?.entity?.order_id;

                string razorpayPaymentId =
                    data?.payload?.payment?.entity?.id;

                var session =
                    await _context.PaymentSessions
                        .FirstOrDefaultAsync(x =>
                            x.RazorpayOrderId ==
                            razorpayOrderId);

                if (session == null)
                    return Ok();

                switch (eventType)
                {
                    case "payment.captured":

                        session.IsCompleted = true;

                        // Optional if you add these columns later
                        // session.PaymentStatus = "Captured";
                        // session.RazorpayPaymentId = razorpayPaymentId;

                        break;

                    case "payment.failed":

                        session.IsCompleted = false;

                        // Optional
                        // session.PaymentStatus = "Failed";

                        break;

                    default:

                        return Ok();
                }

                await _context.SaveChangesAsync();

                return Ok();
            }
            catch
            {
                // Prevent Razorpay from continuously retrying
                return Ok();
            }
        }

        [HttpPut("cancel-item/{orderItemId}")]
        public async Task<IActionResult> CancelOrderItem(
      int orderItemId,
      [FromBody] CancelOrderRequest request)
        {
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var userId = _userContext.GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Please login first."
                    });
                }

                var orderItem = await _context.OrderItems
                    .Include(x => x.Order)
                    .FirstOrDefaultAsync(x =>
                        x.OrderItemId == orderItemId &&
                        x.Order.UserId == userId);

                if (orderItem == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order item not found."
                    });
                }

                if (orderItem.OrderItemStatus == "Cancelled")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Item is already cancelled."
                    });
                }

                if (orderItem.OrderItemStatus != "Placed" &&
                    orderItem.OrderItemStatus != "Accepted" &&
                    orderItem.OrderItemStatus != "Packed")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "This item cannot be cancelled after shipment."
                    });
                }

                // Cancel Item

                orderItem.OrderItemStatus = "Cancelled";

                orderItem.CancelledAt = DateTime.UtcNow;

                orderItem.CancelledBy = userId;
                orderItem.CancelledReason = request.ReasonType;

                orderItem.ReturnRemarks = request.Remarks;

                orderItem.UpdatedAt =
                    DateTime.UtcNow;

                orderItem.ItemOrderModifiedDate =
                    DateTime.UtcNow;

                // Refund (Prepaid Orders)

                if (orderItem.Order.PaymentStatus == "Completed")
                {
                    orderItem.RefundStatus = "Initiated";

                    orderItem.RefundAmount =
                        orderItem.FinalPaidAmount;
                }

                // Check if all items are cancelled

                var remainingItems =
                    await _context.OrderItems
                    .Where(x =>
                        x.OrderId == orderItem.OrderId &&
                        x.OrderItemStatus != "Cancelled")
                    .CountAsync();

                if (remainingItems == 0)
                {
                    if (orderItem.Order.PaymentStatus == "Completed")
                    {
                        orderItem.Order.PaymentStatus =
                            "PartiallyRefunded";
                    }
                    else
                    {
                        orderItem.Order.PaymentStatus =
                            "Cancelled";
                    }

                    orderItem.Order.OrderModifiedDate =
                        DateTime.UtcNow;

                    orderItem.Order.UpdatedBy =
                        userId;
                }

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message =
                                       orderItem.Order.PaymentStatus == "Completed"
                    ? "Item cancelled successfully. Refund has been initiated."
                    : "Item cancelled successfully."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        public class CancelOrderRequest
        {
            public string ReasonType { get; set; } = "";
            // Customer Changed Mind
            // Ordered by Mistake
            // Price Too High
            // Found Better Product
            // Expected Delivery Too Late
            // Other

            public string? Remarks { get; set; }
        }



        [HttpGet("check-payment-status/{razorpayOrderId}")]
        public async Task<IActionResult> CheckPaymentStatus(string razorpayOrderId)
        {
            try
            {
                var session = await _context.PaymentSessions
                    .FirstOrDefaultAsync(x =>
                        x.RazorpayOrderId == razorpayOrderId);

                if (session == null)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Payment session not found."
                    });
                }

                // Payment not completed yet
                if (!session.IsCompleted)
                {
                    return Ok(new
                    {
                        success = false,
                        paymentStatus = session.PaymentStatus,
                        message = "Payment is still processing."
                    });
                }

                // Order created after payment verification
                var order = await _context.Orders
                    .Include(x => x.OrderItems)
                    .FirstOrDefaultAsync(x =>
                        x.RazorpayOrderId == razorpayOrderId);

                if (order == null)
                {
                    return Ok(new
                    {
                        success = false,
                        paymentStatus = session.PaymentStatus,
                        message = "Order is being created."
                    });
                }

                // Item summary
                var itemSummary = order.OrderItems
                    .GroupBy(x => x.OrderItemStatus)
                    .Select(x => new
                    {
                        status = x.Key,
                        count = x.Count()
                    })
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
                return BadRequest(new
                {
                    success = false,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }


        [Authorize]
        [HttpGet("success-order/{id}")]
        public async Task<IActionResult> SuccessOrder(int id)
        {
            try
            {
                var userId = _userContext.GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Please login first."
                    });
                }

                var order = await _context.Orders
                    .AsNoTracking()
                    .Include(x => x.UserAddress)
                    .Include(x => x.OrderItems)
                        .ThenInclude(x => x.Product)
                    .Include(x => x.OrderItems)
                        .ThenInclude(x => x.ProductVariant)
                            .ThenInclude(x => x.Images)
                    .FirstOrDefaultAsync(x =>
                        x.OrderId == id &&
                        x.UserId == userId);

                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order not found."
                    });
                }

                //------------------------------------------------------
                // Derive Overall Order Status
                //------------------------------------------------------

                string orderStatus = "Placed";

                var statuses = order.OrderItems
                    .Select(x => x.OrderItemStatus)
                    .ToList();

                if (statuses.All(x => x == "Cancelled"))
                    orderStatus = "Cancelled";
                else if (statuses.All(x => x == "Delivered"))
                    orderStatus = "Delivered";
                else if (statuses.Any(x => x == "OutForDelivery"))
                    orderStatus = "Out For Delivery";
                else if (statuses.Any(x => x == "Shipped"))
                    orderStatus = "Shipped";
                else if (statuses.Any(x => x == "Packed"))
                    orderStatus = "Packed";
                else
                    orderStatus = "Placed";

                //------------------------------------------------------
                // Response
                //------------------------------------------------------

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

                            address =
                                $"{order.UserAddress?.AddressLine1}, {order.UserAddress?.AddressLine2}",

                            city = order.UserAddress?.City,

                            state = order.UserAddress?.State,

                            pincode = order.UserAddress?.Pincode
                        },

                        items = order.OrderItems
                            .Select(i => new
                            {
                                orderItemId = i.OrderItemId,

                                sellerId = i.SellerId,

                                productId = i.ProductId,

                                productName = i.ProductName,

                                variantName = i.ProductVariant?.Model ?? "",

                                image =
                                    i.ProductVariant != null &&
                                    i.ProductVariant.Images.Any()
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
                            })
                            .ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }


            [Authorize]
            [HttpPost("request-return/{orderItemId}")]
            public async Task<IActionResult> RequestReturn(
    int orderItemId,
    [FromForm] RequestReturnDto dto)
            {
                dto.OrderItemId = orderItemId;

                try
                {
                var userId = _userContext.GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Please login first."
                    });
                }

                if (dto.OrderItemId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid order item."
                    });
                }

                var orderItem = await _context.OrderItems
                    .Include(x => x.Order)
                    .FirstOrDefaultAsync(x =>
                        x.OrderItemId == dto.OrderItemId &&
                        x.Order.UserId == userId);

                if (orderItem == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order item not found."
                    });
                }

                // Only delivered items can be returned
                if (orderItem.OrderItemStatus != "Delivered")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Only delivered items can be returned."
                    });
                }

                // Return eligibility
                if (!orderItem.IsReturnEligible)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "This item is not eligible for return."
                    });
                }

                // Return window
                if (!orderItem.ReturnEligibleTill.HasValue)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Return window information is unavailable."
                    });
                }

                if (DateTime.UtcNow > orderItem.ReturnEligibleTill.Value)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Return period has expired."
                    });
                }

                // Already requested
                if (!string.IsNullOrWhiteSpace(orderItem.ReturnStatus) &&
                    orderItem.ReturnStatus != "None")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "A return request has already been submitted for this item."
                    });
                }

                // Double check in Return table
                bool alreadyExists = await _context.OrderReturns
                    .AnyAsync(x =>
                        x.OrderItemId == dto.OrderItemId &&
                        x.Status != "Rejected");

                if (alreadyExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "A return request already exists for this item."
                    });
                }

                string? image1 = null;
                string? image2 = null;
                string? image3 = null;

                if (dto.Image1 != null)
                {
                    image1 = await _fileStorageService.UploadAsync(dto.Image1, "ReturnImages");
                }

                if (dto.Image2 != null)
                {
                    image2 = await _fileStorageService.UploadAsync(dto.Image2, "ReturnImages");
                }

                if (dto.Image3 != null)
                {
                    image3 = await _fileStorageService.UploadAsync(dto.Image3, "ReturnImages");
                }

                // Create Return Request
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

                    Status = "Requested",
                    RequestedDate = DateTime.UtcNow
                };

                _context.OrderReturns.Add(returnRequest);

                // Update Order Item
                orderItem.ReturnStatus = "Requested";
                orderItem.ReturnReason = dto.Reason;
                orderItem.ReturnRemarks = dto.Remarks;
                orderItem.ReturnRequestedDate = DateTime.UtcNow;

                orderItem.UpdatedAt = DateTime.UtcNow;
                orderItem.ItemOrderModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

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
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpGet("returns")]
        public async Task<IActionResult> GetReturns(
     int page = 1,
     int pageSize = 10,
     string? search = null,
     string? status = null)
        {
            var isAdmin = User.IsInRole("Admin");

            var query = _context.OrderReturns
                .Include(r => r.Order)
                    .ThenInclude(o => o.UserAddress)
                .Include(r => r.OrderItem)
                    .ThenInclude(i => i.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(i => i.ProductVariant)
                .AsQueryable();

            if (!isAdmin)
            {
                var userId = _userContext.GetUserId();

                var sellerId = await _context.Sellers
                    .Where(s => s.UserId == userId)
                    .Select(s => s.SellerId)
                    .FirstOrDefaultAsync();

                query = query.Where(r => r.OrderItem.SellerId == sellerId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();

                query = query.Where(r =>
                    r.Order.OrderNumber.ToLower().Contains(search) ||
                    r.Order.UserAddress.FullName.ToLower().Contains(search) ||
                    r.Order.UserAddress.MobileNumber.Contains(search) ||
                    r.OrderItem.ProductName.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(r => r.Status == status);
            }

            var totalRecords = await query.CountAsync();

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

                    VariantName = r.OrderItem.ProductVariant != null
                        ? r.OrderItem.ProductVariant.Model
                        : "",

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
                .ToListAsync();

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
     UpdateReturnStatusDto dto)
        {
            var userId = _userContext.GetUserId();

            bool isAdmin = User.IsInRole("Admin");

            int? sellerId = null;

            if (!isAdmin)
            {
                sellerId = await _context.Sellers
                    .Where(x => x.UserId == userId)
                    .Select(x => (int?)x.SellerId)
                    .FirstOrDefaultAsync();
            }

            var query = _context.OrderReturns
                .Include(x => x.OrderItem)
                    .ThenInclude(x => x.Product)
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(x =>
                    x.OrderItem.Product.SellerId == sellerId);
            }

            var item = await query.FirstOrDefaultAsync(x => x.ReturnId == returnId);

            if (item == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Return request not found."
                });
            }

            item.Status = dto.Status;
            item.Remarks = dto.Remarks;

            item.OrderItem.ReturnStatus = dto.Status;

            if (dto.Status == "RefundCompleted")
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

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Return status updated successfully."
            });
        }

        // ================= HELPERS =================

        private string ComputeHmac(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        [Authorize]
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            try
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

                var orders = await _context.Orders
     .AsNoTracking()

     .Include(o => o.UserAddress)

     .Include(o => o.OrderItems)
         .ThenInclude(i => i.Product)

     .Include(o => o.OrderItems)
         .ThenInclude(i => i.ProductVariant)
             .ThenInclude(v => v.Images)

     .Where(o => o.UserId == userId)

     .OrderByDescending(o => o.OrderDate)

     .ToListAsync();

                var response = orders.Select(order =>
                {
                    var itemStatuses = order.OrderItems
                        .Select(x => x.OrderItemStatus)
                        .ToList();

                    // Derived Status (Not Stored in DB)
                    string orderStatus;

                    if (itemStatuses.All(x => x == "Cancelled"))
                        orderStatus = "Cancelled";
                    else if (itemStatuses.All(x => x == "Delivered"))
                        orderStatus = "Delivered";
                    else if (itemStatuses.Any(x => x == "OutForDelivery"))
                        orderStatus = "Out For Delivery";
                    else if (itemStatuses.Any(x => x == "Shipped"))
                        orderStatus = "Shipped";
                    else if (itemStatuses.Any(x => x == "Packed"))
                        orderStatus = "Packed";
                    else
                        orderStatus = "Placed";

                    return new
                    {
                        orderId = order.OrderId,

                        orderNumber = order.OrderNumber,

                        orderDate = order.OrderDate,

                        grandTotal = order.GrandTotal,

                        paymentStatus = order.PaymentStatus,

                        deliveryAddress = order.UserAddress == null
    ? null
    : new
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

                            variantName =
                                item.ProductVariant?.Model ?? "",

                            productImage =
                                item.ProductVariant != null &&
                                item.ProductVariant.Images.Any()
                                ? item.ProductVariant.Images
                                    .OrderBy(x => x.DisplayOrder)
                                    .Select(x => x.ImageUrl)
                                    .FirstOrDefault()
                                : !string.IsNullOrWhiteSpace(item.Product.ImageUrl)
                                    ? item.Product.ImageUrl
                                    : "/images/no-image.png",

                            productImages =
                                item.ProductVariant != null
                                ? item.ProductVariant.Images
                                    .OrderBy(x => x.DisplayOrder)
                                    .Select(x => x.ImageUrl)
                                    .ToList()
                                : new List<string>(),

                            quantity = item.Quantity,

                            price = item.Price,

                            finalPaidAmount = item.FinalPaidAmount,

                            itemTotal = item.LineTotal,

                            itemStatus = item.OrderItemStatus,

                            isReturnEligible =
                                item.IsReturnEligible,

                            returnStatus =
                                item.ReturnStatus,

                            remainingReturnDays =
                                item.ReturnEligibleTill.HasValue
                                ? Math.Max(
                                    0,
                                    (item.ReturnEligibleTill.Value - DateTime.UtcNow).Days)
                                : 0,

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

                            cancelledReason =
                        item.CancelledReason,

                            trackingNumber =
                        item.TrackingNumber,

                            courierPartner =
                        item.CourierPartner,

                            refundAmount =
                        item.RefundAmount,

                            refundStatus =
                        item.RefundStatus,

                            returnReason =
                        item.ReturnReason,

                            returnRemarks =
                        item.ReturnRemarks,

                            returnRequestedDate =
                        item.ReturnRequestedDate,

                            returnApprovedDate =
                        item.ReturnApprovedDate,

                            pickupDate =
                        item.PickupDate,

                            refundCompletedDate =
                        item.RefundCompletedDate,

                            returnImages =
                        item.ReturnImages
                        }).ToList()
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    orders = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to load orders.",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
        }


        [Authorize]
        [HttpGet("invoice/{id}")]
        public async Task<IActionResult> Invoice(int id)
        {
            try
            {
                var userId = _userContext.GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Please login first."
                    });
                }

                var order = await _context.Orders
                    .Include(o => o.UserAddress)
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.Product)
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                    .FirstOrDefaultAsync(o =>
                        o.OrderId == id &&
                        o.UserId == userId);

                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order not found."
                    });
                }

                //------------------------------------------------
                // Payment Validation
                //------------------------------------------------

                if (!order.IsPaymentVerified ||
                    order.PaymentStatus != "Completed")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invoice is available only after successful payment."
                    });
                }

                //------------------------------------------------
                // Optional Safety Check
                //------------------------------------------------

                if (!order.OrderItems.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No items found for this order."
                    });
                }

                //------------------------------------------------
                // Build Invoice
                //------------------------------------------------

                var model = BuildInvoiceModel(order);

                return Ok(new
                {
                    success = true,

                    invoice = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        private async Task<byte[]> GenerateInvoicePdf(
    OrderInvoiceViewModel model)
        {
            model.IsPdf = true;

            var pdf =
                new ViewAsPdf(
                    "Invoice",
                    model
                );

            return await pdf.BuildFile(
                ControllerContext
            );
        }

        public async Task SendInvoiceEmailAsync(
    int orderId)
        {
            var order =
    await _context.Orders
        .Include(o => o.OrderItems)
            .ThenInclude(i => i.ProductVariant)
        .Include(o => o.OrderItems)
            .ThenInclude(i => i.Product)
        .Include(o => o.User)
        .Include(o => o.UserAddress)
        .FirstOrDefaultAsync(o =>
            o.OrderId == orderId);

            if (order == null)
                return;

            var email =
                order.User?.Email;

            if (
                string.IsNullOrWhiteSpace(
                    email
                )
            )
                return;

            var model =
                BuildInvoiceModel(order);

            var pdfBytes =
                await GenerateInvoicePdf(
                    model
                );

            await _emailService
                .SendEmailWithAttachmentAsync(
                    email,
                    "Your Invoice",
                    $"Thanks for your order #{order.OrderNumber}. Please find your invoice attached.",
                    pdfBytes,
                    $"Invoice-{order.OrderNumber}.pdf"
                );
        }



        private OrderInvoiceViewModel BuildInvoiceModel(OrderModel order)
        {
            var address = order.UserAddress;

            decimal subtotal = order.OrderItems.Sum(x =>
                x.Price * x.Quantity);

            decimal productDiscount = order.OrderItems.Sum(x =>
                x.DiscountAmount * x.Quantity);

            decimal taxableAmount = order.OrderItems.Sum(x =>
                x.TaxableAmount);

            decimal couponDiscount = order.OrderItems.Sum(x =>
                x.CouponDiscountAmount);

            decimal gstTotal = order.OrderItems.Sum(x =>
                x.GSTAmount);

            decimal finalPaid = order.OrderItems.Sum(x =>
                x.FinalPaidAmount);

            // Derived Order Status (not stored in DB)
            var statuses = order.OrderItems
                .Select(x => x.OrderItemStatus)
                .ToList();

            string orderStatus;

            if (statuses.All(x => x == "Cancelled"))
                orderStatus = "Cancelled";
            else if (statuses.All(x => x == "Delivered"))
                orderStatus = "Delivered";
            else if (statuses.Any(x => x == "OutForDelivery"))
                orderStatus = "Out For Delivery";
            else if (statuses.Any(x => x == "Shipped"))
                orderStatus = "Shipped";
            else if (statuses.Any(x => x == "Packed"))
                orderStatus = "Packed";
            else
                orderStatus = "Placed";

            return new OrderInvoiceViewModel
            {
                OrderId = order.OrderId,

                InvoiceNumber =
                    $"INV-{order.OrderNumber}",

                Date = order.OrderDate,

                CompanyName =
                    "Sunil Medical Products Pvt Ltd",

                CompanyGST =
                    "37ABCDE1234F1Z5",

                CompanyAddress =
                    "Visakhapatnam, Andhra Pradesh, India",

                CompanyPhone =
                    "9014060858",

                CustomerName =
                    address?.FullName ?? "",

                Address =
                    $"{address?.AddressLine1}, {address?.AddressLine2}",

                City =
                    address?.City ?? "",

                Pincode =
                    address?.Pincode ?? "",

                Phone =
                    address?.MobileNumber ?? "",

                PaymentId =
                    order.RazorpayPaymentId ?? "",

                PaymentStatus =
                    order.PaymentStatus,

                OrderStatus =
                    orderStatus,

                Currency =
                    order.Currency,

                SubTotal =
                    subtotal,

                DiscountTotal =
                    productDiscount,
                TaxableAmount =
            taxableAmount,

                CouponDiscount =
            couponDiscount,

                GSTTotal =
            gstTotal,

                FinalPaidAmount =
            finalPaid,

                GrandTotal =
            order.GrandTotal,

                Items = order.OrderItems
            .Select(item => new InvoiceItemViewModel
            {
                ProductName =
                    item.ProductName,

                VariantName =
                    item.ProductVariant?.Model ?? "",

                Quantity =
                    item.Quantity,

                Price =
                    item.Price,

                DiscountAmount =
                    item.DiscountAmount,

                TaxableAmount =
                    item.TaxableAmount,

                GSTPercentage =
                    item.GSTPercentage,

                GSTAmount =
                    item.GSTAmount,

                CouponDiscountAmount =
                    item.CouponDiscountAmount,

                FinalPaidAmount =
                    item.FinalPaidAmount,

                Total =
                    item.LineTotal,

                // Optional Item Details
                ItemStatus =
                    item.OrderItemStatus,

                SellerId =
                    item.SellerId,

                ReturnStatus =
                    item.ReturnStatus
            })
            .ToList()
            };
        }





        public static string GetDisplayName(ApplicationUser user)
        {
            if (user == null) return "Unknown";

            return !string.IsNullOrEmpty(user.CustomerName)
                ? user.CustomerName
                : user.UserName;
        }

        [Authorize]
        [HttpGet("admin-orders")]
        public async Task<IActionResult> AdminOrders(
     string search = "",
     DateTime? fromDate = null,
     DateTime? toDate = null,
     string paymentStatus = "",
     string orderStatus = "",
     string returnStatus = "",
     int page = 1,
     int pageSize = 50)
        {
            try
            {
                var isAdmin = User.IsInRole("Admin");

                int sellerId = 0;
                string sellerName = "Admin";
                bool isSubscribed = true;

                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    if (seller == null)
                    {
                        return Unauthorized(new
                        {
                            success = false,
                            message = "Seller not found."
                        });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = "Your subscription has expired. Please renew it."
                        });
                    }

                    sellerId = seller.SellerId;
                    sellerName = seller.BusinessName ?? "Seller";
                    isSubscribed = true;
                }

                // Base Query
                var query =
                    from item in _context.OrderItems

                    join order in _context.Orders
                        on item.OrderId equals order.OrderId

                    join product in _context.Products
                        on item.ProductId equals product.Id

                    join user in _context.Users
                        on order.UserId equals user.Id

                    select new AdminOrderModel
                    {
                        // Order
                        OrderId = order.OrderId,
                        OrderItemId = item.OrderItemId,
                        OrderNumber = order.OrderNumber,
                        OrderDate = order.OrderDate,

                        // Customer
                        Customer = !string.IsNullOrWhiteSpace(user.CustomerName)
                            ? user.CustomerName
                            : user.UserName,

                        // Seller
                        SellerId = item.SellerId,

                        // Product
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,

                        VariantName = item.ProductVariant != null
                            ? item.ProductVariant.Model
                            : "",

                        Quantity = item.Quantity,
                        Price = item.Price,

                        // Pricing
                        DiscountAmount = item.DiscountAmount,
                        CouponDiscountAmount = item.CouponDiscountAmount,
                        TaxableAmount = item.TaxableAmount,
                        GSTPercentage = item.GSTPercentage,
                        GSTAmount = item.GSTAmount,
                        FinalPaidAmount = item.FinalPaidAmount,
                        LineTotal = item.LineTotal,

                        // Payment
                        PaymentStatus = order.PaymentStatus ?? "Pending",
                        RazorpayPaymentId = order.RazorpayPaymentId ?? "-",

                        // Item Status
                        OrderStatus = item.OrderItemStatus,

                        PackedDate = item.PackedDate,
                        ShippedDate = item.ShippedDate,
                        OutForDeliveryDate = item.OutForDeliveryDate,
                        DeliveredDate = item.DeliveredDate,

                        // Return
                        ReturnStatus = item.ReturnStatus,
                        IsReturnEligible = item.IsReturnEligible,
                        ReturnEligibleTill = item.ReturnEligibleTill,

                        // Cancellation
                        CancelledAt = item.CancelledAt,

                        // Tracking
                        TrackingNumber = item.TrackingNumber,
                        CourierPartner = item.CourierPartner,

                        // Order Total
                        GrandTotal = order.GrandTotal
                    };

                //----------------------------------------------------
                // Seller Filter
                //----------------------------------------------------

                if (!isAdmin)
                {
                    query = query.Where(x =>
                        x.SellerId == sellerId);
                }

                //----------------------------------------------------
                // Search
                //----------------------------------------------------

                if (!string.IsNullOrWhiteSpace(search))
                {
                    search = search.Trim().ToLower();

                    query = query.Where(x =>

                        (x.ProductName ?? "")
                            .ToLower()
                            .Contains(search)

                        ||

                        (x.Customer ?? "")
                            .ToLower()
                            .Contains(search)

                        ||

                        (x.OrderNumber ?? "")
                            .ToLower()
                            .Contains(search)

                        ||

                        x.OrderId
                            .ToString()
                            .Contains(search)

                        ||

                        (x.RazorpayPaymentId ?? "")
                            .ToLower()
                            .Contains(search)
                    );
                }

                //----------------------------------------------------
                // Date Filter
                //----------------------------------------------------

                if (fromDate.HasValue)
                {
                    var from = fromDate.Value.Date;

                    query = query.Where(x =>
                        x.OrderDate >= from);
                }

                if (toDate.HasValue)
                {
                    var to = toDate.Value.Date.AddDays(1);

                    query = query.Where(x =>
                        x.OrderDate < to);
                }

                //----------------------------------------------------
                // Payment Status
                //----------------------------------------------------

                if (!string.IsNullOrWhiteSpace(paymentStatus))
                {
                    query = query.Where(x =>
                        x.PaymentStatus == paymentStatus);
                }

                //----------------------------------------------------
                // Order Status
                //----------------------------------------------------

                if (!string.IsNullOrWhiteSpace(orderStatus))
                {
                    query = query.Where(x =>
                        x.OrderStatus == orderStatus);
                }

                //----------------------------------------------------
                // Return Status
                //----------------------------------------------------

                if (!string.IsNullOrWhiteSpace(returnStatus))
                {
                    query = query.Where(x =>
                        x.ReturnStatus == returnStatus);
                }

                //----------------------------------------------------
                // Dashboard Statistics
                //----------------------------------------------------

                var totalOrders = await query
                    .Select(x => x.OrderId)
                    .Distinct()
                    .CountAsync();

                var totalOrderItems = await query
                    .CountAsync();

                var pending = await query
                    .Where(x => x.OrderStatus == "Pending")
                    .CountAsync();

                var packed = await query
                    .Where(x => x.OrderStatus == "Packed")
                    .CountAsync();

                var shipped = await query
                    .Where(x => x.OrderStatus == "Shipped")
                    .CountAsync();

                var outForDelivery = await query
                    .Where(x => x.OrderStatus == "OutForDelivery")
                    .CountAsync();

                var delivered = await query
                    .Where(x => x.OrderStatus == "Delivered")
                    .CountAsync();

                var cancelled = await query
                    .Where(x => x.OrderStatus == "Cancelled")
                    .CountAsync();

                var returnRequested = await query
                    .Where(x => x.ReturnStatus == "Requested")
                    .CountAsync();

                var returnApproved = await query
                    .Where(x => x.ReturnStatus == "Approved")
                    .CountAsync();

                var returned = await query
                    .Where(x => x.ReturnStatus == "Returned")
                    .CountAsync();

                var refunded = await query
                    .Where(x => x.ReturnStatus == "Refunded")
                    .CountAsync();

                var completedPayments = await query
                    .Where(x => x.PaymentStatus == "Completed")
                    .Select(x => x.OrderId)
                    .Distinct()
                    .CountAsync();

                var pendingPayments = await query
                    .Where(x => x.PaymentStatus == "Pending")
                    .Select(x => x.OrderId)
                    .Distinct()
                    .CountAsync();

                var failedPayments = await query
                    .Where(x => x.PaymentStatus == "Failed")
                    .Select(x => x.OrderId)
                    .Distinct()
                    .CountAsync();

                var totalPages =
                    (int)Math.Ceiling((double)totalOrders / pageSize);

                //----------------------------------------------------
                // Revenue
                //----------------------------------------------------

                var revenue = await _context.OrderItems
                    .Where(x =>
                        (isAdmin || x.SellerId == sellerId) &&
                        x.Order.PaymentStatus == "Completed")
                    .SumAsync(x => x.FinalPaidAmount);

                //----------------------------------------------------
                // Sorting & Pagination
                //----------------------------------------------------

                var orders = await query

                    .OrderByDescending(x => x.OrderDate)
                    .ThenByDescending(x => x.OrderId)

                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)

                    .ToListAsync();

                //----------------------------------------------------
                // Response
                //----------------------------------------------------

                return Ok(new
                {
                    success = true,

                    sellerName,
                    isSubscribed,

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
                        completedPayments,
                        pendingPayments,
                        failedPayments,

                        pending,
                        packed,
                        shipped,
                        outForDelivery,
                        delivered,
                        cancelled,

                        returnRequested,
                        returnApproved,
                        returned,
                        refunded,

                        revenue
                    },

                    orders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = "An unexpected error occurred.",

                    error = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // =========================
        // UPDATE ORDER
        // =========================

        [Authorize]
        [HttpPut("order-items/{orderItemId}/status")]
        public async Task<IActionResult> UpdateOrderStatus(
    int orderItemId,
    [FromBody] UpdateOrderStatusDto model)
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
                        return Unauthorized(new
                        {
                            success = false,
                            message = "Seller not found."
                        });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = "Your subscription has expired. Please renew your subscription."
                        });
                    }

                    sellerId = seller.SellerId;
                }

                //--------------------------------------------------
                // Get Order
                //--------------------------------------------------

                var item = await _context.OrderItems
     .Include(x => x.Order)
         .ThenInclude(o => o.UserAddress)

     .Include(x => x.Order)
         .ThenInclude(o => o.OrderItems)

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

                //--------------------------------------------------
                // Update Payment Status (Order Level)
                //--------------------------------------------------

                if (!string.IsNullOrWhiteSpace(model.PaymentStatus))
                {
                    item.Order.PaymentStatus = model.PaymentStatus;
                    item.Order.OrderModifiedDate = DateTime.UtcNow;
                }

                //--------------------------------------------------
                // Update Item Status
                //--------------------------------------------------

                if (!isAdmin && item.SellerId != sellerId)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        success = false,
                        message = "You are not authorized to update this item."
                    });
                }



                if (!string.IsNullOrWhiteSpace(model.ItemOrderStatus))
                {
                    item.OrderItemStatus = model.ItemOrderStatus;
                }

                switch (model.ItemOrderStatus)
                {
                    case "Packed":
                        item.PackedDate = DateTime.UtcNow;
                        break;

                    case "Shipped":
                        item.ShippedDate = DateTime.UtcNow;
                        break;

                    case "OutForDelivery":
                        item.OutForDeliveryDate = DateTime.UtcNow;
                        break;

                    case "Delivered":

                        item.DeliveredDate = DateTime.UtcNow;
                        item.IsReturnEligible = true;
                        item.ReturnEligibleTill = DateTime.UtcNow.AddDays(7);

                        break;

                    case "Cancelled":

                        item.CancelledAt = DateTime.UtcNow;
                        break;
                }

                item.UpdatedAt = DateTime.UtcNow;
                item.ItemOrderModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                try
                {
                    await _sms.SendOrderStatusAsync(
                        item.Order,
                        item.OrderItemStatus);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "SMS sending failed for Order {OrderNumber}",
                        item.Order.OrderNumber);
                }

                return Ok(new
                {
                    success = true,
                    message = "Order status updated successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }


        // =========================
        // ORDER DETAILS (MODAL)
        // =========================
        [Authorize]
        [HttpGet("details/{id}")]
        public async Task<IActionResult> GetOrderDetails(
    int id)
        {
            try
            {
                var isAdmin =
                    User.IsInRole("Admin");

                var userId =
                    _userContext.GetUserId();

                int sellerId = 0;

                if (!isAdmin)
                {

                    if (!isAdmin)
                    {
                        var seller = await GetCurrentSellerAsync();

                        if (seller == null)
                        {
                            return Unauthorized(new
                            {
                                success = false,
                                message = "Seller not found."
                            });
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
                            .AnyAsync(x =>
                                x.OrderId == id &&
                                x.SellerId == sellerId);

                        if (!hasAccess)
                        {
                            return StatusCode(StatusCodes.Status403Forbidden, new
                            {
                                success = false,
                                message = "You are not authorized to view this order."
                            });
                        }
                    }
                }

                var order =
     await _context.Orders
         .AsNoTracking()
         .Include(x => x.UserAddress)
         .Include(x => x.OrderItems)
             .ThenInclude(x => x.Product)
         .Include(x => x.OrderItems)
             .ThenInclude(x => x.ProductVariant)
         .FirstOrDefaultAsync(x =>
             x.OrderId == id);

                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order not found"
                    });
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
                        //order.PaymentMethod,
                        order.GrandTotal,

                        CustomerName =
                            order.UserAddress?.FullName,

                        Phone =
                            order.UserAddress?.MobileNumber,

                        Address =
                            $"{order.UserAddress?.AddressLine1}, " +
                            $"{order.UserAddress?.AddressLine2}",

                        City =
                            order.UserAddress?.City,

                        Pincode =
                            order.UserAddress?.Pincode,

                        Items = (isAdmin
        ? order.OrderItems
        : order.OrderItems.Where(x => x.SellerId == sellerId))
    .Select(x => new
    {
        x.OrderItemId,
        x.ProductId,
        x.ProductName,

        Variant = x.ProductVariant != null
            ? x.ProductVariant.Model
            : "",

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
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        private async Task<SellerModel?> GetCurrentSellerAsync()
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Sellers
                .FirstOrDefaultAsync(x => x.UserId == userId);
        }

        private bool HasActiveSubscription(SellerModel seller)
        {
            return seller.SubscriptionEndDate.HasValue &&
                   seller.SubscriptionEndDate.Value >= DateTime.UtcNow;
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new
            {
                success = true,
                message = "Backend Updated"
            });
        }

    }


}