using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;
using VivekMedicalProducts.DTOs;





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


    public AccountController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IWebHostEnvironment env,
        EmailService emailService,
        ApplicationDbContext context,
        GstVerificationService gstService,
        IUserContextService userContext
        )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _env = env;
        _context = context;
        _emailService = emailService;
        _gstService = gstService;
        _userContext = userContext;
    }

    // ================= COMMON HELPERS =================


    private string GenerateOTP()
    {
        return new Random().Next(100000, 999999).ToString();
    }


    // ================= SEND OTP =================
    [HttpPost("/api/account/send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.Email))
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
            var otp = new Random()
    .Next(100000, 999999)
    .ToString();

            Console.WriteLine(
                $"OTP Generated => {email} => {otp}");

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
     otp
 );

            // 🔹 STEP 7: Response
            return Ok(new
            {
                success = true,
                message = "OTP sent successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                inner = ex.InnerException?.Message
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
            if (string.IsNullOrWhiteSpace(req.Email))
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
                return BadRequest(new
                {
                    success = false,
                    message = "User not found"
                });
            }

            if (string.IsNullOrWhiteSpace(user.LoginOTP))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "No OTP generated"
                });
            }

            if (!user.OTPExpiry.HasValue)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "OTP expired"
                });
            }

            if (user.OTPExpiry.Value < DateTime.UtcNow)
            {
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

            Console.WriteLine(
                $"Stored OTP = {storedOtp}");

            Console.WriteLine(
                $"Entered OTP = {enteredOtp}");

            if (!storedOtp.Equals(
                    enteredOtp,
                    StringComparison.Ordinal))
            {
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

            await _signInManager.SignInAsync(
                user,
                isPersistent: true);

            await MergeCartAfterLogin(user.Id);

            await MergeWishlist(user.Id);

            return Ok(new
            {
                success = true,
                isProfileCompleted =
                    user.IsProfileCompleted
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


    [HttpPost("/api/account/logout")]
    public async Task<IActionResult> Logout()
    {
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
        user.CompanyName = model.CompanyName;
        user.CustomerName = model.CustomerName;
        user.MobileNo = model.MobileNo;
        user.GSTNo = model.GSTNo;
        user.PANNo = model.PANNo;
        user.Address = model.Address;
        user.DocumentPath = documentPath;
        user.IsProfileCompleted = true;

        await _userManager.UpdateAsync(user);

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

        return Ok(new
        {
            name = user.CustomerName,
            email = user.Email,
            mobile = user.MobileNo,
            address = user.Address
        });
    }


    [HttpPost("/api/account/update-profile")]
    public IActionResult UpdateProfile([FromBody] RegisterViewModel model)
    {
        var userId = _userContext.GetUserId();

        var user = _context.Users.FirstOrDefault(x => x.Id == userId);

        if (user == null)
            return NotFound();

        user.CustomerName = model.CustomerName;
        user.MobileNo = model.MobileNo;
        user.Address = model.Address;

        _context.SaveChanges();

        return Ok(new
        {
            success = true,
            message = "Profile updated"
        });
    }

    [HttpPost("/api/admin-login")]
    public async Task<IActionResult> AdminLoginApi(
     [FromBody] AdminLoginRequest model)
    {
        try
        {
            var user = await _userManager
                .FindByEmailAsync(model.Email);

            if (user == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Admin not found"
                });
            }

            if (!await _userManager.IsInRoleAsync(user, "Admin"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Access denied"
                });
            }

            var passwordValid =
                await _userManager.CheckPasswordAsync(
                    user,
                    model.Password);

            if (!passwordValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid password"
                });
            }

            await _signInManager.SignInAsync(
                user,
                isPersistent: true);

            return Ok(new
            {
                success = true,
                role = "Admin",
                email = user.Email
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


    private async Task MergeCartAfterLogin(string userId)
    {
        var guestId = Request.Cookies["guest_id"];

        if (string.IsNullOrEmpty(guestId))
            return;

        var guestCart = await _context.Carts
            .Where(c => c.GuestId == guestId)
            .ToListAsync();

        foreach (var item in guestCart)
        {
            var existing = await _context.Carts.FirstOrDefaultAsync(c =>
                c.UserId == userId && c.ProductVariantId == item.ProductVariantId);

            if (existing != null)
            {
                existing.Quantity += item.Quantity;
            }
            else
            {
                item.UserId = userId;
                item.GuestId = null;
            }
        }

        _context.Carts.RemoveRange(_context.Carts.Where(c => c.GuestId == guestId));

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
        if (!User.Identity.IsAuthenticated)
            return Unauthorized();

        var user = await _userManager.GetUserAsync(User);

        return Ok(new
        {
            name = user.CustomerName ?? user.Email,
            email = user.Email,
            isProfileCompleted = user.IsProfileCompleted,

            // 🔥 ADD THIS
            kycStatus = user.IsProfileCompleted ? "Completed" : "Pending"
        });
    }
}