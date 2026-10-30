using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Security.Cryptography;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Notification;
using VivekMedicalProducts.ViewModels;





namespace VivekMedicalProducts.Controllers;

[Route("[controller]")]
public class AccountController : Controller
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IWebHostEnvironment _env;
    private readonly EmailService _emailService;
    private readonly ApplicationDbContext _context;
    private readonly GstVerificationService _gstService;
    private readonly IUserContextService _userContext;
    private readonly IAuditService _auditService;
    private readonly ILogger<AccountController> _logger;


    public AccountController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IWebHostEnvironment env,
        EmailService emailService,
        ApplicationDbContext context,
        GstVerificationService gstService,
        IUserContextService userContext,
        IAuditService auditService,
        ILogger<AccountController> logger
        )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _env = env;
        _context = context;
        _emailService = emailService;
        _gstService = gstService;
        _userContext = userContext;
        _auditService = auditService;
        _logger = logger;
    }

    // ================= COMMON HELPERS =================


    private string GenerateOTP()
    {
        return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    }

    private async Task WriteAuditAsync(
        string action,
        string module,
        string status,
        string description,
        string? userId = null,
        string? role = null,
        string? entityType = "ApplicationUser",
        string? entityId = null,
        object? oldValues = null,
        object? newValues = null)
    {
        string? actorUserName = null;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            var actor = await _userManager.FindByIdAsync(userId);
            actorUserName = actor?.CustomerName
                ?? actor?.UserName
                ?? actor?.Email;
        }
        else if (User?.Identity?.IsAuthenticated == true)
        {
            actorUserName = User.Identity.Name;
        }

        await _auditService.LogAsync(
            action: action,
            module: module,
            status: status,
            entityType: entityType,
            entityId: entityId ?? userId,
            description: description,
            oldValues: oldValues,
            newValues: newValues,
            actorUserId: userId,
            actorRole: role,
            actorUserName: actorUserName);
    }


    // ================= SEND OTP =================
    [HttpPost("/api/account/send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        try
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { success = false, message = "Email is required" });

            var email = req.Email.Trim();
            var normalized = email.ToUpper();

            // 🔹 STEP 1: Find existing user
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.NormalizedUserName == normalized);

            // 🔹 STEP 2: Create user if not exists (SAFE)
            if (user == null)
            {
                var newUser = new ApplicationUser
                {
                    Email = email,
                    UserName = email,
                    EmailConfirmed = true,
                    IsProfileCompleted = false
                };

                var result = await _userManager.CreateAsync(newUser);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { success = false, message = errors });
                }

                // 🔥 Re-fetch (important)
                user = await _userManager.FindByEmailAsync(email);
            }

            // 🔹 STEP 3: Cooldown check (30 seconds)
            if (user.OTPLastSentAt.HasValue &&
                (DateTime.UtcNow - user.OTPLastSentAt.Value).TotalSeconds < 30)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Please wait 30 seconds before requesting another OTP"
                });
            }

            // 🔹 STEP 4: Ensure role
            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Customer"))
            {
                await _userManager.AddToRoleAsync(user, "Customer");
            }

            // 🔹 STEP 5: Generate OTP
            var otp = GenerateOTP();

            user.LoginOTP = otp;
            user.OTPExpiry =
                DateTime.UtcNow.AddMinutes(5);

            user.OTPLastSentAt =
                DateTime.UtcNow;

            var updateResult = await _userManager.UpdateAsync(user);

            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                return BadRequest(new { success = false, message = errors });
            }

            // 🔹 STEP 6: Send email
            await _emailService.SendEmailAsync(
                user.Email,
                "Login OTP",
                otp);

            await WriteAuditAsync(
                "OTP_SENT", "Authentication", "Success",
                "Login OTP issued to customer account.",
                user.Id, "Customer");

            // STEP 7: Response
            return Ok(new
            {
                success = true,
                message = "OTP sent successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while issuing login OTP.");
            return StatusCode(500, new
            {
                success = false,
                message = "Unable to process the OTP request. Please try again."
            });
        }
    }

    // ================= VERIFY OTP =================

    [HttpPost("/api/account/verify-otp")]
    public async Task<IActionResult> VerifyOtp(
    [FromBody] VerifyOtpRequest req)
    {
        try
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email is required"
                });
            }

            if (string.IsNullOrWhiteSpace(req.Otp))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "OTP is required"
                });
            }

            var email = req.Email.Trim();

            var user = await _userManager
                .FindByEmailAsync(email);

            if (user == null)
            {
                await WriteAuditAsync("OTP_LOGIN_FAILED", "Authentication", "Failed",
                    "OTP login attempted for an unknown account.", role: "Customer");
                return BadRequest(new
                {
                    success = false,
                    message = "User not found"
                });
            }

            if (string.IsNullOrWhiteSpace(user.LoginOTP))
            {
                await WriteAuditAsync("OTP_LOGIN_FAILED", "Authentication", "Failed",
                    "OTP verification attempted when no active OTP existed.", user.Id, "Customer");
                return BadRequest(new
                {
                    success = false,
                    message = "No OTP generated"
                });
            }

            if (!user.OTPExpiry.HasValue)
            {
                await WriteAuditAsync("OTP_LOGIN_FAILED", "Authentication", "Failed",
                    "OTP verification failed because expiry was unavailable.", user.Id, "Customer");
                return BadRequest(new
                {
                    success = false,
                    message = "OTP expired"
                });
            }

            if (user.OTPExpiry.Value < DateTime.UtcNow)
            {
                await WriteAuditAsync("OTP_LOGIN_FAILED", "Authentication", "Failed",
                    "OTP verification failed because the OTP expired.", user.Id, "Customer");
                return BadRequest(new
                {
                    success = false,
                    message = "OTP expired"
                });
            }

            var storedOtp =
                user.LoginOTP.Trim();

            var enteredOtp =
                req.Otp.Trim();

            if (!storedOtp.Equals(
                    enteredOtp,
                    StringComparison.Ordinal))
            {
                await WriteAuditAsync("OTP_LOGIN_FAILED", "Authentication", "Failed",
                    "OTP verification failed due to an invalid code.", user.Id, "Customer");
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid OTP"
                });
            }

            user.LoginOTP = null;
            user.OTPExpiry = null;
            user.OTPLastSentAt = null;

            var updateResult = await _userManager.UpdateAsync(user);

            if (!updateResult.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = string.Join(", ", updateResult.Errors.Select(e => e.Description))
                });
            }

            await MergeCartAfterLogin(user.Id);

            await MergeWishlist(user.Id);

            await _signInManager.SignInAsync(
                user,
                isPersistent: true);

            var customerRoles = await _userManager.GetRolesAsync(user);
            await WriteAuditAsync(
                "LOGIN", "Authentication", "Success",
                "Customer logged in successfully.", user.Id,
                customerRoles.FirstOrDefault() ?? "Customer");

            return Ok(new
            {
                success = true,

                cartMerged = true,

                wishlistMerged = true,

                isProfileCompleted = user.IsProfileCompleted
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OTP verification.");
            return StatusCode(500, new
            {
                success = false,
                message = "Unable to verify OTP. Please try again."
            });
        }
    }


    [HttpPost("/api/account/logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = _userContext.GetUserId();
        string? role = null;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser != null)
            {
                var roles = await _userManager.GetRolesAsync(currentUser);
                role = roles.FirstOrDefault();
            }

            await WriteAuditAsync("LOGOUT", "Authentication", "Success",
                "User logged out.", userId, role);
        }

        await _signInManager.SignOutAsync();
        return Ok(new { success = true });
    }

    // ================= REGISTER =================

    [HttpGet("Register")]
    public IActionResult Register()
    {
        if (!User.Identity.IsAuthenticated)
            return RedirectToAction("Login");

        return View();
    }

    private string NormalizeCompName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "";

        name = name.ToLower();

        // Words to ignore
        var removeWords = new[]
        {
        "private", "pvt", "ltd", "limited", "llp",
        "co", "company", "india", "services", "traders", "enterprise"
    };

        // Remove words
        foreach (var word in removeWords)
        {
            name = System.Text.RegularExpressions.Regex.Replace(
                name,
                $@"\b{word}\b",
                "",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        // Remove special characters & spaces
        name = new string(name.Where(char.IsLetterOrDigit).ToArray());

        return name.Trim();
    }

    [HttpPost("/api/account/register")]
    public async Task<IActionResult> Register([FromForm] RegisterViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid data"
            });
        }

        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(new { success = false, message = "User not found." });

        // GST VALIDATION (keep your logic)
        var gstResult = await _gstService.VerifyGST(model.GSTNo);

        if (gstResult == null)
            return BadRequest(new { success = false, message = "GST not found" });

        if (gstResult.sts != "Active")
            return BadRequest(new { success = false, message = "GST inactive" });

        var gstName = NormalizeCompName(gstResult.tradeNam);
        var inputName = NormalizeCompName(model.CompanyName);

        if (gstName != inputName)
        {
            return BadRequest(new
            {
                success = false,
                message = "Company name mismatch with GST"
            });
        }

        // PAN VALIDATION
        if (!string.IsNullOrEmpty(model.PANNo) &&
            model.GSTNo.Length >= 12)
        {
            var gstPan = model.GSTNo.Substring(2, 10);

            if (!gstPan.Equals(model.PANNo, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "PAN does not match GST"
                });
            }
        }

        // FILE UPLOAD
        string documentPath = null;

        if (model.Document != null && model.Document.Length > 0)
        {
            var ext = Path.GetExtension(model.Document.FileName).ToLower();
            var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png" };

            if (!allowed.Contains(ext))
                return BadRequest(new { success = false, message = "Invalid file" });

            var uploads = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploads);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploads, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await model.Document.CopyToAsync(stream);

            documentPath = "/uploads/" + fileName;
        }

        // UPDATE USER
        // UPDATE USER
        user.CompanyName = model.CompanyName?.Trim();
        user.CustomerName = model.CustomerName?.Trim();
        user.IndustrySector = model.IndustrySector?.Trim();

        user.MobileNo = model.MobileNo?.Trim();
        user.SecondaryEmail = model.SecondaryEmail?.Trim();
        user.SecondaryMobile = model.SecondaryMobile?.Trim();

        user.GSTNo = model.GSTNo?.Trim().ToUpper();
        user.PANNo = model.PANNo?.Trim().ToUpper();

        user.Address = model.Address?.Trim();


        // Only replace document when a NEW document was uploaded
        if (!string.IsNullOrWhiteSpace(documentPath))
        {
            user.DocumentPath = documentPath;
        }

        user.IsProfileCompleted = true;

        var kycUpdateResult = await _userManager.UpdateAsync(user);
        if (!kycUpdateResult.Succeeded)
        {
            _logger.LogWarning("KYC profile update failed for user {UserId}: {Errors}",
                user.Id, string.Join(", ", kycUpdateResult.Errors.Select(e => e.Code)));
            return BadRequest(new { success = false, message = "Unable to save KYC details." });
        }

        await WriteAuditAsync(
            "KYC_COMPLETED", "KYC", "Success",
            "Customer completed KYC registration.", user.Id, "Customer",
            newValues: new { user.IsProfileCompleted });

        return Ok(new
        {
            success = true,
            message = "KYC completed",
            isProfileCompleted = true
        });
    }

    [HttpGet("/api/account/profile")]
    public async Task<IActionResult> Profile()
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
            return NotFound();

        // Existing checkout/customer addresses
        var addresses = await _context.UserAddresses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.Id)
            .Select(x => new
            {
                id = x.Id,

                fullName = x.FullName,
                mobile = x.MobileNumber,

                addressLine1 = x.AddressLine1,
                addressLine2 = x.AddressLine2,
                landmark = x.Landmark,

                city = x.City,
                state = x.State,
                pincode = x.Pincode,

                label = x.AddressType,
                isDefault = x.IsDefault
            })
            .ToListAsync();

        return Ok(new
        {
            // ==========================
            // CUSTOMER DETAILS
            // ==========================

            name = user.CustomerName,
            email = user.Email,
            mobile = user.MobileNo,


            // ==========================
            // KYC / BUSINESS DETAILS
            // ==========================

            kyc = new
            {
                companyName = user.CompanyName,
                customerName = user.CustomerName,

                // These require the corresponding
                // ApplicationUser properties.
                industrySector = user.IndustrySector,

                mobileNo = user.MobileNo,
                email = user.Email,

                secondaryEmail = user.SecondaryEmail,
                secondaryMobile = user.SecondaryMobile,

                gstNo = user.GSTNo,
                panNo = user.PANNo,

                address = user.Address,

                documentPath = user.DocumentPath,

                isProfileCompleted =
                    user.IsProfileCompleted,

                status =
                    user.IsProfileCompleted
                        ? "Completed"
                        : "Pending"
            },

            // ==========================
            // EXISTING CHECKOUT ADDRESSES
            // ==========================

            addresses = addresses
        });
    }


    [HttpPost("/api/account/update-profile")]
    public async Task<IActionResult> UpdateProfile(
     [FromBody] RegisterViewModel model)
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(model.CustomerName))
        {
            return BadRequest(new
            {
                success = false,
                message = "Customer name is required."
            });
        }

        var changedFields = new List<string>();
        if (!string.Equals(user.CustomerName, model.CustomerName?.Trim(), StringComparison.Ordinal))
            changedFields.Add("CustomerName");
        if (!string.Equals(user.MobileNo, model.MobileNo?.Trim(), StringComparison.Ordinal))
            changedFields.Add("MobileNo");

        user.CustomerName = model.CustomerName.Trim();
        user.MobileNo = model.MobileNo?.Trim();

        var profileUpdateResult = await _userManager.UpdateAsync(user);
        if (!profileUpdateResult.Succeeded)
            return BadRequest(new { success = false, message = "Unable to update profile." });

        await WriteAuditAsync(
            "PROFILE_UPDATED", "Profile", "Success",
            "Customer profile details updated.", user.Id, "Customer",
            oldValues: new { changedFields },
            newValues: new { changedFields });

        return Ok(new
        {
            success = true,
            message = "Profile updated successfully."
        });
    }


    [HttpGet("/api/account/addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var addresses = await _context.UserAddresses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                fullName = x.FullName,
                mobile = x.MobileNumber,
                addressLine1 = x.AddressLine1,
                addressLine2 = x.AddressLine2,
                landmark = x.Landmark,
                city = x.City,
                state = x.State,
                pincode = x.Pincode,
                label = x.AddressType,
                isDefault = x.IsDefault
            })
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpPut("/api/account/addresses/{id:int}")]
    public async Task<IActionResult> UpdateAddress(
    int id,
    [FromBody] UserAddress model)
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.UserId == userId);

        if (address == null)
            return NotFound(new
            {
                message = "Address not found."
            });

        if (string.IsNullOrWhiteSpace(model.FullName) ||
            string.IsNullOrWhiteSpace(model.MobileNumber) ||
            string.IsNullOrWhiteSpace(model.AddressLine1) ||
            string.IsNullOrWhiteSpace(model.City) ||
            string.IsNullOrWhiteSpace(model.State) ||
            string.IsNullOrWhiteSpace(model.Pincode))
        {
            return BadRequest(new
            {
                message = "Please fill all required fields."
            });
        }

        var addressChangedFields = new[]
        {
            "FullName", "MobileNumber", "AddressLine1", "AddressLine2",
            "Landmark", "City", "State", "Pincode", "AddressType", "IsDefault"
        };

        if (model.IsDefault)
        {
            var others = await _context.UserAddresses
                .Where(x =>
                    x.UserId == userId &&
                    x.Id != id)
                .ToListAsync();

            foreach (var item in others)
            {
                item.IsDefault = false;
            }
        }

        address.FullName =
            model.FullName.Trim();

        address.MobileNumber =
            model.MobileNumber.Trim();

        address.AddressLine1 =
            model.AddressLine1.Trim();

        address.AddressLine2 =
            model.AddressLine2?.Trim();

        address.Landmark =
            model.Landmark?.Trim();

        address.City =
            model.City.Trim();

        address.State =
            model.State.Trim();

        address.Pincode =
            model.Pincode.Trim();

        address.AddressType =
            string.IsNullOrWhiteSpace(model.AddressType)
                ? "Home"
                : model.AddressType.Trim();

        address.IsDefault =
            model.IsDefault;

        await _context.SaveChangesAsync();

        await WriteAuditAsync(
            "ADDRESS_UPDATED", "CustomerAddress", "Success",
            "Customer address updated.", userId, "Customer",
            entityType: "UserAddress", entityId: id.ToString(),
            oldValues: new { changedFields = addressChangedFields },
            newValues: new { changedFields = addressChangedFields });

        return Ok(new
        {
            success = true,
            message = "Address updated successfully."
        });
    }

    [HttpDelete("/api/account/addresses/{id:int}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.UserId == userId);

        if (address == null)
            return NotFound();

        bool wasDefault = address.IsDefault;
        var deletedAddressId = address.Id;

        _context.UserAddresses.Remove(address);

        await _context.SaveChangesAsync();

        if (wasDefault)
        {
            var next = await _context.UserAddresses
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (next != null)
            {
                next.IsDefault = true;

                await _context.SaveChangesAsync();
            }
        }

        await WriteAuditAsync(
            "ADDRESS_DELETED", "CustomerAddress", "Success",
            "Customer address deleted.", userId, "Customer",
            entityType: "UserAddress", entityId: deletedAddressId.ToString(),
            oldValues: new { isDefault = wasDefault });

        return Ok(new
        {
            success = true,
            message = "Address deleted successfully."
        });
    }

    [HttpPut("/api/account/addresses/{id:int}/default")]
    public async Task<IActionResult> SetDefaultAddress(int id)
    {
        var userId = _userContext.GetUserId();

        if (userId == null)
            return Unauthorized();

        var selected = await _context.UserAddresses
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.UserId == userId);

        if (selected == null)
            return NotFound();

        var addresses = await _context.UserAddresses
            .Where(x => x.UserId == userId)
            .ToListAsync();

        var previousDefaultId = addresses.FirstOrDefault(x => x.IsDefault)?.Id;

        foreach (var address in addresses)
        {
            address.IsDefault =
                address.Id == id;
        }

        await _context.SaveChangesAsync();

        await WriteAuditAsync(
            "DEFAULT_ADDRESS_CHANGED", "CustomerAddress", "Success",
            "Customer changed the default delivery address.", userId, "Customer",
            entityType: "UserAddress", entityId: id.ToString(),
            oldValues: new { defaultAddressId = previousDefaultId },
            newValues: new { defaultAddressId = id });

        return Ok(new
        {
            success = true,
            message = "Default address updated successfully."
        });
    }

    [HttpPost("/api/admin-login")]
    [AllowAnonymous]
    public async Task<IActionResult> AdminLoginApi(
        [FromBody] AdminLoginRequest model)
    {
        try
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Email) ||
                string.IsNullOrWhiteSpace(model.Password))
            {
                await WriteAuditAsync("ADMIN_LOGIN_FAILED", "Authentication", "Failed",
                    "Admin login request had missing credentials.", role: "Admin");
                return BadRequest(new { success = false, message = "Email and password are required." });
            }

            var user = await _userManager.FindByEmailAsync(model.Email.Trim());
            if (user == null)
            {
                await WriteAuditAsync("ADMIN_LOGIN_FAILED", "Authentication", "Failed",
                    "Admin login attempted for an unknown account.", role: "Admin");
                return Unauthorized(new { success = false, message = "Invalid credentials." });
            }

            if (!await _userManager.IsInRoleAsync(user, "Admin"))
            {
                await WriteAuditAsync("ADMIN_LOGIN_DENIED", "Authentication", "Denied",
                    "Non-admin account attempted admin login.", user.Id, "Customer");
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { success = false, message = "Access denied." });
            }

            // PasswordSignInAsync applies Identity lockout rules and records failed attempts.
            var signInResult = await _signInManager.PasswordSignInAsync(
                user, model.Password, isPersistent: true, lockoutOnFailure: true);

            if (!signInResult.Succeeded)
            {
                var reason = signInResult.IsLockedOut
                    ? "Admin account is locked out after repeated failed sign-in attempts."
                    : "Admin password verification failed.";

                await WriteAuditAsync("ADMIN_LOGIN_FAILED", "Authentication", "Failed",
                    reason, user.Id, "Admin");

                return Unauthorized(new
                {
                    success = false,
                    message = signInResult.IsLockedOut
                        ? "Account temporarily locked. Please try again later."
                        : "Invalid credentials."
                });
            }

            await WriteAuditAsync("ADMIN_LOGIN", "Authentication", "Success",
                "Administrator logged in successfully.", user.Id, "Admin");

            return Ok(new { success = true, role = "Admin", email = user.Email });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin login failed unexpectedly.");
            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred. Please try again."
            });
        }
    }

    private async Task MergeCartAfterLogin(string userId)
    {
        var guestId = Request.Cookies["guest_id"];

        if (string.IsNullOrWhiteSpace(guestId))
            return;

        var guestCart = await _context.Carts
            .Where(x => x.GuestId == guestId)
            .ToListAsync();

        foreach (var guestItem in guestCart)
        {
            var existing = await _context.Carts.FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.ProductId == guestItem.ProductId &&
                x.ProductVariantId == guestItem.ProductVariantId);

            if (existing != null)
            {
                existing.Quantity += guestItem.Quantity;

                _context.Carts.Remove(guestItem);
            }
            else
            {
                // Create a NEW user cart row
                _context.Carts.Add(new CartModel
                {
                    UserId = userId,
                    GuestId = null,
                    ProductId = guestItem.ProductId,
                    ProductVariantId = guestItem.ProductVariantId,
                    Quantity = guestItem.Quantity,
                    SellerId = guestItem.SellerId,
                    CreatedDate = DateTime.UtcNow
                });

                // Remove the original guest row
                _context.Carts.Remove(guestItem);
            }
        }

        await _context.SaveChangesAsync();

        Response.Cookies.Delete("guest_id");
    }

    public async Task MergeWishlist(string userId)
    {
        var guestId = Request.Cookies["GuestId"];

        if (string.IsNullOrEmpty(guestId)) return;

        var guestItems = _context.Wishlists
            .Where(x => x.GuestId == guestId)
            .ToList();

        foreach (var item in guestItems)
        {
            bool exists = _context.Wishlists.Any(x =>
                x.ProductId == item.ProductId &&
                x.UserId == userId);

            if (!exists)
            {
                item.UserId = userId;
                item.GuestId = null;
            }
        }

        await _context.SaveChangesAsync();
    }


    /* React APIs */

    [HttpGet("/api/user")]
    public async Task<IActionResult> GetUser()
    {
        if (User?.Identity == null ||
            !User.Identity.IsAuthenticated)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Not authenticated."
            });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "User account not found."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        string? role = null;

        if (roles.Contains("Admin", StringComparer.OrdinalIgnoreCase))
        {
            role = "Admin";
        }
        else if (roles.Contains("Seller", StringComparer.OrdinalIgnoreCase))
        {
            role = "Seller";
        }
        else if (roles.Contains("Customer", StringComparer.OrdinalIgnoreCase))
        {
            role = "Customer";
        }

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized(new
            {
                success = false,
                message = "User role not found."
            });
        }

        // Seller information
        object? seller = null;

        if (roles.Contains("Seller"))
        {
            var sellerAccount = await _context.Sellers
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == user.Id);

            if (sellerAccount != null)
            {
                seller = new
                {
                    sellerId = sellerAccount.SellerId,
                    businessName = sellerAccount.BusinessName,
                    ownerName = sellerAccount.OwnerName,
                    email = sellerAccount.Email,
                    status = sellerAccount.Status,
                    subscriptionEnd = sellerAccount.SubscriptionEndDate,
                    isSubscribed =
                        sellerAccount.SubscriptionEndDate.HasValue &&
                        sellerAccount.SubscriptionEndDate.Value > DateTime.UtcNow
                };
            }
        }

        return Ok(new
        {
            success = true,

            userId = user.Id,

            name = user.CustomerName ?? user.Email,

            email = user.Email,

            role = role,

            roles = roles,

            isProfileCompleted = user.IsProfileCompleted,

            kycStatus =
         user.IsProfileCompleted
             ? "Completed"
             : "Pending",

            seller = seller
        });
    }
}
