using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text.RegularExpressions;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services.Storage;
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
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<SellerController> _logger;
    private readonly IAuditService _auditService;

    public SellerController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        EmailService emailService,
        IFileStorageService filestorage,
        ILogger<SellerController> logger,
        IAuditService auditService)
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _emailService = emailService;
        _fileStorage = filestorage;
        _logger = logger;
        _auditService = auditService;
    }


    // =========================================================
    // AUDIT LOGGING
    // =========================================================

    // Audit failures must not interrupt seller operations.
    // Never pass passwords, reset tokens, GST/PAN, bank details,
    // document contents, or full addresses to this helper.
    private async Task LogAuditAsync(
        string action,
        string status,
        string entityType,
        string? entityId,
        string description,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _auditService.LogAsync(
                action: action,
                module: "Sellers",
                status: status,
                entityType: entityType,
                entityId: entityId,
                description: description,
                oldValues: oldValues,
                newValues: newValues,
                cancellationToken: cancellationToken);
        }
        catch (Exception auditException)
        {
            _logger.LogError(
                auditException,
                "Failed to write seller audit event {Action}.",
                action);
        }
    }

    // =========================================================
    // REGISTER
    // =========================================================






    [AllowAnonymous]
    [HttpPost("register")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(21 * 1024 * 1024)]
    public async Task<IActionResult> Register(
        [FromForm] SellerRegisterViewModel model)
    {
        // =============================================
        // 1. NORMALIZE INPUT
        // =============================================

        model.Email = model.Email?.Trim().ToLowerInvariant() ?? "";
        model.Phone = model.Phone?.Trim() ?? "";
        model.GSTNumber = model.GSTNumber?.Trim().ToUpperInvariant() ?? "";
        model.PAN = model.PAN?.Trim().ToUpperInvariant() ?? "";
        model.IFSCCode = model.IFSCCode?.Trim().ToUpperInvariant() ?? "";

        model.WarehouseFullAddress =
            model.WarehouseFullAddress?.Trim();

        model.WarehouseContactPersonName =
            model.WarehouseContactPersonName?.Trim();

        model.WarehouseContactMobileNumber =
            model.WarehouseContactMobileNumber?.Trim();

        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Please correct the registration details.",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors
                            .Select(e => e.ErrorMessage)
                            .ToArray())
            });
        }

        // =============================================
        // 2. GST CERTIFICATE VALIDATION
        // =============================================

        if (model.GSTCertificateDocument == null ||
            model.GSTCertificateDocument.Length == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "GST certificate is required."
            });
        }

        if (!Regex.IsMatch(
            model.GSTNumber,
            @"^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$"))
        {
            return BadRequest(new
            {
                success = false,
                message = "Enter a valid GSTIN format."
            });
        }

        // =============================================
        // 3. CHECK DUPLICATE GST NUMBER
        // =============================================

        var gstAlreadyRegistered = await _context.Sellers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(s =>
                s.GSTNumber != null &&
                s.GSTNumber.Trim().ToUpper() == model.GSTNumber);

        if (gstAlreadyRegistered)
        {
            return Conflict(new
            {
                success = false,
                message = "This GST number is already registered."
            });
        }

        // =============================================
        // 4. PAN VALIDATION
        // =============================================

        if (!Regex.IsMatch(model.PAN, @"^[A-Z]{5}\d{4}[A-Z]$"))
        {
            return BadRequest(new
            {
                success = false,
                message = "Enter a valid PAN format."
            });
        }

        if (!string.Equals(
            model.GSTNumber.Substring(2, 10),
            model.PAN,
            StringComparison.Ordinal))
        {
            return BadRequest(new
            {
                success = false,
                message = "The PAN in the GSTIN must match the entered PAN."
            });
        }

        // =============================================
        // 5. IFSC VALIDATION
        // =============================================

        if (!Regex.IsMatch(model.IFSCCode, @"^[A-Z]{4}0[A-Z0-9]{6}$"))
        {
            return BadRequest(new
            {
                success = false,
                message = "Enter a valid 11-character IFSC code."
            });
        }

        // =============================================
        // 6. DOCUMENT VALIDATION
        // =============================================

        string? ValidateDocument(
            IFormFile? file,
            bool required,
            string label)
        {
            if (file == null || file.Length == 0)
            {
                return required ? $"{label} is required." : null;
            }

            if (file.Length > 10 * 1024 * 1024)
            {
                return $"{label} must be 10 MB or smaller.";
            }

            var extension = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!new[] { ".pdf", ".jpg", ".jpeg", ".png" }
                .Contains(extension))
            {
                return $"{label} must be a PDF, JPG, JPEG, or PNG file.";
            }

            return null;
        }

        var gstError = ValidateDocument(
            model.GSTCertificateDocument,
            true,
            "GST certificate");

        var licenceError = ValidateDocument(
            model.ProductLicenceDocument,
            false,
            "Product Licence document");

        if (gstError != null || licenceError != null)
        {
            return BadRequest(new
            {
                success = false,
                message = gstError ?? licenceError
            });
        }

        // =============================================
        // 7. CHECK EXISTING SELLER BY EMAIL
        // =============================================

        var sellerEmailExists = await _context.Sellers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(s =>
                s.Email.ToLower() == model.Email);

        if (sellerEmailExists)
        {
            return Conflict(new
            {
                success = false,
                message = "This email is already registered as a seller."
            });
        }

        // =============================================
        // 8. FIND EXISTING IDENTITY USER
        // =============================================

        var existingUser =
            await _userManager.FindByEmailAsync(model.Email);

        ApplicationUser user;
        bool createNewUser = existingUser == null;

        if (existingUser != null)
        {
            // Never automatically reactivate a disabled Identity account.
            if (!string.Equals(
                existingUser.Status,
                "Active",
                StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new
                {
                    success = false,
                    message = "This login account is inactive. Please contact support."
                });
            }

            // Check all seller profiles, including Pending and Inactive.
            var existingSeller = await _context.Sellers
                .IgnoreQueryFilters()
                .AnyAsync(s => s.UserId == existingUser.Id);

            if (existingSeller)
            {
                return Conflict(new
                {
                    success = false,
                    message = "This email is already registered as a seller."
                });
            }

            // Reuse existing customer Identity account.
            user = existingUser;
        }
        else
        {
            user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                Status = "Active"
            };
        }

        // =============================================
        // 9. DATABASE TRANSACTION
        // =============================================

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // =============================================
            // 10. CREATE IDENTITY USER
            // =============================================

            if (createNewUser)
            {
                var createResult = await _userManager.CreateAsync(
                    user,
                    model.Password);

                if (!createResult.Succeeded)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        success = false,
                        message = string.Join(
                            "; ",
                            createResult.Errors.Select(e => e.Description))
                    });
                }
            }

            // =============================================
            // 11. ASSIGN SELLER ROLE
            // =============================================

            if (!await _userManager.IsInRoleAsync(user, "Seller"))
            {
                var roleResult = await _userManager.AddToRoleAsync(
                    user,
                    "Seller");

                if (!roleResult.Succeeded)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        success = false,
                        message = string.Join(
                            "; ",
                            roleResult.Errors.Select(e => e.Description))
                    });
                }
            }

            // =============================================
            // 12. UPLOAD GST CERTIFICATE
            // =============================================

            var gstCertificatePath =
                await _fileStorage.UploadAsync(
                    model.GSTCertificateDocument!,
                    "seller-gst-certificates");

            // =============================================
            // 13. OPTIONAL PRODUCT LICENCE
            // =============================================

            string? productLicencePath = null;

            if (model.ProductLicenceDocument is { Length: > 0 })
            {
                productLicencePath =
                    await _fileStorage.UploadAsync(
                        model.ProductLicenceDocument,
                        "seller-product-licences");
            }

            // =============================================
            // 14. FREE SUBSCRIPTION PERIOD
            // =============================================

            var registrationDate = DateTime.UtcNow;

            var launchDate = new DateTime(
                2026, 12, 14, 0, 0, 0, DateTimeKind.Utc);

            var freeStartDate = registrationDate < launchDate
                ? launchDate
                : registrationDate;

            var freeEndDate = freeStartDate.AddMonths(3);

            // =============================================
            // 15. CREATE SELLER PROFILE
            // =============================================

            var seller = new SellerModel
            {
                UserId = user.Id,

                BusinessName = model.BusinessName.Trim(),
                OwnerName = model.OwnerName.Trim(),
                ProductType = model.ProductType.Trim(),
                Brand = model.Brand?.Trim(),

                Email = model.Email,
                Phone = model.Phone,

                GSTNumber = model.GSTNumber,
                IsGSTVerified = false,

                PAN = model.PAN,
                IsPANVerified = false,

                AddressLine1 = model.AddressLine1.Trim(),
                City = model.City.Trim(),
                State = model.State.Trim(),
                Pincode = model.Pincode.Trim(),

                WarehouseFullAddress =
                    model.WarehouseFullAddress,

                WarehouseContactPersonName =
                    model.WarehouseContactPersonName,

                WarehouseContactMobileNumber =
                    model.WarehouseContactMobileNumber,

                AccountHolderName = model.AccountHolderName.Trim(),
                AccountNumber = model.AccountNumber.Trim(),
                IFSCCode = model.IFSCCode,
                BankName = model.BankName.Trim(),

                GSTCertificateDocumentPath = gstCertificatePath,
                ProductLicenceDocumentPath = productLicencePath,

                // Three-month free subscription.
                FreeSubscriptionStartDate = freeStartDate,
                FreeSubscriptionEndDate = freeEndDate,
                SubscriptionPlan = "Free",
                IsLaunchFreeSubscription = true,

                // Admin approval required.
                Status = "Pending",
                IsActive = false,

                CreatedAt = registrationDate
            };

            _context.Sellers.Add(seller);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            // =============================================
            // 16. AUDIT LOG
            // =============================================

            await LogAuditAsync(
                action: "SellerRegistration",
                status: "Success",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description:
                    "Seller registration completed and is pending admin approval.",
                newValues: new
                {
                    seller.SellerId,
                    seller.UserId,
                    seller.BusinessName,
                    seller.Status,
                    seller.IsActive,
                    seller.SubscriptionPlan,
                    FreeSubscriptionStartDate = freeStartDate,
                    FreeSubscriptionEndDate = freeEndDate
                });

            // =============================================
            // 17. RESPONSE
            // =============================================

            return Ok(new
            {
                success = true,
                message =
                    "Registration successful! Your account is pending admin approval.",

                sellerId = seller.SellerId,
                status = seller.Status,
                isActive = seller.IsActive,

                freeSubscriptionStartDate = freeStartDate,
                freeSubscriptionEndDate = freeEndDate,

                redirectUrl = "/seller/pending-approval"
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            _logger.LogError(
                ex,
                "Seller registration failed for email {Email}.",
                model.Email);

            return StatusCode(500, new
            {
                success = false,
                message = "Registration could not be completed. Please try again."
            });
        }
    }





    // =========================================================
    // LOGIN
    // =========================================================




    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] SellerLoginRequest model)
    {
        // =============================================
        // 1. VALIDATE REQUEST
        // =============================================

        if (model == null ||
            string.IsNullOrWhiteSpace(model.Email) ||
            string.IsNullOrWhiteSpace(model.Password))
        {
            return BadRequest(new
            {
                success = false,
                message = "Email and password are required."
            });
        }

        var email = model.Email.Trim().ToLowerInvariant();

        // =============================================
        // 2. FIND SELLER PROFILE
        // =============================================

        // Ignore the global Seller filter.
        // This allows Pending and Inactive sellers to be found.

        var seller = await _context.Sellers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.Email.ToLower() == email);

        if (seller == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Invalid seller email or password."
            });
        }

        // =============================================
        // 3. FIND LINKED IDENTITY USER
        // =============================================

        var user = await _userManager.FindByIdAsync(
            seller.UserId);

        if (user == null)
        {
            _logger.LogWarning(
                "Seller Identity mapping missing. SellerId: {SellerId}",
                seller.SellerId);

            return Unauthorized(new
            {
                success = false,
                message = "Invalid seller email or password."
            });
        }

        // =============================================
        // 4. VALIDATE PASSWORD
        // =============================================

        var passwordValid =
            await _userManager.CheckPasswordAsync(
                user,
                model.Password);

        if (!passwordValid)
        {
            await LogAuditAsync(
                action: "SellerLogin",
                status: "Failed",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description: "Seller login failed due to invalid credentials.");

            return Unauthorized(new
            {
                success = false,
                message = "Invalid seller email or password."
            });
        }

        // =============================================
        // 5. CHECK IDENTITY ACCOUNT STATUS
        // =============================================

        if (!string.Equals(
            user.Status,
            "Active",
            StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                reason = "identity-account-inactive",
                message = "Your login account is inactive. Please contact support."
            });
        }

        // =============================================
        // 6. VERIFY SELLER ROLE
        // =============================================

        if (!await _userManager.IsInRoleAsync(user, "Seller"))
        {
            await LogAuditAsync(
                action: "SellerLogin",
                status: "Failed",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description: "User does not have the Seller role.");

            return Forbid();
        }

        // =============================================
        // 7. CHECK SELLER APPROVAL STATUS
        // =============================================

        if (string.Equals(
            seller.Status,
            "Rejected",
            StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                reason = "rejected",
                message = "Your seller application has been rejected. Please contact support."
            });
        }

        if (string.Equals(
            seller.Status,
            "Inactive",
            StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                reason = "inactive",
                message = "Your seller account is inactive. Please contact support."
            });
        }

        if (!seller.IsActive ||
            !string.Equals(
                seller.Status,
                "Active",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                reason = "pending-approval",
                message =
                    "Your seller account is awaiting admin approval.",
                redirectUrl = "/seller/pending-approval"
            });
        }

        // =============================================
        // 8. CHECK FREE SUBSCRIPTION
        // =============================================

        var now = DateTime.UtcNow;

        bool freeSubscriptionActive =
            seller.FreeSubscriptionStartDate.HasValue &&
            seller.FreeSubscriptionEndDate.HasValue &&
            now >= seller.FreeSubscriptionStartDate.Value &&
            now < seller.FreeSubscriptionEndDate.Value;

        // =============================================
        // 9. CHECK PAID SUBSCRIPTION
        // =============================================

        bool paidSubscriptionActive =
            await _context.Subscriptions.AnyAsync(s =>
                s.SellerId == seller.SellerId &&
                s.Status == "Active" &&
                s.StartDate <= now &&
                s.EndDate > now);

        bool hasValidSubscription =
            freeSubscriptionActive ||
            paidSubscriptionActive;

        // =============================================
        // 10. AUTHENTICATE SELLER
        // =============================================

        await _signInManager.SignOutAsync();

        var signInResult =
            await _signInManager.PasswordSignInAsync(
                user.UserName!,
                model.Password,
                isPersistent: false,
                lockoutOnFailure: false);

        if (!signInResult.Succeeded)
        {
            await LogAuditAsync(
                action: "SellerLogin",
                status: "Failed",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description: "Seller authentication failed.");

            return Unauthorized(new
            {
                success = false,
                message = "Seller sign-in failed. Please try again."
            });
        }

        // =============================================
        // 11. AUDIT SUCCESSFUL AUTHENTICATION
        // =============================================

        await LogAuditAsync(
            action: "SellerLogin",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller authenticated successfully.",
            newValues: new
            {
                seller.SellerId,
                seller.UserId,
                SubscriptionType = freeSubscriptionActive
                    ? "Free"
                    : paidSubscriptionActive ? "Paid" : "None",
                HasValidSubscription = hasValidSubscription
            });

        // =============================================
        // 12. NO ACTIVE SUBSCRIPTION
        // =============================================

        if (!hasValidSubscription)
        {
            return Ok(new
            {
                success = true,
                subscribed = false,
                message = "Please subscribe to access the seller portal.",
                redirectUrl = "/seller/subscription",

                seller = new
                {
                    sellerId = seller.SellerId,
                    businessName = seller.BusinessName,
                    ownerName = seller.OwnerName,
                    email = seller.Email
                }
            });
        }

        // =============================================
        // 13. SUCCESSFUL SELLER LOGIN
        // =============================================

        return Ok(new
        {
            success = true,
            subscribed = true,

            subscriptionType = freeSubscriptionActive
                ? "Free"
                : "Paid",

            seller = new
            {
                sellerId = seller.SellerId,
                businessName = seller.BusinessName,
                ownerName = seller.OwnerName,
                email = seller.Email,
                status = seller.Status,

                freeSubscriptionEnd =
                    seller.FreeSubscriptionEndDate,

                subscriptionEnd =
                    seller.SubscriptionEndDate
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
        const string genericMessage =
            "If the email is registered, a password reset link has been sent.";

        if (model == null || string.IsNullOrWhiteSpace(model.Email))
        {
            return BadRequest(new
            {
                success = false,
                message = "Email is required."
            });
        }

        try
        {
            var email = model.Email.Trim();

            var seller = await _context.Sellers
                .FirstOrDefaultAsync(
                    x => x.Email.ToLower() == email.ToLower());

            // Return a generic message to avoid revealing registered emails.
            if (seller == null)
            {
                return Ok(new
                {
                    success = true,
                    message = genericMessage
                });
            }

            var user = await _userManager.FindByIdAsync(seller.UserId);

            if (user == null)
            {
                _logger.LogWarning(
                    "Seller {SellerId} has no linked Identity user.",
                    seller.SellerId);

                return Ok(new
                {
                    success = true,
                    message = genericMessage
                });
            }

            var token = await _userManager
                .GeneratePasswordResetTokenAsync(user);

            var frontend = _configuration["Frontend:BaseUrl"];

            if (string.IsNullOrWhiteSpace(frontend))
            {
                _logger.LogError(
                    "Frontend:BaseUrl is missing from configuration.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to process the password reset request."
                });
            }

            var resetLink =
                $"{frontend.TrimEnd('/')}/seller-reset-password" +
                $"?email={Uri.EscapeDataString(seller.Email)}" +
                $"&token={Uri.EscapeDataString(token)}";

            await _emailService.SendPasswordResetEmail(
                seller.Email,
                seller.BusinessName,
                resetLink);

            await LogAuditAsync(
                action: "SellerPasswordResetLinkRequested",
                status: "Success",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description: "Seller password reset email was sent.");

            return Ok(new
            {
                success = true,
                message = genericMessage
            });
        }
        catch (Exception ex)
        {
            await LogAuditAsync(
                action: "SellerPasswordResetLinkRequested",
                status: "Failed",
                entityType: "Seller",
                entityId: null,
                description: "Seller password reset email request failed.");

            _logger.LogError(ex, "Seller forgot-password request failed.");

            return StatusCode(500, new
            {
                success = false,
                message = "Unable to send the password reset email. Please try again."
            });
        }
    }



    [AllowAnonymous]
    [HttpPost("seller-reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] SellerResetPasswordDto model)
    {
        if (model == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid request."
            });
        }

        if (model.NewPassword != model.ConfirmPassword)
        {
            return BadRequest(new
            {
                success = false,
                message = "Passwords do not match."
            });
        }

        try
        {
            var email = model.Email.Trim();

            var seller = await _context.Sellers
                .FirstOrDefaultAsync(
                    s => s.Email.ToLower() == email.ToLower());

            if (seller == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid or expired password reset link."
                });
            }

            var user = await _userManager.FindByIdAsync(seller.UserId);

            if (user == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid or expired password reset link."
                });
            }

            var result = await _userManager.ResetPasswordAsync(
    user,
    model.Token,
    model.NewPassword);

            if (!result.Succeeded)
            {
                await LogAuditAsync(
                    action: "SellerPasswordReset",
                    status: "Failed",
                    entityType: "Seller",
                    entityId: seller.SellerId.ToString(),
                    description: "Seller password reset was rejected.");

                _logger.LogWarning(
                    "Password reset failed: {Errors}",
                    string.Join(
                        "; ",
                        result.Errors.Select(e => e.Code)));

                return BadRequest(new
                {
                    success = false,
                    message = "Password reset failed.",
                    errors = result.Errors.Select(e => new
                    {
                        code = e.Code,
                        description = e.Description
                    })
                });
            }

            await LogAuditAsync(
                action: "SellerPasswordReset",
                status: "Success",
                entityType: "Seller",
                entityId: seller.SellerId.ToString(),
                description: "Seller password was reset.");

            return Ok(new
            {
                success = true,
                message = "Password updated successfully. You can now log in."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Seller password reset failed.");

            return StatusCode(500, new
            {
                success = false,
                message = "Unable to reset the password. Please try again."
            });
        }
    }


    [HttpGet("access-status")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetSellerAccessStatus()
    {
        var userId = _userManager.GetUserId(User);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var seller = await _context.Sellers
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (seller == null)
            return NotFound(new
            {
                allowed = false,
                reason = "Seller profile not found."
            });

        await LogAuditAsync(
            action: "CheckSellerAccessStatus",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller access and subscription eligibility were checked.");

        // Step 1: Admin approval is mandatory.
        if (!seller.IsActive ||
            !string.Equals(seller.Status, "Active",
                StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new
            {
                allowed = false,
                reason = "pending-approval",
                redirect = "/seller/pending-approval",
                message = "Your documents are awaiting admin approval."
            });
        }

        var now = DateTime.UtcNow;

        // Step 2: Allow access during the seller's own free period.
        if (seller.FreeSubscriptionStartDate.HasValue &&
            seller.FreeSubscriptionEndDate.HasValue &&
            now >= seller.FreeSubscriptionStartDate.Value &&
            now < seller.FreeSubscriptionEndDate.Value)
        {
            return Ok(new
            {
                allowed = true,
                reason = "free-subscription",
                redirect = "/seller/dashboard"
            });
        }

        // Step 3: Check for a currently valid paid subscription.
        var paidSubscription = await _context.Subscriptions
            .Where(s =>
                s.SellerId == seller.SellerId &&
                s.Status == "Active" &&
                s.StartDate.HasValue &&
                s.EndDate.HasValue &&
                s.StartDate.Value <= now &&
                s.EndDate.Value > now)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();

        if (paidSubscription != null)
        {
            return Ok(new
            {
                allowed = true,
                reason = "paid-subscription",
                redirect = "/seller/dashboard"
            });
        }

        // Step 4: No valid subscription.
        return Ok(new
        {
            allowed = false,
            reason = "subscription-required",
            redirect = "/seller/subscription",
            message = "Please subscribe to continue using the seller portal."
        });
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

        await LogAuditAsync(
            action: "ViewSellerDashboard",
            status: "Success",
            entityType: "Seller",
            entityId: sellerId.ToString(),
            description: "Seller viewed dashboard metrics.");

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

        await LogAuditAsync(
            action: "ViewSellerProfile",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed their profile.");

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

        await LogAuditAsync(
            action: "ViewSellerStatistics",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed statistics.");

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

        await LogAuditAsync(
            action: "ViewSellerSubscription",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed subscription status.");

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

        await LogAuditAsync(
            action: "ViewSellerProductLimit",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed product limit.");

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

        await LogAuditAsync(
            action: "SellerLogout",
            status: "Success",
            entityType: "Seller",
            entityId: _userManager.GetUserId(User),
            description: "Seller logged out.");

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

        var oldProfile = new
        {
            seller.BusinessName,
            seller.OwnerName,
            seller.Brand,
            seller.Phone,
            seller.City,
            seller.State,
            seller.Pincode
        };

        seller.BusinessName = model.BusinessName;
        seller.OwnerName = model.OwnerName;
        seller.Brand = model.Brand;
        seller.Phone = model.Phone;
        seller.AddressLine1 = model.AddressLine1?.Trim() ?? seller.AddressLine1;
        seller.City = model.City?.Trim() ?? seller.City;
        seller.State = model.State?.Trim() ?? seller.State;
        seller.Pincode = model.Pincode?.Trim() ?? seller.Pincode;

        // WAREHOUSE DETAILS
        // Only update these fields when the client includes them.
        // This prevents older profile forms from clearing existing warehouse details.
        if (model.WarehouseFullAddress != null)
            seller.WarehouseFullAddress = model.WarehouseFullAddress.Trim();

        if (model.WarehouseContactPersonName != null)
            seller.WarehouseContactPersonName = model.WarehouseContactPersonName.Trim();

        if (model.WarehouseContactMobileNumber != null)
            seller.WarehouseContactMobileNumber = model.WarehouseContactMobileNumber.Trim();

        seller.BankName = model.BankName;
        seller.AccountHolderName =
            model.AccountHolderName;
        seller.AccountNumber =
            model.AccountNumber;
        seller.IFSCCode =
            model.IFSCCode;

        await _context.SaveChangesAsync();

        await LogAuditAsync(
            action: "UpdateSellerProfile",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller profile was updated.",
            oldValues: oldProfile,
            newValues: new
            {
                seller.BusinessName,
                seller.OwnerName,
                seller.Brand,
                seller.Phone,
                seller.City,
                seller.State,
                seller.Pincode
            });

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
            await LogAuditAsync(
                action: "ChangeSellerPassword",
                status: "Failed",
                entityType: "Seller",
                entityId: user.Id,
                description: "Seller password change failed.");

            return BadRequest(new
            {
                success = false,
                errors = result.Errors
                    .Select(x => x.Description)
            });
        }

        await LogAuditAsync(
            action: "ChangeSellerPassword",
            status: "Success",
            entityType: "Seller",
            entityId: user.Id,
            description: "Seller password changed successfully.");

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

        var deletedSellerId = seller?.SellerId;
        var deletedBusinessName = seller?.BusinessName;

        await _userManager.DeleteAsync(user);
        await _context.SaveChangesAsync();

        await LogAuditAsync(
            action: "DeleteSellerAccount",
            status: "Success",
            entityType: "Seller",
            entityId: deletedSellerId?.ToString() ?? user.Id,
            description: "Seller account was deleted.",
            oldValues: new { SellerId = deletedSellerId, BusinessName = deletedBusinessName });

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

        await LogAuditAsync(
            action: "ViewSellerProducts",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed their product list.",
            newValues: new { ProductCount = products.Count });

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

                IsOnlinePayment = !string.IsNullOrWhiteSpace(order.RazorpayPaymentId),

                // Item amount after discount/coupon allocation.
                ItemFinalPaidAmount = item.FinalPaidAmount,
                // Complete order amount, including any order-level delivery charge.
                OrderFinalPaidAmount = order.GrandTotal,

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

        await LogAuditAsync(
            action: "ViewSellerOrders",
            status: "Success",
            entityType: "Seller",
            entityId: seller.SellerId.ToString(),
            description: "Seller viewed and filtered their order list.",
            newValues: new
            {
                Page = page,
                PageSize = pageSize,
                TotalOrders = totalOrders,
                TotalOrderItems = totalOrderItems,
                HasSearch = !string.IsNullOrWhiteSpace(search),
                PaymentStatus = paymentStatus,
                OrderStatus = orderStatus,
                FromDate = fromDate,
                ToDate = toDate
            });

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

        // =========================================================
        // CANCELLATION RULE
        // Customer can cancel before shipment.
        // =========================================================

        var cancellableStatuses = new[]
        {
    "Pending",
    "Placed",
    "Accepted",
    "Packed"
};

        if (!cancellableStatuses.Contains(
                item.OrderItemStatus,
                StringComparer.OrdinalIgnoreCase))
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

        var oldItemStatus = item.OrderItemStatus;
        var oldReturnEligible = item.IsReturnEligible;
        var oldReturnEligibleTill = item.ReturnEligibleTill;

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

        await LogAuditAsync(
            action: "UpdateSellerOrderItemStatus",
            status: "Success",
            entityType: "OrderItem",
            entityId: item.OrderItemId.ToString(),
            description: $"Seller changed order item status from '{oldItemStatus}' to '{item.OrderItemStatus}'.",
            oldValues: new
            {
                OrderItemStatus = oldItemStatus,
                IsReturnEligible = oldReturnEligible,
                ReturnEligibleTill = oldReturnEligibleTill
            },
            newValues: new
            {
                item.OrderItemStatus,
                item.IsReturnEligible,
                item.ReturnEligibleTill,
                item.PackedDate,
                item.ShippedDate,
                item.OutForDeliveryDate,
                item.DeliveredDate,
                item.CancelledAt
            });

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