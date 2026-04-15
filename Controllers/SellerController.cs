using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    public class SellerController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly GstVerificationService _gstService;

        public SellerController(ApplicationDbContext context, GstVerificationService gstService)
        {
            _context = context;
            _gstService = gstService;
        }

        // ================= HOME =================
        public IActionResult SellerHome()
        {
            return View();
        }

        // ================= REGISTER (GET) =================
        [HttpGet]
        public IActionResult SellerRegister()
        {
            return View();
        }

        // ================= REGISTER (POST) =================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SellerRegister(SellerRegisterViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new {
                            Field = x.Key,
                            Errors = x.Value.Errors.Select(e => e.ErrorMessage)
                        });

                    return Json(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = errors
                    });
                }

                var exists = await _context.Sellers.AnyAsync(x => x.Email == model.Email);

                if (exists)
                {
                    return Json(new { success = false, message = "Email already registered." });
                }

                // 🔹 GST VALIDATION
                var gstResult = await _gstService.VerifyGST(model.GSTNumber);

                if (gstResult == null)
                    return Json(new { success = false, message = "GST not found." });

                if (gstResult.sts != "Active")
                    return Json(new { success = false, message = "GST is Inactive." });

                // 🔹 NAME MATCH
                var gstName = Normalize(gstResult.tradeNam);
                var inputName = Normalize(model.BusinessName);

                if (gstName != inputName)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Business name does not match with GST."
                    });
                }

                // 🔹 PAN VALIDATION
                if (!string.IsNullOrEmpty(model.PAN) &&
                    model.GSTNumber.Length >= 12)
                {
                    var gstPan = model.GSTNumber.Substring(2, 10);

                    if (!gstPan.Equals(model.PAN, StringComparison.OrdinalIgnoreCase))
                    {
                        return Json(new
                        {
                            success = false,
                            message = "PAN does not match GST."
                        });
                    }
                }

                // 🔹 SAVE SELLER
                var seller = new SellerModel
                {
                    BusinessName = model.BusinessName,
                    OwnerName = model.OwnerName,
                    Email = model.Email,
                    Phone = model.Phone,

                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),

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

                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Sellers.Add(seller);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Seller registered successfully!",
                    redirectUrl = "/Seller/SellerLogin"
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Error: " + ex.Message
                });
            }
        }

        // ================= LOGIN (GET) =================
        [HttpGet]
        public IActionResult SellerLogin()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> SellerLogin(string email, string password)
        {
            var seller = await _context.Sellers
                .FirstOrDefaultAsync(x => x.Email == email);

            if (seller == null)
            {
                return Json(new { success = false, message = "Invalid email or password" });
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(password, seller.PasswordHash);

            if (!isValid)
            {
                return Json(new { success = false, message = "Invalid email or password" });
            }

            if (!seller.IsActive)
            {
                return Json(new { success = false, message = "Account inactive / expired" });
            }

            // 🔐 SESSION
            HttpContext.Session.SetInt32("SellerId", seller.Id);

            return Json(new
            {
                success = true,
                message = "Login successful!",
                redirectUrl = "/Seller/Dashboard"
            });
        }

        // ================= DASHBOARD =================
        public IActionResult Dashboard()
        {
            var sellerId = HttpContext.Session.GetInt32("SellerId");

            if (sellerId == null)
                return RedirectToAction("SellerLogin");

            var seller = _context.Sellers.Find(sellerId);

            return View(seller);
        }

        // ================= LOGOUT =================
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("SellerLogin");
        }

        // ================= NORMALIZE =================
        private string Normalize(string text)
        {
            if (string.IsNullOrEmpty(text))
                return "";

            return new string(text
                .Where(char.IsLetterOrDigit)
                .ToArray())
                .ToLower();
        }
    }
}