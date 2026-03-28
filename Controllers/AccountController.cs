using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

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

    // ================= LOGIN =================

    [HttpGet("Login")]
    public IActionResult Login()
    {
        return View();
    }

    // ================= SEND OTP =================

    [HttpPost("SendOtp")]
    public async Task<IActionResult> SendOtp(string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
                return Json(new { success = false, message = "Email is required" });

            var user = await _userManager.FindByEmailAsync(email);

            // Create user if not exists (OTP-first flow)
            if (user == null)
            {
                user = new ApplicationUser
                {
                    Email = email,
                    UserName = email,
                    CompanyName = "Temp",
                    CustomerName = "User",
                    IsApproved = true,
                    IsProfileCompleted = false,
                    GSTVerified = false
                };

                var result = await _userManager.CreateAsync(user, "Temp@1234");

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return Json(new { success = false, message = errors });
                }
            }

            // 🔐 Optional: Prevent OTP spam (30 sec cooldown)
            if (user.OTPExpiry != null && user.OTPExpiry > DateTime.UtcNow.AddMinutes(4))
            {
                return Json(new
                {
                    success = false,
                    message = "Please wait before requesting another OTP"
                });
            }

            // Clear old OTP
            user.LoginOTP = null;
            user.OTPExpiry = null;

            // Generate new OTP
            var otp = GenerateOTP();

            user.LoginOTP = otp;
            user.OTPExpiry = DateTime.UtcNow.AddMinutes(5);

            await _userManager.UpdateAsync(user);

            // Send email
            await _emailService.SendEmailAsync(
                email,
                "Login OTP",
                $"Your OTP is: {otp}");

            return Json(new
            {
                success = true,
                message = "OTP sent successfully"
            });
        }
        catch (Exception ex)
        {
            return Json(new
            {
                success = false,
                message = ex.ToString()
            });
        }
    }

    // ================= VERIFY OTP =================

    [HttpPost("VerifyOtp")]
    public async Task<IActionResult> VerifyOtp(string email, string otp)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
                return Json(new { success = false, message = "User not found" });

            // Validate OTP
            if (string.IsNullOrEmpty(user.LoginOTP) ||
                user.LoginOTP.Trim() != otp?.Trim())
            {
                return Json(new { success = false, message = "Invalid OTP" });
            }

            // Expiry check
            if (user.OTPExpiry == null || user.OTPExpiry < DateTime.UtcNow)
            {
                return Json(new { success = false, message = "OTP expired" });
            }

            // Clear OTP after success
            user.LoginOTP = null;
            user.OTPExpiry = null;

            await _userManager.UpdateAsync(user);

            // Sign in
            await _signInManager.SignInAsync(user, isPersistent: true);

            // Merge guest cart
            await MergeCartAfterLogin(user.Id);

            return Json(new
            {
                success = true,
                isProfileCompleted = user.IsProfileCompleted
            });
        }
        catch (Exception)
        {
            return Json(new { success = false, message = "Verification failed" });
        }
    }

    // ================= REGISTER =================

    [HttpGet("Register")]
    public IActionResult Register()
    {
        if (!User.Identity.IsAuthenticated)
            return RedirectToAction("Login");

        return View();
    }

    [HttpPost("Register")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var userId = _userContext.GetUserId();

        if (userId == null)
        {
            ModelState.AddModelError("", "Session expired. Please login again.");
            return View(model);
        }

        var user = await _userManager.FindByIdAsync(userId);

        // PAN validation
        if (!string.IsNullOrEmpty(model.PANNo))
        {
            var gstPan = model.GSTNo.Substring(2, 10);

            if (gstPan != model.PANNo)
            {
                ModelState.AddModelError("PANNo", "PAN mismatch");
                return View(model);
            }
        }

        var gstResult = await _gstService.VerifyGST(model.GSTNo);

        if (gstResult == null || gstResult.sts != "Active")
        {
            ModelState.AddModelError("GSTNo", "Invalid GST");
            return View(model);
        }

        // File Upload
        string documentPath = null;

        if (model.Document != null)
        {
            var uploads = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploads);

            var fileName = Guid.NewGuid() + Path.GetExtension(model.Document.FileName);
            var filePath = Path.Combine(uploads, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await model.Document.CopyToAsync(stream);

            documentPath = "/uploads/" + fileName;
        }

        // Update user
        user.CompanyName = model.CompanyName;
        user.CustomerName = model.CustomerName;
        user.MobileNo = model.MobileNo;
        user.GSTNo = model.GSTNo;
        user.PANNo = model.PANNo;
        user.Address = model.Address;
        user.DocumentPath = documentPath;

        user.IsProfileCompleted = true;

        await _userManager.UpdateAsync(user);
        await _userManager.AddToRoleAsync(user, "Customer");

        TempData["SuccessMessage"] = "Profile completed successfully!";

        return RedirectToAction("Index", "Products");
    }

    // ================= LOGOUT =================

    [HttpGet("Logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return RedirectToAction("Login");
    }

    // ================= MERGE CART =================

    private async Task MergeCartAfterLogin(string userId)
    {
        var sessionId = HttpContext.Session.Id;

        var guestCart = _context.CartItems
            .Where(c => c.SessionId == sessionId)
            .ToList();

        foreach (var item in guestCart)
        {
            var existing = _context.CartItems
                .FirstOrDefault(c => c.UserId == userId && c.ProductId == item.ProductId);

            if (existing != null)
                existing.Quantity += item.Quantity;
            else
                item.UserId = userId;
        }

        await _context.SaveChangesAsync();
    }

    public IActionResult Profile()
    {
        string userId = _userContext.GetUserId(); // ✅ FIX

        var user = _context.Users
            .Where(x => x.Id == userId)
            .Select(x => new RegisterViewModel
            {
                CustomerName = x.CustomerName,
                Email = x.Email,
                MobileNo = x.MobileNo,
                Address = x.Address
            })
            .FirstOrDefault();

        if (user == null)
        {
            return RedirectToAction("Login");
        }

        return View(user);
    }

    [HttpPost]
    public IActionResult UpdateProfile(RegisterViewModel model)
    {
        var userId = _userContext.GetUserId(); // ✅ always use logged-in user

        var user = _context.Users.FirstOrDefault(x => x.Id == userId);

        if (user == null)
            return NotFound();

        user.CustomerName = model.CustomerName;
        user.MobileNo = model.MobileNo;
        user.Address = model.Address;

        _context.SaveChanges();

        TempData["SuccessMessage"] = "Updated Successfully";

        return RedirectToAction("Profile");
    }

    [HttpGet("AdminLogin")]
    public IActionResult AdminLogin()
    {
        return View();
    }

    [HttpPost("AdminLogin")]
    public async Task<IActionResult> AdminLogin(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            ModelState.AddModelError("", "Admin not found");
            return View();
        }

        if (!await _userManager.IsInRoleAsync(user, "Admin"))
        {
            ModelState.AddModelError("", "Not an admin");
            return View();
        }

        // 🔥 SIGN IN MANUALLY (BEST FIX)
        var passwordValid = await _userManager.CheckPasswordAsync(user, password);

        if (!passwordValid)
        {
            ModelState.AddModelError("", "Invalid password");
            return View();
        }

        await _signInManager.SignInAsync(user, isPersistent: true);

        return RedirectToAction("AdminHome", "Admin");
    }
}