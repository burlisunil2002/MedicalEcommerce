using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

namespace VivekMedicalProducts.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly InvoiceService _invoiceService;
        private readonly EmailService _emailService;

        public AdminController(
            ApplicationDbContext context,
            InvoiceService invoiceService,
            EmailService emailService)
        {
            _context = context;
            _invoiceService = invoiceService;
            _emailService = emailService;
        }

        // =========================
        // ADMIN HOME
        // =========================
        public IActionResult AdminHome()
        {
            return View();
        }
      
    }
}