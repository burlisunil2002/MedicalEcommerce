using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;

    public SellerController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        EmailService emailService)
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _emailService = emailService;
    }

    // =========================================================
    // REGISTER
    // =========================================================

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] SellerRegisterViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                errors = ModelState
            });
        }

        var existing = await _userManager.FindByEmailAsync(model.Email);

        if (existing != null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Email already registered."
            });
        }

        using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email
            };

            var result =
                await _userManager.CreateAsync(
                    user,
                    model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Errors
                        .Select(x => x.Description)
                });
            }

            await _userManager.AddToRoleAsync(
                user,
                "Seller");

            var seller = new SellerModel
            {
                UserId = user.Id,

                BusinessName = model.BusinessName,
                OwnerName = model.OwnerName,
                ProductType = model.ProductType,
                Brand = model.Brand,

                Email = model.Email,
                Phone = model.Phone,

                GSTNumber = model.GSTNumber,
                IsGSTVerified = true,

                PAN = model.PAN,
                IsPANVerified = true,

                AddressLine1 = model.AddressLine1,
                City = model.City,
                State = model.State,
                Pincode = model.Pincode,

                AccountHolderName = model.AccountHolderName,
                AccountNumber = model.AccountNumber,
                IFSCCode = model.IFSCCode,
                BankName = model.BankName,

                Status = "Active",
                IsActive = true,

                CreatedAt = DateTime.UtcNow
            };

            _context.Sellers.Add(seller);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                message = "Seller registered successfully.",
                redirectUrl = "/subscription"
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    // =========================================================
    // LOGIN
    // =========================================================

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] SellerLoginRequest model)
    {
        await _signInManager.SignOutAsync();

        var user =
            await _userManager.FindByEmailAsync(model.Email);

        if (user == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "User not found."
            });
        }

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == user.Id);

        if (seller == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Seller account not found."
            });
        }

        var result =
            await _signInManager.PasswordSignInAsync(
                user.UserName!,
                model.Password,
                false,
                false);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Invalid email or password."
            });
        }

        if (seller.SubscriptionEndDate == null ||
            seller.SubscriptionEndDate <= DateTime.UtcNow)
        {
            return Ok(new
            {
                success = true,
                subscribed = false,
                redirectUrl = "/subscription"
            });
        }

        return Ok(new
        {
            success = true,
            subscribed = true,

            seller = new
            {
                sellerId = seller.SellerId,
                businessName = seller.BusinessName,
                ownerName = seller.OwnerName,
                email = seller.Email,
                status = seller.Status,
                subscriptionEnd = seller.SubscriptionEndDate
            },

            redirectUrl = "/seller/dashboard"
        });
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    [AllowAnonymous]
    [HttpPost("seller-forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] SellerForgotPasswordDto model)
    {
        try
        {
            var seller =
                await _context.Sellers
                    .FirstOrDefaultAsync(
                        x => x.Email == model.Email);

            if (seller == null)
            {
                return Ok(new
                {
                    success = true,
                    message =
                        "If the email is registered, a password reset link has been sent."
                });
            }

            var user =
                await _userManager.FindByIdAsync(
                    seller.UserId);

            if (user == null)
            {
                return Ok(new
                {
                    success = true,
                    message =
                        "If the email is registered, a password reset link has been sent."
                });
            }

            var token =
                await _userManager
                    .GeneratePasswordResetTokenAsync(user);

            var frontend =
                _configuration["Frontend:BaseUrl"];

            var resetLink =
                $"{frontend}/seller-reset-password" +
                $"?email={Uri.EscapeDataString(seller.Email)}" +
                $"&token={Uri.EscapeDataString(token)}";

            await _emailService.SendPasswordResetEmail(
                seller.Email,
                seller.BusinessName,
                resetLink);

            return Ok(new
            {
                success = true,
                message =
                    "If the email is registered, a password reset link has been sent."
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

    // =========================================================
    // RESET PASSWORD
    // =========================================================

    [AllowAnonymous]
    [HttpPost("seller-reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] SellerResetPasswordDto model)
    {
        try
        {
            if (model.NewPassword != model.ConfirmPassword)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Passwords do not match."
                });
            }

            var seller =
                await _context.Sellers
                    .FirstOrDefaultAsync(
                        x => x.Email == model.Email);

            if (seller == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request."
                });
            }

            var user =
                await _userManager.FindByIdAsync(
                    seller.UserId);

            if (user == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "User not found."
                });
            }

            var result =
                await _userManager.ResetPasswordAsync(
                    user,
                    model.Token,
                    model.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    errors = result.Errors
                        .Select(x => x.Description)
                });
            }

            return Ok(new
            {
                success = true,
                message = "Password updated successfully."
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

    // =========================================================
    // SELLER DASHBOARD
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var userId = _userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Please login."
            });
        }

        var seller =
            await _context.Sellers
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Seller not found."
            });
        }

        var sellerId = seller.SellerId;

        // -----------------------------------------------------
        // PRODUCTS
        // -----------------------------------------------------

        var totalProducts =
            await _context.Products
                .CountAsync(x =>
                    x.SellerId == sellerId);

        // -----------------------------------------------------
        // SELLER ORDER ITEMS
        // -----------------------------------------------------

        var sellerItems =
            _context.OrderItems
                .AsNoTracking()
                .Where(x =>
                    x.SellerId == sellerId);

        // -----------------------------------------------------
        // TOTAL ORDERS
        // Distinct OrderId
        // -----------------------------------------------------

        var totalOrders =
            await sellerItems
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        // -----------------------------------------------------
        // TOTAL ORDER ITEMS
        // -----------------------------------------------------

        var totalOrderItems =
            await sellerItems.CountAsync();

        // -----------------------------------------------------
        // COMPLETED
        //
        // Payment Completed
        // AND
        // Item Delivered
        // -----------------------------------------------------

        var completedItems =
            await sellerItems.CountAsync(x =>
                x.Order.PaymentStatus == "Completed" &&
                x.OrderItemStatus == "Delivered");

        // -----------------------------------------------------
        // PENDING
        // Everything not completed
        // -----------------------------------------------------

        var pendingItems =
            totalOrderItems - completedItems;

        // -----------------------------------------------------
        // CUSTOMERS
        // Distinct customers who purchased seller products
        // -----------------------------------------------------

        var customers =
            await sellerItems
                .Select(x => x.Order.UserId)
                .Where(x => x != null)
                .Distinct()
                .CountAsync();

        // -----------------------------------------------------
        // LOW STOCK
        //
        // Uses Product.StockQuantity.
        // If your model uses a different property, change
        // StockQuantity here only.
        // -----------------------------------------------------

        /*var lowStock =
            await _context.Products
                .CountAsync(x =>
                    x.SellerId == sellerId &&
                    x.StockQuantity <= 5);*/

        // -----------------------------------------------------
        // REVENUE
        //
        // ONLY:
        // Payment Completed
        // AND
        // Delivered
        // -----------------------------------------------------

        var revenue =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Completed" &&
                    x.OrderItemStatus == "Delivered")
                .SumAsync(x =>
                    (decimal?)x.FinalPaidAmount) ?? 0m;

        // -----------------------------------------------------
        // PAYMENT STATISTICS
        // Distinct Orders
        // -----------------------------------------------------

        var cashOnDelivery =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Cash On Delivery")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var completedPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Completed")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var initiatedPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Initiated")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var pendingPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Pending")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var failedPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Failed")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var refundedPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Refunded")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var refundPendingPayments =
           await sellerItems
               .Where(x =>
                   x.Order.PaymentStatus == "Refund Pending")
               .Select(x => x.OrderId)
               .Distinct()
               .CountAsync();

        var cancelledPayments =
            await sellerItems
                .Where(x =>
                    x.Order.PaymentStatus == "Cancelled")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        // -----------------------------------------------------
        // DELIVERY STATISTICS
        // -----------------------------------------------------


        var placedItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Placed");

        var acceptedItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Accepted");

        var packedItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Packed");

        var shippedItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Shipped");

        var outForDeliveryItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "OutForDelivery");

        var deliveredItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Delivered");

        var cancelledItems =
            await sellerItems.CountAsync(x =>
                x.OrderItemStatus == "Cancelled");

        // -----------------------------------------------------
        // RETURN STATISTICS
        // -----------------------------------------------------

        var returnRequested =
            await sellerItems.CountAsync(x =>
                x.ReturnStatus == "Requested");

        var returnApproved =
            await sellerItems.CountAsync(x =>
                x.ReturnStatus == "Approved");

        var returned =
            await sellerItems.CountAsync(x =>
                x.ReturnStatus == "Returned");

        var refunded =
            await sellerItems.CountAsync(x =>
                x.ReturnStatus == "Refunded");

        // -----------------------------------------------------
        // GROWTH
        //
        // Compare current 30 days with previous 30 days.
        // Based on completed + delivered seller revenue.
        // -----------------------------------------------------

        var today = DateTime.UtcNow.Date;

        var currentPeriodStart =
            today.AddDays(-30);

        var previousPeriodStart =
            today.AddDays(-60);

        var currentRevenue =
            await sellerItems
                .Where(x =>
                    x.Order.OrderDate >= currentPeriodStart &&
                    x.Order.OrderDate < today.AddDays(1) &&
                    x.Order.PaymentStatus == "Completed" &&
                    x.OrderItemStatus == "Delivered")
                .SumAsync(x =>
                    (decimal?)x.FinalPaidAmount) ?? 0m;

        var previousRevenue =
            await sellerItems
                .Where(x =>
                    x.Order.OrderDate >= previousPeriodStart &&
                    x.Order.OrderDate < currentPeriodStart &&
                    x.Order.PaymentStatus == "Completed" &&
                    x.OrderItemStatus == "Delivered")
                .SumAsync(x =>
                    (decimal?)x.FinalPaidAmount) ?? 0m;

        decimal? growth = null;

        if (previousRevenue > 0)
        {
            growth =
                Math.Round(
                    ((currentRevenue - previousRevenue) /
                     previousRevenue) * 100m,
                    2);
        }
        else if (currentRevenue > 0)
        {
            growth = 100m;
        }

        // -----------------------------------------------------
        // SUBSCRIPTION
        // -----------------------------------------------------

        var isSubscribed =
            seller.SubscriptionEndDate.HasValue &&
            seller.SubscriptionEndDate.Value >= DateTime.UtcNow;

        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        return Ok(new
        {
            success = true,

            sellerId = sellerId,

            sellerName = seller.BusinessName,

            totalProducts,

            totalOrders,

            totalOrderItems,

            customers,

            completed = completedItems,

            pendingOrders = pendingItems,

            revenue,

            growth,

            subscriptionEnd =
                seller.SubscriptionEndDate,

            isSubscribed,

            payment = new
            {
                cod = cashOnDelivery,
                completed = completedPayments,
                initiated = initiatedPayments,
                pending = pendingPayments,
                failed = failedPayments,
                refunded = refundedPayments,
                refundpending = refundPendingPayments,
                cancelled = cancelledPayments
            },

            delivery = new
            {
                placed = placedItems,
                accepted = acceptedItems,
                packed = packedItems,
                shipped = shippedItems,
                outForDelivery = outForDeliveryItems,
                delivered = deliveredItems,
                cancelled = cancelledItems
            },

            returns = new
            {
                requested = returnRequested,
                approved = returnApproved,
                returned,
                refunded
            }
        });
    }

    // =========================================================
    // PROFILE
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("profile")]
    public async Task<IActionResult> Profile()
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound(new
            {
                success = false
            });
        }

        return Ok(new
        {
            success = true,
            seller
        });
    }

    // =========================================================
    // STATISTICS
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("statistics")]
    public async Task<IActionResult> Statistics()
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        var items =
            _context.OrderItems
                .AsNoTracking()
                .Where(x =>
                    x.SellerId == seller.SellerId);

        var totalItems =
            await items.CountAsync();

        var totalOrders =
            await items
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var completed =
            await items.CountAsync(x =>
                x.Order.PaymentStatus == "Completed" &&
                x.OrderItemStatus == "Delivered");

        var pending =
            totalItems - completed;

        var revenue =
            await items
                .Where(x =>
                    x.Order.PaymentStatus == "Completed" &&
                    x.OrderItemStatus == "Delivered")
                .SumAsync(x =>
                    (decimal?)x.FinalPaidAmount) ?? 0m;

        return Ok(new
        {
            success = true,

            products =
                await _context.Products.CountAsync(
                    x => x.SellerId == seller.SellerId),

            totalOrders,

            totalOrderItems = totalItems,

            completed,

            pending,

            revenue,

            activeSubscription =
                seller.SubscriptionEndDate >=
                DateTime.UtcNow
        });
    }

    // =========================================================
    // SUBSCRIPTION
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("subscription")]
    public async Task<IActionResult> Subscription()
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            success = true,

            isSubscribed =
                seller.SubscriptionEndDate >
                DateTime.UtcNow,

            subscriptionEnd =
                seller.SubscriptionEndDate
        });
    }

    // =========================================================
    // PRODUCT LIMIT
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("product-limit")]
    public async Task<IActionResult> ProductLimit()
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        var sub =
            await _context.Subscriptions
                .Where(x =>
                    x.SellerId == seller.SellerId &&
                    x.Status == "Active")
                .OrderByDescending(
                    x => x.CreatedDate)
                .FirstOrDefaultAsync();

        int limit = sub?.ProductRange switch
        {
            "1-5" => 5,
            "6-10" => 10,
            "11-15" => 15,
            "16-20" => 20,
            "20+" => 999,
            _ => 0
        };

        var currentProducts =
            await _context.Products
                .CountAsync(x =>
                    x.SellerId == seller.SellerId);

        return Ok(new
        {
            success = true,
            productLimit = limit,
            currentProducts
        });
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();

        return Ok(new
        {
            success = true,
            message = "Logged out successfully."
        });
    }

    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] SellerRegisterViewModel model)
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Seller not found."
            });
        }

        seller.BusinessName = model.BusinessName;
        seller.OwnerName = model.OwnerName;
        seller.Brand = model.Brand;
        seller.Phone = model.Phone;
        seller.AddressLine1 = model.AddressLine1;
        seller.City = model.City;
        seller.State = model.State;
        seller.Pincode = model.Pincode;
        seller.BankName = model.BankName;
        seller.AccountHolderName =
            model.AccountHolderName;
        seller.AccountNumber =
            model.AccountNumber;
        seller.IFSCCode =
            model.IFSCCode;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Profile updated successfully."
        });
    }

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest model)
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var result =
            await _userManager.ChangePasswordAsync(
                user,
                model.CurrentPassword,
                model.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                success = false,
                errors = result.Errors
                    .Select(x => x.Description)
            });
        }

        return Ok(new
        {
            success = true,
            message = "Password changed successfully."
        });
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount()
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return NotFound();
        }

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == user.Id);

        if (seller != null)
        {
            _context.Sellers.Remove(seller);
        }

        await _userManager.DeleteAsync(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Seller account deleted."
        });
    }

    // =========================================================
    // SELLER PRODUCTS
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpGet("products")]
    public async Task<IActionResult> GetSellerProducts()
    {
        var userId = _userManager.GetUserId(User);

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return Unauthorized();
        }

        var products =
            await _context.Products
                .Where(x =>
                    x.SellerId == seller.SellerId)
                .OrderByDescending(
                    x => x.CreatedDate)
                .ToListAsync();

        return Ok(products);
    }

    // =========================================================
    // SELLER ORDERS
    // =========================================================

    [Authorize(Roles = "Seller")]

    [HttpGet("orders")]
    public async Task<IActionResult> GetSellerOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? paymentStatus = null,
        [FromQuery] string? orderStatus = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        if (page < 1)
            page = 1;

        if (pageSize < 1 || pageSize > 100)
            pageSize = 20;

        var userId = _userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Please login."
            });
        }

        var seller = await _context.Sellers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Seller account not found."
            });
        }

        var sellerId = seller.SellerId;

        // =====================================================
        // BASE QUERY
        // One row = one seller order item.
        // =====================================================

        var query =
            from item in _context.OrderItems.AsNoTracking()
            join order in _context.Orders.AsNoTracking()
                on item.OrderId equals order.OrderId
            join product in _context.Products.AsNoTracking()
                on item.ProductId equals product.Id into productJoin
            from product in productJoin.DefaultIfEmpty()
            where item.SellerId == sellerId
            select new
            {
                OrderItemId = item.OrderItemId,
                OrderId = item.OrderId,
                OrderNumber = order.OrderNumber,
                OrderDate = order.OrderDate,

                CustomerId = order.UserId,

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

                OrderStatus = item.OrderItemStatus ?? "Placed",

                SellerId = item.SellerId,
                SellerName = seller.BusinessName,

                GrandTotal = order.GrandTotal,

                ReturnStatus = item.ReturnStatus,
                IsReturnEligible = item.IsReturnEligible,
                ReturnEligibleTill = item.ReturnEligibleTill,

                TrackingNumber = item.TrackingNumber,
                CourierPartner = item.CourierPartner,

                PackedDate = item.PackedDate,
                ShippedDate = item.ShippedDate,
                OutForDeliveryDate = item.OutForDeliveryDate,
                DeliveredDate = item.DeliveredDate,
                CancelledAt = item.CancelledAt
            };

        // =====================================================
        // SEARCH
        // Order number + IDs + product + tracking + courier
        // =====================================================

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchValue = search.Trim().ToLower();

            query = query.Where(x =>
                (x.ProductName ?? "").ToLower().Contains(searchValue) ||
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
            query = query.Where(x =>
                x.PaymentStatus == paymentStatus.Trim());
        }

        // =====================================================
        // ITEM STATUS FILTER
        // =====================================================

        if (!string.IsNullOrWhiteSpace(orderStatus))
        {
            query = query.Where(x =>
                x.OrderStatus == orderStatus.Trim());
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
                .Where(x => statuses.Contains(
                    x.Status ?? "",
                    StringComparer.OrdinalIgnoreCase))
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
        // Same filters/search as the current seller view.
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
                Refunded = g.Count(x => x.ReturnStatus == "Refunded"),

                COD = g.Count(x =>
                    x.PaymentStatus == "Cash On Delivery" ||
                    x.PaymentStatus == "COD"),

                Initiated = g.Count(x =>
                    x.PaymentStatus == "Initiated"),

                PaymentPending = g.Count(x =>
                    x.PaymentStatus == "Pending"),

                PaymentCompleted = g.Count(x =>
                    x.PaymentStatus == "Completed"),

                PaymentFailed = g.Count(x =>
                    x.PaymentStatus == "Failed"),

                RefundPending = g.Count(x =>
                    x.PaymentStatus == "Refund Pending"),

                PaymentRefunded = g.Count(x =>
                    x.PaymentStatus == "Refunded"),

                PaymentCancelled = g.Count(x =>
                    x.PaymentStatus == "Cancelled")
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
            page = totalPages;

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

            seller = new
            {
                sellerId = seller.SellerId,
                businessName = seller.BusinessName
            },

            pagination = new
            {
                page,
                pageSize,
                totalOrders,
                totalOrderItems,
                totalItems = totalOrderItems,
                totalPages
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

    // UPDATE SELLER ORDER ITEM STATUS
    // =========================================================

    [Authorize(Roles = "Seller")]
    [HttpPut("orders/items/{orderItemId}/status")]
    public async Task<IActionResult>
        UpdateSellerOrderItemStatus(
            int orderItemId,
            [FromBody] UpdateOrderStatusDto model)
    {
        if (model == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid request."
            });
        }

        var userId =
            _userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Please login."
            });
        }

        var seller =
            await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.UserId == userId);

        if (seller == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Seller account not found."
            });
        }

        // -----------------------------------------------------
        // SUBSCRIPTION
        // -----------------------------------------------------

        if (!seller.SubscriptionEndDate.HasValue ||
            seller.SubscriptionEndDate.Value <
            DateTime.UtcNow)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    success = false,
                    message =
                        "Your subscription has expired. Please renew your subscription."
                });
        }

        // -----------------------------------------------------
        // SECURITY
        // Seller can only update own items
        // -----------------------------------------------------

        var item =
            await _context.OrderItems
                .Include(x => x.Order)
                .FirstOrDefaultAsync(x =>
                    x.OrderItemId == orderItemId &&
                    x.SellerId == seller.SellerId);

        if (item == null)
        {
            return NotFound(new
            {
                success = false,
                message =
                    "Order item not found or you are not authorized to update it."
            });
        }

        // -----------------------------------------------------
        // PAYMENT CANNOT BE CHANGED BY SELLER
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(
                model.PaymentStatus))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Seller cannot update payment status."
            });
        }

        if (string.IsNullOrWhiteSpace(
                model.ItemOrderStatus))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Order item status is required."
            });
        }

        var status =
            model.ItemOrderStatus.Trim();

        var validStatuses = new[]
        {
            "Placed",
            "Accepted",
            "Packed",
            "Shipped",
            "OutForDelivery",
            "Delivered",
            "Cancelled"
        };

        if (!validStatuses.Contains(
                status,
                StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Invalid order item status."
            });
        }

        status =
            validStatuses.First(x =>
                x.Equals(
                    status,
                    StringComparison.OrdinalIgnoreCase));

        // -----------------------------------------------------
        // DELIVERED CANNOT GO BACK
        // -----------------------------------------------------

        if (item.OrderItemStatus ==
                "Delivered" &&
            status != "Delivered")
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "A delivered item cannot be moved back to another status."
            });
        }

        // -----------------------------------------------------
        // CANCELLATION
        // -----------------------------------------------------

        if (status == "Cancelled" &&
            item.OrderItemStatus != "Placed" &&
            item.OrderItemStatus != "Accepted" &&
            item.OrderItemStatus != "Packed")
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "This item cannot be cancelled after shipment."
            });
        }

        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        var now = DateTime.UtcNow;

        item.OrderItemStatus = status;

        switch (status)
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

        item.UpdatedAt = now;
        item.ItemOrderModifiedDate = now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,

            message =
                "Order item status updated successfully.",

            orderItem = new
            {
                orderItemId =
                    item.OrderItemId,

                orderId =
                    item.OrderId,

                paymentStatus =
                    item.Order.PaymentStatus,

                orderStatus =
                    item.OrderItemStatus,

                deliveredDate =
                    item.DeliveredDate
            }
        });
    }
}