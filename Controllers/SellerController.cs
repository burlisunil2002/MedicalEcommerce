using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public SellerController(
    ApplicationDbContext context,
    GstVerificationService gstService,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager)
        {
            _context = context;
            _gstService = gstService;
            _userManager = userManager;
            _signInManager = signInManager;
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
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 🔹 VALIDATION
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new
                        {
                            field = x.Key,
                            errors = x.Value.Errors.Select(e => e.ErrorMessage)
                        });

                    return Json(new { success = false, message = "Validation failed", errors });
                }

                // 🔥 PRODUCT TYPE CHECK
                if (string.IsNullOrWhiteSpace(model.ProductType))
                {
                    return Json(new { success = false, message = "Please select product type" });
                }

                // 🔹 CHECK USER
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    return Json(new { success = false, message = "User already exists." });
                }

                // 🔹 CREATE USER
                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (!result.Succeeded)
                {
                    return Json(new
                    {
                        success = false,
                        message = string.Join(", ", result.Errors.Select(e => e.Description))
                    });
                }

                await _userManager.AddToRoleAsync(user, "Seller");

                // 🔹 CREATE SELLER
                var seller = new SellerModel
                {
                    BusinessName = model.BusinessName,
                    OwnerName = model.OwnerName,
                    ProductType = model.ProductType,
                    Brand = model.Brand,

                    Email = model.Email,
                    Phone = model.Phone,

                    UserId = user.Id,

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

                    // 🔥 SUBSCRIPTION FLOW
                    SubscriptionEndDate = null,
                    IsActive = true,
                    Status = "Active",

                    CreatedAt = DateTime.UtcNow
                };

                _context.Sellers.Add(seller);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Json(new
                {
                    success = true,
                    message = "Registered successfully! Please subscribe.",
                    redirectUrl = "/SellerLanding"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return Json(new
                {
                    success = false,
                    message = ex.InnerException?.Message ?? ex.Message
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
            await _signInManager.SignOutAsync();

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                TempData["Error"] = "User not found";
                return View();
            }

            // ❌ block OTP users
            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                TempData["Error"] = "This account is not a seller account.";
                return View();
            }

            var seller = await _context.Sellers
                .FirstOrDefaultAsync(s => s.UserId == user.Id);

            if (seller == null)
            {
                TempData["Error"] = "Seller account not found.";
                return View();
            }

            var result = await _signInManager.PasswordSignInAsync(
                user.UserName, password, false, false);

            if (!result.Succeeded)
            {
                TempData["Error"] = "Invalid password";
                return View();
            }

            // 🔥 SUBSCRIPTION CHECK
            if (seller.SubscriptionEndDate == null ||
                seller.SubscriptionEndDate <= DateTime.UtcNow)
            {
                TempData["Info"] = "Please complete your subscription.";
                return Redirect("/Subscription");
            }

            return RedirectToAction("SellerLanding");
        }

        // ================= DASHBOARD =================
        [Authorize(Roles = "Seller")]
        public IActionResult SellerLanding()
        {
            // 🔹 Check authentication (extra safety for multi-login system)
            if (!User.Identity.IsAuthenticated)
            {
                TempData["Error"] = "Please login as seller.";
                return Redirect("/Seller/SellerLogin");
            }

            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrEmpty(userId))
            {
                TempData["Error"] = "User session expired. Please login again.";
                return Redirect("/Seller/SellerLogin");
            }

            // 🔹 Get seller
            Console.WriteLine("UserId: " + userId);

            var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

            if (seller == null)
            {
                Console.WriteLine("❌ Seller NOT found for UserId: " + userId);
                TempData["Error"] = "Seller account not found. Contact support.";
                return Redirect("/Seller/SellerLogin");
            }

            int sellerId = seller.SellerId;

            // 🔥 SUBSCRIPTION CHECK
            bool isSubscribed = seller.SubscriptionEndDate != null &&
                                seller.SubscriptionEndDate > DateTime.UtcNow;

            if (!isSubscribed)
            {
                TempData["Error"] = "Please purchase a subscription to access dashboard.";
                return Redirect("/Subscription");
            }

            // 🔥 STATS
            var totalProducts = _context.Products
                .Count(p => p.SellerId == sellerId);

            var totalOrders = _context.OrderItems
                .Count(o => o.SellerId == sellerId);

            var revenue = _context.OrderItems
                .Where(o => o.SellerId == sellerId)
                .Join(_context.Orders,
                    oi => oi.OrderId,
                    o => o.OrderId,
                    (oi, o) => new { oi, o })
                .Where(x => x.o.PaymentStatus == "Completed")
                .Sum(x => (decimal?)x.oi.Price * x.oi.Quantity) ?? 0;

            // 🔥 PRODUCT LIMIT
            var sub = _context.Subscriptions
                .Where(x => x.SellerId == sellerId && x.Status == "Active")
                .OrderByDescending(x => x.CreatedDate)
                .FirstOrDefault();

            int productLimit = sub?.ProductRange switch
            {
                "1-5" => 5,
                "6-10" => 10,
                "11-15" => 15,
                "16-20" => 20,
                "20+" => 999,
                _ => 0
            };

            // 🔥 VIEW DATA
            ViewBag.SellerName = seller.BusinessName;
            ViewBag.IsSubscribed = isSubscribed;
            ViewBag.TotalProducts = totalProducts;
            ViewBag.TotalOrders = totalOrders;
            ViewBag.Revenue = revenue;
            ViewBag.ProductLimit = productLimit;

            TempData["Success"] = "Welcome back, " + seller.BusinessName + "!";

            return View();
        }

        // ================= LOGOUT =================
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
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
        // 🔥 CHECK SUBSCRIPTION
        private bool IsSubscriptionActive(int sellerId)
        {
            var seller = _context.Sellers.FirstOrDefault(s => s.SellerId == sellerId);

            return seller != null &&
                   seller.SubscriptionEndDate != null &&
                   seller.SubscriptionEndDate > DateTime.UtcNow;
        }

        // 🔥 PRODUCT LIMIT
        private int GetProductLimit(int sellerId)
        {
            var sub = _context.Subscriptions
                .Where(x => x.SellerId == sellerId && x.Status == "Active")
                .OrderByDescending(x => x.CreatedDate)
                .FirstOrDefault();

            if (sub == null) return 0;

            return sub.ProductRange switch
            {
                "1-5" => 5,
                "6-10" => 10,
                "11-15" => 15,
                "16-20" => 20,
                "20+" => 999,
                _ => 0
            };
        }

    }
}