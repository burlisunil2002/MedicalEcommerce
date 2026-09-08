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
        [FromQuery] string? orderStatus = null)
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

        var seller =
            await _context.Sellers
                .AsNoTracking()
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

        var query =
            _context.OrderItems
                .AsNoTracking()
                .Where(x =>
                    x.SellerId == seller.SellerId);

        // -----------------------------------------------------
        // SEARCH
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(item =>
                item.OrderId
                    .ToString()
                    .Contains(search) ||

                item.Product.Name
                    .Contains(search));
        }

        // -----------------------------------------------------
        // PAYMENT STATUS
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            query = query.Where(item =>
                item.Order.PaymentStatus ==
                paymentStatus);
        }

        // -----------------------------------------------------
        // ITEM STATUS
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(orderStatus))
        {
            query = query.Where(item =>
                item.OrderItemStatus ==
                orderStatus);
        }

        // -----------------------------------------------------
        // STATISTICS
        // -----------------------------------------------------

        var totalOrderItems =
            await query.CountAsync();

        var totalOrders =
            await query
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var completedItems =
            await query.CountAsync(item =>
                item.Order.PaymentStatus == "Completed" &&
                item.OrderItemStatus == "Delivered");

        var pendingItems =
            totalOrderItems -
            completedItems;

        // -----------------------------------------------------
        // PAYMENT
        // -----------------------------------------------------

        var completedPayments =
            await query
                .Where(x =>
                    x.Order.PaymentStatus ==
                    "Completed")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var pendingPayments =
            await query
                .Where(x =>
                    x.Order.PaymentStatus ==
                    "Pending")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var failedPayments =
            await query
                .Where(x =>
                    x.Order.PaymentStatus ==
                    "Failed")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        var refundedPayments =
            await query
                .Where(x =>
                    x.Order.PaymentStatus ==
                    "Refunded")
                .Select(x => x.OrderId)
                .Distinct()
                .CountAsync();

        // -----------------------------------------------------
        // DELIVERY
        // -----------------------------------------------------

        var placedItems =
            await query.CountAsync(x =>
                x.OrderItemStatus == "Placed");

        var acceptedItems =
            await query.CountAsync(x =>
                x.OrderItemStatus == "Accepted");

        var packedItems =
            await query.CountAsync(x =>
                x.OrderItemStatus == "Packed");

        var shippedItems =
            await query.CountAsync(x =>
                x.OrderItemStatus == "Shipped");

        var outForDeliveryItems =
            await query.CountAsync(x =>
                x.OrderItemStatus ==
                "OutForDelivery");

        var deliveredItems =
            await query.CountAsync(x =>
                x.OrderItemStatus ==
                "Delivered");

        var cancelledItems =
            await query.CountAsync(x =>
                x.OrderItemStatus ==
                "Cancelled");

        // -----------------------------------------------------
        // REVENUE
        // -----------------------------------------------------

        var revenue =
            await query
                .Where(x =>
                    x.Order.PaymentStatus ==
                        "Completed" &&
                    x.OrderItemStatus ==
                        "Delivered")
                .SumAsync(x =>
                    (decimal?)x.FinalPaidAmount) ??
            0m;

        // -----------------------------------------------------
        // CUSTOMERS
        // -----------------------------------------------------

        var customers =
            await query
                .Select(x => x.Order.UserId)
                .Where(x => x != null)
                .Distinct()
                .CountAsync();

        // -----------------------------------------------------
        // RETURNS
        // -----------------------------------------------------

        var returnRequested =
            await query.CountAsync(x =>
                x.ReturnStatus == "Requested");

        var returnApproved =
            await query.CountAsync(x =>
                x.ReturnStatus == "Approved");

        var returned =
            await query.CountAsync(x =>
                x.ReturnStatus == "Returned");

        var refunded =
            await query.CountAsync(x =>
                x.ReturnStatus == "Refunded");

        // -----------------------------------------------------
        // PAGINATION
        // -----------------------------------------------------

        var totalPages =
            totalOrderItems == 0
                ? 0
                : (int)Math.Ceiling(
                    totalOrderItems /
                    (double)pageSize);

        var orders =
            await query
                .Include(x => x.Order)
                .Include(x => x.Product)
                .OrderByDescending(
                    x => x.Order.OrderDate)
                .ThenByDescending(
                    x => x.OrderId)
                .ThenByDescending(
                    x => x.OrderItemId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(item => new
                {
                    orderItemId =
                        item.OrderItemId,

                    orderId =
                        item.OrderId,

                    orderDate =
                        item.Order.OrderDate,

                    productId =
                        item.ProductId,

                    productName =
                        item.Product.Name,

                    quantity =
                        item.Quantity,

                    price =
                        item.Price,

                    finalPaidAmount =
                        item.FinalPaidAmount,

                    paymentStatus =
                        item.Order.PaymentStatus,

                    orderStatus =
                        item.OrderItemStatus,

                    sellerId =
                        item.SellerId,

                    sellerName =
                        seller.BusinessName,

                    grandTotal =
                        item.Order.GrandTotal,

                    returnStatus =
                        item.ReturnStatus,

                    trackingNumber =
                        item.TrackingNumber,

                    courierPartner =
                        item.CourierPartner,

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
                })
                .ToListAsync();

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

                completed =
                    completedItems,

                completedItems,

                pending =
                    pendingItems,

                pendingItems,

                revenue,

                customers,

                payment = new
                {
                    pending =
                        pendingPayments,

                    completed =
                        completedPayments,

                    failed =
                        failedPayments,

                    refunded =
                        refundedPayments
                },

                delivery = new
                {
                    placed =
                        placedItems,

                    accepted =
                        acceptedItems,

                    packed =
                        packedItems,

                    shipped =
                        shippedItems,

                    outForDelivery =
                        outForDeliveryItems,

                    delivered =
                        deliveredItems,

                    cancelled =
                        cancelledItems
                },

                returns = new
                {
                    requested =
                        returnRequested,

                    approved =
                        returnApproved,

                    returned,

                    refunded
                }
            },

            orders
        });
    }

    // =========================================================
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