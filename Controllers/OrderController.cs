using DocumentFormat.OpenXml.Drawing.Charts;
using DocumentFormat.OpenXml.InkML;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using Rotativa.AspNetCore;
using System.Security.Cryptography;
using System.Text;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.ViewModels;
using VivekMedicalProducts.DTOs;



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


        public OrderController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext, InvoiceService invoiceService, EmailService emailService, ICartCalculationService calc)
        {
            _config = config;
            _context = context;
            _userContext = userContext;
            _invoiceService = invoiceService;
            _emailService = emailService;
            _calc = calc;
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
        public async Task<IActionResult> PlaceCOD(
     [FromBody] CheckoutViewModel model)
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

                // Address
                var checkoutSession = await _context.CheckoutSessions
    .FirstOrDefaultAsync(x =>
        x.UserId == userId &&
        x.IsActive);

                if (checkoutSession == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Checkout session not found."
                    });
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

                // Cart
                var carts =
                    await _context.Carts
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                    .Where(x => x.UserId == userId)
                    .ToListAsync();

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

                    SellerId = sellerId,

                    UserAddressId = address.Id,

                    OrderNumber =
                        $"ORD-{DateTime.UtcNow.Ticks}",

                    GrandTotal =
                        totals.Total,

                    Currency = "INR",

                    OrderStatus = "Placed",

                    PaymentStatus = "Cash On Delivery",

                    IsPaymentVerified = false,

                    PaymentVerifiedAt = null,

                    OrderDate = DateTime.UtcNow,

                    OrderModifiedDate = DateTime.UtcNow,

                    CreatedBy = userId,

                    IpAddress =
                        HttpContext.Connection
                            .RemoteIpAddress?
                            .ToString(),

                    UserAgent =
                        Request.Headers["User-Agent"]
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

                        ProductId = item.ProductId,

                        ProductVariantId = item.ProductVariantId,

                        ProductName = item.Product?.Name ?? "",

                        Quantity = item.Quantity,

                        Price = Math.Round(originalPrice, 2),

                        DiscountAmount =
                            Math.Round(discountAmount, 2),

                        TaxableAmount =
                            Math.Round(taxableAmount, 2),

                        GSTPercentage = gstPercent,

                        GSTAmount =
                            Math.Round(gstAmount, 2),

                        CouponDiscountAmount =
                            Math.Round(couponShare, 2),

                        FinalPaidAmount =
                            Math.Round(finalPaidAmount, 2),

                        LineTotal =
                            Math.Round(finalPaidAmount, 2),

                        SellerId = item.SellerId,

                        ItemStatus = "Placed",

                        CreatedAt = DateTime.UtcNow
                    };

                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                // Clear Cart
                _context.Carts.RemoveRange(carts);

                // Commit transaction
                await transaction.CommitAsync();

                // Clear Coupon
                _context.CheckoutSessions.Remove(checkoutSession);

                await _context.SaveChangesAsync();
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

                    orderStatus = order.OrderStatus,

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
        public async Task<IActionResult> CreateOrder(
     [FromBody] CheckoutViewModel model)
        {
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

                var checkoutSession = await _context.CheckoutSessions
    .FirstOrDefaultAsync(x =>
        x.UserId == userId &&
        x.IsActive);

                if (checkoutSession == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Checkout session not found."
                    });
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

                // Cart
                var carts = await _context.Carts
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                    .Where(x => x.UserId == userId)
                    .ToListAsync();

                if (!carts.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Cart is empty"
                    });
                }

                // Totals
                var totals = await _calc.CalculateAsync(
    userId,
    null,
    checkoutSession.CouponCode);

                if (totals.Total != checkoutSession.GrandTotal)
                {
                    checkoutSession.GrandTotal = totals.Total;
                    checkoutSession.SubTotal = totals.Subtotal;
                    checkoutSession.GSTAmount = totals.GST;
                    checkoutSession.CouponDiscount = totals.CouponDiscount;
                    checkoutSession.ShippingCharge = totals.Delivery;

                    await _context.SaveChangesAsync();
                }

                var amountInPaise =
                    (int)Math.Round(totals.Total * 100);

                var client = new RazorpayClient(
                    _config["Razorpay:Key"],
                    _config["Razorpay:Secret"]);

                var receipt =
                    $"ORD-{DateTime.UtcNow.Ticks}";

                var razorpayOrder =
                    client.Order.Create(
                        new Dictionary<string, object>
                        {
                    { "amount", amountInPaise },
                    { "currency", "INR" },
                    { "receipt", receipt }
                        });

                var razorpayOrderId =
                    razorpayOrder["id"].ToString();

                // Remove any old pending session
                var oldSession =
                    await _context.PaymentSessions
                    .FirstOrDefaultAsync(x =>
                        x.UserId == userId &&
                        !x.IsCompleted);

                if (oldSession != null)
                {
                    oldSession.IsCompleted = true;
                    oldSession.PaymentStatus = "Cancelled";
                    oldSession.FailureReason = "Superseded by new payment session";
                }

                // Save Payment Session

                var session = new PaymentSession
                {
                    CheckoutSessionId = checkoutSession.Id,

                    RazorpayOrderId = razorpayOrderId,

                    UserId = userId,

                    Amount = checkoutSession.GrandTotal,

                    Currency = checkoutSession.Currency,

                    CreatedDate = DateTime.UtcNow,

                    ExpiryDate = DateTime.UtcNow.AddMinutes(30),

                    IsCompleted = false,

                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),

                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.PaymentSessions.Add(session);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,

                    paymentSessionId = session.Id,

                    razorpayOrderId,

                    amount = amountInPaise,

                    razorpayKey = _config["Razorpay:Key"]
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
            using var transaction =
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
                        redirect = "/my-orders"
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
                var checkoutSession = await _context.CheckoutSessions
                    .FirstOrDefaultAsync(x =>
                        x.Id == session.CheckoutSessionId &&
                        x.IsActive);

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
                var carts = await _context.Carts
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                    .Where(x => x.UserId == userId)
                    .ToListAsync();

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

                var sellerId = carts.First().SellerId;

                // Create Order
                var order =
                    new OrderModel
                    {
                        UserId = userId,

                        SellerId = sellerId,

                        UserAddressId = address.Id,

                        OrderNumber =
                            $"ORD-{DateTime.UtcNow.Ticks}",

                        GrandTotal = checkoutSession.GrandTotal,

                        Currency = checkoutSession.Currency,

                        PaymentStatus = "Completed",

                        OrderStatus = "Placed",

                        RazorpayOrderId =
                            model.razorpay_order_id,

                        RazorpayPaymentId =
                            model.razorpay_payment_id,

                        RazorpaySignature =
                            model.razorpay_signature,

                        PaymentVerifiedAt =
                            DateTime.UtcNow,

                        IsPaymentVerified = true,

                        OrderDate =
                            DateTime.UtcNow,

                        OrderModifiedDate =
                            DateTime.UtcNow,

                        CreatedBy = userId,

                        IpAddress =
                            HttpContext.Connection
                                .RemoteIpAddress?
                                .ToString(),

                        UserAgent =
                            Request.Headers["User-Agent"]
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

                        ProductId = item.ProductId,

                        ProductVariantId = item.ProductVariantId,

                        ProductName = item.Product?.Name ?? "",

                        Quantity = item.Quantity,

                        Price = Math.Round(originalPrice, 2),

                        DiscountAmount =
                            Math.Round(discountAmount, 2),

                        TaxableAmount =
                            Math.Round(taxableAmount, 2),

                        GSTPercentage = gstPercent,

                        GSTAmount =
                            Math.Round(gstAmount, 2),

                        CouponDiscountAmount =
                            Math.Round(couponShare, 2),

                        FinalPaidAmount =
                            Math.Round(finalPaidAmount, 2),

                        LineTotal =
                            Math.Round(finalPaidAmount, 2),

                        SellerId = item.SellerId,

                        ItemStatus = "Placed",

                        CreatedAt = DateTime.UtcNow
                    };

                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                _context.Carts.RemoveRange(carts);

                session.IsCompleted = true;
                session.PaymentStatus = "Completed";
                session.PaymentCompletedDate = DateTime.UtcNow;

                checkoutSession.IsActive = false;

                _context.Carts.RemoveRange(carts);

                await _context.SaveChangesAsync();

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

                    redirect = "/my-orders"
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

        [HttpGet("check-payment-status/{razorpayOrderId}")]
        public async Task<IActionResult> CheckPaymentStatus(string razorpayOrderId)
        {
            var session = await _context.PaymentSessions
                .FirstOrDefaultAsync(x =>
                    x.RazorpayOrderId == razorpayOrderId);

            if (session == null)
            {
                return Ok(new
                {
                    success = false,
                    message = "Payment session not found"
                });
            }

            if (!session.IsCompleted)
            {
                return Ok(new
                {
                    success = false,
                    paymentStatus = session.PaymentStatus,
                    message = "Payment is still processing"
                });
            }

            var order = await _context.Orders
                .FirstOrDefaultAsync(x =>
                    x.RazorpayOrderId == razorpayOrderId);

            if (order == null)
            {
                return Ok(new
                {
                    success = false,
                    paymentStatus = session.PaymentStatus,
                    message = "Order is being created"
                });
            }

            return Ok(new
            {
                success = true,
                orderId = order.OrderId,
                paymentStatus = order.PaymentStatus,
                orderStatus = order.OrderStatus
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

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Please login to view orders.",
                        redirect = "/login"
                    });
                }

                var orders = await _context.Orders
                    .AsNoTracking()
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.Product)
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Images)
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        orderNumber = o.OrderNumber,
                        orderDate = o.OrderDate,

                        grandTotal = o.GrandTotal,
                        orderStatus = o.OrderStatus,
                        paymentStatus = o.PaymentStatus,

                        itemCount =
                            o.OrderItems.Count,

                        items =
                            o.OrderItems.Select(i => new
                            {
                                productId =
                                    i.ProductId,

                                variantId =
                                    i.ProductVariantId,

                                productName =
                                    i.ProductName,

                                variantName =
                                    i.ProductVariant != null
                                        ? i.ProductVariant.Model
                                        : "",

                                productImage =
                                    i.ProductVariant != null &&
                                    i.ProductVariant.Images.Any()
                                        ? i.ProductVariant.Images
                                            .OrderBy(x =>
                                                x.DisplayOrder)
                                            .Select(x =>
                                                x.ImageUrl)
                                            .FirstOrDefault()
                                        : !string.IsNullOrEmpty(
                                            i.Product.ImageUrl)
                                            ? i.Product.ImageUrl
                                            : "/images/no-image.png",

                                productImages =
                                    i.ProductVariant != null
                                        ? i.ProductVariant.Images
                                            .OrderBy(x =>
                                                x.DisplayOrder)
                                            .Select(x =>
                                                x.ImageUrl)
                                            .ToList()
                                        : new List<string>(),

                                quantity =
                                    i.Quantity,

                                price =
                                    i.Price,

                                finalPaidAmount =
                                    i.FinalPaidAmount,

                                itemTotal =
                                    i.LineTotal
                            }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    orders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Failed to load orders.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }


        [Authorize]
        [HttpGet("invoice/{id}")]
        public async Task<IActionResult> Invoice(int id)
        {
            try
            {
                var userId =
                    _userContext.GetUserId();

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
                        message = "Order not found"
                    });
                }

                if (
                    order.PaymentStatus != "Completed" ||
                    order.OrderStatus != "Placed"
                )
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invoice available after successful payment"
                    });
                }

                var model =
                    BuildInvoiceModel(order);

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
                    message = ex.Message
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

            decimal subtotal =
     order.OrderItems.Sum(x =>
         x.Price * x.Quantity);

            decimal productDiscount =
                order.OrderItems.Sum(x =>
                    x.DiscountAmount * x.Quantity);

            decimal taxableAmount =
                order.OrderItems.Sum(x =>
                    x.TaxableAmount);

            decimal couponDiscount =
                order.OrderItems.Sum(x =>
                    x.CouponDiscountAmount);

            decimal gstTotal =
                order.OrderItems.Sum(x =>
                    x.GSTAmount);

            decimal finalPaid =
                order.OrderItems.Sum(x =>
                    x.FinalPaidAmount);

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

                PaymentId = order.RazorpayPaymentId ?? "",

                OrderStatus = order.OrderStatus ?? "",

                SubTotal = subtotal,

                DiscountTotal = productDiscount,

                TaxableAmount = taxableAmount,

                CouponDiscount = couponDiscount,

                GSTTotal = gstTotal,

                FinalPaidAmount = finalPaid,

                GrandTotal = order.GrandTotal,

                Items = order.OrderItems.Select(item =>
    new InvoiceItemViewModel
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
            item.LineTotal
    }).ToList()
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
                    var userId = _userContext.GetUserId();

                    var seller = await _context.Sellers
                        .FirstOrDefaultAsync(x =>
                            x.UserId == userId);

                    if (seller == null)
                    {
                        return NotFound(new
                        {
                            success = false,
                            message = "Seller not found"
                        });
                    }

                    if (seller.SubscriptionEndDate == null ||
                        seller.SubscriptionEndDate < DateTime.UtcNow)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Your subscription expired. Please upgrade."
                        });
                    }

                    sellerId = seller.SellerId;
                    sellerName = seller.BusinessName ?? "Seller";
                }

                var query =
                    from i in _context.OrderItems
                    join o in _context.Orders
                        on i.OrderId equals o.OrderId
                    join p in _context.Products
                        on i.ProductId equals p.Id
                    join u in _context.Users
                        on o.UserId equals u.Id
                    select new AdminOrderModel
                    {
                        OrderId = o.OrderId,
                        OrderItemId = i.OrderItemId,
                        OrderDate = o.OrderDate,

                        Customer =
                            !string.IsNullOrEmpty(u.CustomerName)
                                ? u.CustomerName
                                : u.UserName,

                        ProductName = p.Name,
                        Quantity = i.Quantity,
                        GrandTotal = o.GrandTotal,

                        RazorpayPaymentId =
                            o.RazorpayPaymentId ?? "-",

                        PaymentStatus =
                            o.PaymentStatus ?? "Pending",

                        OrderStatus =
                            o.OrderStatus ?? "Pending",

                        SellerId = i.SellerId
                    };

                // Seller Filter
                if (!isAdmin)
                {
                    query = query.Where(x =>
                        x.SellerId == sellerId);
                }

                // Search
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
                        x.OrderId
                            .ToString()
                            .Contains(search));
                }

                // Date Filters
                if (fromDate.HasValue)
                {
                    var from = fromDate.Value.Date;

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

                // Payment Status
                if (!string.IsNullOrWhiteSpace(paymentStatus))
                {
                    query = query.Where(x =>
                        x.PaymentStatus == paymentStatus);
                }

                // Order Status
                if (!string.IsNullOrWhiteSpace(orderStatus))
                {
                    query = query.Where(x =>
                        x.OrderStatus == orderStatus);
                }

                // Stats
                var totalOrders =
    await query
        .Select(x => x.OrderId)
        .Distinct()
        .CountAsync();

                var completed =
    await query
        .Where(x =>
            x.PaymentStatus ==
            "Completed")
        .Select(x => x.OrderId)
        .Distinct()
        .CountAsync();

                var pending =
    await query
        .Where(x =>
            x.PaymentStatus ==
            "Pending")
        .Select(x => x.OrderId)
        .Distinct()
        .CountAsync();

                var cancelled =
    await query
        .Where(x =>
            x.OrderStatus ==
            "Cancelled")
        .Select(x => x.OrderId)
        .Distinct()
        .CountAsync();

                var revenue =
    await query
        .Where(x =>
            x.PaymentStatus ==
            "Completed")
        .GroupBy(x => x.OrderId)
        .Select(g =>
            g.First().GrandTotal ?? 0)
        .SumAsync();

                // Recent Orders First
                var orders =
                    await query
                        .OrderByDescending(x =>
                            x.OrderDate)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                return Ok(new
                {
                    success = true,
                    sellerName,
                    isSubscribed,

                    page,
                    pageSize,

                    totalOrders,
                    completed,
                    pending,
                    cancelled,
                    revenue,

                    orders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message,
                    stack = ex.StackTrace
                });
            }
        }

        // =========================
        // UPDATE ORDER
        // =========================

        [Authorize]
        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult>
 UpdateOrderStatus(
     int id,
     [FromBody]
    UpdateOrderStatusDto model)
        {
            try
            {
                var isAdmin =
                    User.IsInRole("Admin");

                int sellerId = 0;

                if (!isAdmin)
                {
                    var userId =
                        _userContext.GetUserId();

                    var seller =
                        await _context.Sellers
                            .FirstOrDefaultAsync(
                                x =>
                                    x.UserId ==
                                    userId);

                    if (seller == null)
                    {
                        return Unauthorized(
                            new
                            {
                                success = false,
                                message =
                                    "Seller not found"
                            });
                    }

                    sellerId =
                        seller.SellerId;

                    var hasAccess =
                        await _context
                            .OrderItems
                            .AnyAsync(x =>
                                x.OrderId == id &&
                                x.SellerId ==
                                sellerId);

                    if (!hasAccess)
                    {
                        return Unauthorized(
                            new
                            {
                                success = false,
                                message =
                                    "Access denied"
                            });
                    }
                }

                var order =
                    await _context.Orders
                        .FirstOrDefaultAsync(
                            x =>
                                x.OrderId ==
                                id);

                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message =
                            "Order not found"
                    });
                }

                order.PaymentStatus =
                    model.PaymentStatus;

                order.OrderStatus =
                    model.OrderStatus;

                order.OrderModifiedDate =
                    DateTime.UtcNow;

                await _context
                    .SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Order updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message,
                    inner =
                        ex.InnerException?.Message
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
                    var seller =
                        await _context.Sellers
                            .FirstOrDefaultAsync(s =>
                                s.UserId == userId);

                    if (seller == null)
                    {
                        return Unauthorized(new
                        {
                            success = false,
                            message = "Seller not found"
                        });
                    }

                    sellerId = seller.SellerId;

                    var hasAccess =
                        await _context.OrderItems
                            .AnyAsync(x =>
                                x.OrderId == id &&
                                x.SellerId == sellerId);

                    if (!hasAccess)
                    {
                        return Unauthorized(new
                        {
                            success = false,
                            message = "Access denied"
                        });
                    }
                }

                var order =
                    await _context.Orders
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
                        order.OrderStatus,
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

                        Items =
                            order.OrderItems
                                .Select(x => new
                                {
                                    x.OrderItemId,
                                    x.ProductId,
                                    x.ProductName,

                                    Variant =
                                        x.ProductVariant != null
                                            ? x.ProductVariant.Model
                                            : "",

                                    x.Quantity,
                                    x.Price,
                                    x.LineTotal,
                                    x.ItemStatus
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

    }
}