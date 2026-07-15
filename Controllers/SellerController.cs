

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VivekMedicalProducts.Data;
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

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] SellerRegisterViewModel model)
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
                await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Errors.Select(x => x.Description)
                });
            }

            await _userManager.AddToRoleAsync(user, "Seller");

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
            .FirstOrDefaultAsync(x => x.UserId == user.Id);

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
                user.UserName,
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

    [AllowAnonymous]
    [HttpPost("seller-forgot-password")]
    public async Task<IActionResult> ForgotPassword(
    [FromBody] SellerForgotPasswordDto model)
    {
        try
        {
            var seller = await _context.Sellers
                .FirstOrDefaultAsync(x => x.Email == model.Email);

            // Never reveal whether the email exists
            if (seller == null)
            {
                return Ok(new
                {
                    success = true,
                    message = "If the email is registered, a password reset link has been sent."
                });
            }

            var user = await _userManager.FindByIdAsync(seller.UserId);

            if (user == null)
            {
                return Ok(new
                {
                    success = true,
                    message = "If the email is registered, a password reset link has been sent."
                });
            }

            var token =
                await _userManager.GeneratePasswordResetTokenAsync(user);

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
                message = "If the email is registered, a password reset link has been sent."
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

            var seller = await _context.Sellers
                .FirstOrDefaultAsync(x => x.Email == model.Email);

            if (seller == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request."
                });
            }

            var user =
                await _userManager.FindByIdAsync(seller.UserId);

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
                    message = string.Join(",",
                        result.Errors.Select(x => x.Description))
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

    [Authorize(Roles = "Seller")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var userId = _userManager.GetUserId(User);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Please login."
            });
        }

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Seller not found."
            });
        }

        var totalProducts = await _context.Products
            .CountAsync(x => x.SellerId == seller.SellerId);

        var totalOrders = await _context.OrderItems
            .CountAsync(x => x.SellerId == seller.SellerId);

        var revenue = await _context.OrderItems
            .Where(x => x.SellerId == seller.SellerId)
            .Join(
                _context.Orders,
                oi => oi.OrderId,
                o => o.OrderId,
                (oi, o) => new { oi, o }
            )
            .Where(x => x.o.PaymentStatus == "Completed")
            .SumAsync(x => (decimal?)x.oi.Price * x.oi.Quantity) ?? 0;

        return Ok(new
        {
            success = true,

            sellerId = seller.SellerId,

            sellerName = seller.BusinessName,

            totalProducts,

            totalOrders,

            revenue,

            subscriptionEnd = seller.SubscriptionEndDate,

            isSubscribed = seller.SubscriptionEndDate > DateTime.UtcNow
        });
    }

    [Authorize(Roles = "Seller")]
    [HttpGet("profile")]
    public async Task<IActionResult> Profile()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

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
    [Authorize(Roles = "Seller")]
    [HttpGet("statistics")]
    public async Task<IActionResult> Statistics()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        var stats = new
        {
            Products = await _context.Products
                .CountAsync(x => x.SellerId == seller.SellerId),

            Orders = await _context.OrderItems
                .CountAsync(x => x.SellerId == seller.SellerId),

            Revenue = await _context.OrderItems
                .Where(x => x.SellerId == seller.SellerId)
                .SumAsync(x => (decimal?)x.Price * x.Quantity) ?? 0,

            ActiveSubscription =
                seller.SubscriptionEndDate > DateTime.UtcNow
        };

        return Ok(stats);
    }
    [Authorize(Roles = "Seller")]
    [HttpGet("subscription")]
    public async Task<IActionResult> Subscription()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            success = true,

            isSubscribed =
                seller.SubscriptionEndDate > DateTime.UtcNow,

            subscriptionEnd =
                seller.SubscriptionEndDate
        });
    }
    [Authorize(Roles = "Seller")]
    [HttpGet("product-limit")]
    public async Task<IActionResult> ProductLimit()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
        {
            return NotFound();
        }

        var sub = await _context.Subscriptions
            .Where(x =>
                x.SellerId == seller.SellerId &&
                x.Status == "Active")
            .OrderByDescending(x => x.CreatedDate)
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

        return Ok(new
        {
            success = true,

            productLimit = limit,

            currentProducts = await _context.Products
                .CountAsync(x => x.SellerId == seller.SellerId)
        });
    }
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
    [Authorize(Roles = "Seller")]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
    [FromBody] SellerRegisterViewModel model)
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

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
        seller.AccountHolderName = model.AccountHolderName;
        seller.AccountNumber = model.AccountNumber;
        seller.IFSCCode = model.IFSCCode;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Profile updated successfully."
        });
    }
    [Authorize(Roles = "Seller")]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
    [FromBody] ChangePasswordRequest model)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            model.CurrentPassword,
            model.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                success = false,
                errors = result.Errors.Select(x => x.Description)
            });
        }

        return Ok(new
        {
            success = true,
            message = "Password changed successfully."
        });
    }
    [Authorize(Roles = "Seller")]
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return NotFound();
        }

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == user.Id);

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

    [Authorize(Roles = "Seller")]
    [HttpGet("products")]
    public async Task<IActionResult> GetSellerProducts()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
            return Unauthorized();

        var products = await _context.Products
            .Where(x => x.SellerId == seller.SellerId)
            .OrderByDescending(x => x.CreatedDate)
            .ToListAsync();

        return Ok(products);
    }

    [Authorize(Roles = "Seller")]
    [HttpGet("orders")]
    public async Task<IActionResult> GetSellerOrders()
    {
        var userId = _userManager.GetUserId(User);

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (seller == null)
            return Unauthorized();

        var orders = await _context.OrderItems
            .Include(x => x.Order)
            .Include(x => x.Product)
            .Where(x => x.SellerId == seller.SellerId)
            .OrderByDescending(x => x.Order.OrderDate)
            .ToListAsync();

        return Ok(orders);
    }
}