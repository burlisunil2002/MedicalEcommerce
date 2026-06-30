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

                var address = await _context.UserAddresses
                    .FirstOrDefaultAsync(x =>
                        x.Id == model.AddressId &&
                        x.UserId == userId);

                if (address == null)
                    return BadRequest("Address not found");

                var carts = await _context.Carts
                    .Include(x => x.Product)
                    .Include(x => x.ProductVariant)
                    .Where(x => x.UserId == userId)
                    .ToListAsync();

                if (!carts.Any())
                    return BadRequest("Cart is empty");

                var couponCode =
                    HttpContext.Session.GetString("CouponCode");

                var totals =
                    await _calc.CalculateAsync(
                        userId,
                        null,
                        couponCode
                    );

                // Create Order
                var order = new OrderModel
                {
                    UserId = userId,
                    SellerId = carts.First().SellerId,
                    UserAddressId = address.Id,

                    OrderNumber =
                        $"ORD-{DateTime.UtcNow.Ticks}",

                    GrandTotal = totals.Total,

                    Currency = "INR",

                    OrderStatus = "Placed",

                    PaymentStatus = "Pending",

                    OrderDate = DateTime.UtcNow,

                    CreatedBy = userId,

                    IpAddress =
                        HttpContext.Connection
                            .RemoteIpAddress
                            ?.ToString(),

                    UserAgent =
                        Request.Headers["User-Agent"]
                            .ToString()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                decimal totalTaxableAmount = carts.Sum(item =>
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

                    return finalUnitPrice * item.Quantity;
                });


                // Create Order Items
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

                        GSTPercentage =
        gstPercent,

                        GSTAmount =
        Math.Round(gstAmount, 2),

                        CouponDiscountAmount =
        Math.Round(couponShare, 2),

                        FinalPaidAmount =
        Math.Round(finalPaidAmount, 2),

                        LineTotal =
        Math.Round(finalPaidAmount, 2),

                        SellerId = item.SellerId,

                        ItemStatus = "Pending",

                        CreatedAt = DateTime.UtcNow
                    };
                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                // Clear Cart
                _context.Carts.RemoveRange(carts);

                await transaction.CommitAsync();

                // clear coupon after order success
                HttpContext.Session.Remove("CouponCode");

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    orderId = order.OrderId,
                    message = "Order placed successfully"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }


        // ================= CREATE ORDER =================
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder(
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

                // ADDRESS
                var address =
                    await _context.UserAddresses
                        .FirstOrDefaultAsync(x =>
                            x.Id == model.AddressId &&
                            x.UserId == userId);

                if (address == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Address not found"
                    });
                }

                // CART
                var carts =
                    await _context.Carts
                        .Include(c => c.Product)
                        .Include(c => c.ProductVariant)
                        .Where(c => c.UserId == userId)
                        .ToListAsync();

                if (!carts.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Cart is empty"
                    });
                }

                // TOTALS
                var totals =
                    await _calc.CalculateAsync(
                        userId,
                        null,
                        model.CouponCode
                    );

                var sellerId =
                    carts.FirstOrDefault()?.SellerId;

                // ORDER
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

                    PaymentStatus =
                        "Initiated",

                    OrderStatus =
                        "Pending",

                    OrderDate =
                        DateTime.UtcNow,

                    CreatedBy =
                        userId,

                    IpAddress =
                        HttpContext.Connection
                            .RemoteIpAddress
                            ?.ToString(),

                    UserAgent =
                        Request.Headers["User-Agent"]
                            .ToString()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                decimal totalTaxableAmount = carts.Sum(item =>
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

                    return finalUnitPrice * item.Quantity;
                });

                // ORDER ITEMS
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

                        GSTPercentage =
        gstPercent,

                        GSTAmount =
        Math.Round(gstAmount, 2),

                        CouponDiscountAmount =
        Math.Round(couponShare, 2),

                        FinalPaidAmount =
        Math.Round(finalPaidAmount, 2),

                        LineTotal =
        Math.Round(finalPaidAmount, 2),

                        SellerId = item.SellerId,

                        ItemStatus = "Pending",

                        CreatedAt = DateTime.UtcNow
                    };
                }).ToList();

                _context.OrderItems.AddRange(orderItems);
                await _context.SaveChangesAsync();

                // RAZORPAY ORDER
                var client =
                    new RazorpayClient(
                        _config["Razorpay:Key"],
                        _config["Razorpay:Secret"]
                    );

                var amountInPaise =
                    (int)(totals.Total * 100);

                var razorpayOrder =
                    client.Order.Create(
                        new Dictionary<string, object>
                        {
                    { "amount", amountInPaise },
                    { "currency", "INR" },
                    { "receipt", order.OrderNumber }
                        });

                order.RazorpayOrderId =
                    razorpayOrder["id"].ToString();

                await transaction.CommitAsync();

                await _context.SaveChangesAsync();

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
                    razorpayOrderId = order.RazorpayOrderId,
                    amount = amountInPaise,
                    razorpayKey =
                        _config["Razorpay:Key"]
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


        // ================= VERIFY PAYMENT =================
        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment(
     [FromBody] PaymentDto model)
        {
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
                        message = "Invalid payment data"
                    });
                }

                var order =
                    await _context.Orders
                        .FirstOrDefaultAsync(x =>
                            x.RazorpayOrderId ==
                            model.razorpay_order_id);

                if (order == null &&
                    model.orderId > 0)
                {
                    order =
                        await _context.Orders
                            .FindAsync(model.orderId);
                }

                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Order not found"
                    });
                }

                // prevent duplicate verification
                if (order.IsPaymentVerified)
                {
                    return Ok(new
                    {
                        success = true,
                        redirect = "/my-orders"
                    });
                }

                var secret =
                    _config["Razorpay:Secret"];

                var payload =
                    $"{model.razorpay_order_id}|{model.razorpay_payment_id}";

                using var hmac =
                    new HMACSHA256(
                        Encoding.UTF8.GetBytes(secret));

                var hash =
                    hmac.ComputeHash(
                        Encoding.UTF8.GetBytes(payload));

                var generatedSignature =
                    Convert.ToHexString(hash)
                        .ToLowerInvariant();

                if (generatedSignature !=
                    model.razorpay_signature)
                {
                    order.PaymentStatus = "Failed";
                    order.OrderStatus = "Failed";
                    order.FailureReason = "Signature mismatch";
                    order.OrderModifiedDate =
                        DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    return BadRequest(new
                    {
                        success = false,
                        message = "Payment verification failed"
                    });
                }

                // success
                order.PaymentStatus = "Completed";
                order.OrderStatus = "Placed";
                order.IsPaymentVerified = true;
                order.RazorpayPaymentId =
                    model.razorpay_payment_id;
                order.RazorpaySignature =
                    model.razorpay_signature;
                order.PaymentVerifiedAt =
                    DateTime.UtcNow;
                order.OrderModifiedDate =
                    DateTime.UtcNow;

                // clear cart
                var cartItems =
                    await _context.Carts
                        .Where(x =>
                            x.UserId == order.UserId)
                        .ToListAsync();

                if (cartItems.Any())
                {
                    _context.Carts.RemoveRange(cartItems);
                }

                await _context.SaveChangesAsync();

                // invoice email
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SendInvoiceEmailAsync(
                            order.OrderId
                        );
                    }
                    catch
                    {
                    }
                });

                return Ok(new
                {
                    success = true,
                    redirect = "/my-orders"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }

        // ================= PAYMENT FAILED =================
        [HttpPost("payment-failed/{orderId}")]
        public IActionResult PaymentFailed(int orderId)
        {
            var order = _context.Orders.Find(orderId);

            if (order != null)
            {
                order.PaymentStatus = "Failed";
                order.OrderStatus = "Failed";
                order.OrderModifiedDate = DateTime.UtcNow;

                _context.SaveChanges();
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
                var secret = _config["Razorpay:WebhookSecret"];
                if (string.IsNullOrEmpty(secret))
                    return Unauthorized();

                string body;
                using (var reader = new StreamReader(Request.Body))
                {
                    body = await reader.ReadToEndAsync();
                }

                var receivedSignature = Request.Headers["X-Razorpay-Signature"];

                var expectedSignature = ComputeHmac(body, secret);

                if (!CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(expectedSignature),
                        Encoding.UTF8.GetBytes(receivedSignature)))
                    return Unauthorized();

                dynamic data = JsonConvert.DeserializeObject(body)!;
                string eventType = data.@event;

                string razorpayOrderId = data?.payload?.payment?.entity?.order_id;

                var order = _context.Orders
                    .FirstOrDefault(o => o.RazorpayOrderId == razorpayOrderId);

                if (order == null || order.IsPaymentVerified)
                    return Ok();

                if (eventType == "payment.captured")
                {
                    order.PaymentStatus = "Completed";
                    order.OrderStatus = "Placed";
                    order.IsPaymentVerified = true;
                    order.PaymentVerifiedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    // 🔥 CLEAR CART SAFELY
                    var cartItems = await _context.Carts
                        .Where(c => c.UserId == order.UserId)
                        .ToListAsync();

                    _context.Carts.RemoveRange(cartItems);
                    await _context.SaveChangesAsync();

                    await SendInvoiceEmailAsync(order.OrderId);


                }

                return Ok();
            }
            catch
            {
                return Ok(); // prevent retry storm
            }
        }

        [HttpGet("check-payment-status/{orderId}")]
        public IActionResult CheckPaymentStatus(int orderId)
        {
            var order = _context.Orders
                .FirstOrDefault(x => x.OrderId == orderId);

            if (order == null)
            {
                return Unauthorized(new
                {
                    success = false
                });
            }

            return Ok(new
            {
                success = order.IsPaymentVerified,
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