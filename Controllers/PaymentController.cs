using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    [Authorize]
    public class PaymentController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public PaymentController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ===============================
        // PAYMENT PAGE
        // ===============================
        public async Task<IActionResult> Index(int orderId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return RedirectToAction("Login", "Account");

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null)
                return RedirectToAction("Index", "Cart");

            var vm = new PaymentViewModel
            {
                OrderId = order.OrderId,
                SubTotal = order.SubTotal ?? 0,
                GST = order.GST ?? 0,
                GrandTotal = order.GrandTotal ?? 0
            };

            return View(vm);
        }

        // ===============================
        // SUBMIT PAYMENT
        // ===============================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SubmitPayment(PaymentViewModel model)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return RedirectToAction("Login", "Account");

            if (!ModelState.IsValid)
                return View("Index", model);

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == model.OrderId && o.UserId == userId);

            if (order == null)
            {
                ModelState.AddModelError("", "Order not found.");
                return View("Index", model);
            }

            // Check duplicate UTR
            bool utrExists = await _context.Payments
                .AnyAsync(p => p.UTRNumber.ToLower() == model.UTRNumber.ToLower());

            if (utrExists)
            {
                ModelState.AddModelError("", "UTR already used.");
                return View("Index", model);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Save Screenshot
                string screenshotName = await SaveScreenshotAsync(model.PaymentScreenshot);

                // Create Payment
                var payment = new PaymentModel
                {
                    OrderId = order.OrderId,
                    UserId = userId,
                    UTRNumber = model.UTRNumber.Trim(),
                    PaymentScreenshot = screenshotName,
                    Amount = order.GrandTotal ?? 0,
                    PaymentStatus = "Pending",
                    PaymentDate = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();


                return RedirectToAction("PaymentSuccess");

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", ex.Message);
                return View("Index", model);
            }
        }

        // ===============================
        // SUCCESS PAGE
        // ===============================
        public IActionResult PaymentSuccess()
        {
            TempData["PaymentSuccess"] = "true";

            return RedirectToAction("Index", "Products");
        }

        // ===============================
        // PRIVATE METHODS
        // ===============================

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        private async Task<string> SaveScreenshotAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Invalid file.");

            if (file.Length > 5 * 1024 * 1024)
                throw new Exception("File too large.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                throw new Exception("Invalid file type.");

            string folder = Path.Combine(_env.WebRootPath, "paymentproof");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string fileName = Guid.NewGuid() + extension;
            string path = Path.Combine(folder, fileName);

            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            return "/paymentproof/" + fileName;
        }
    }
}