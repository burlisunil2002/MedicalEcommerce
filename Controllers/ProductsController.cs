using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Storage;
using VivekMedicalProducts.ViewModels;

namespace VivekMedicalProducts.Controllers
{
    public class ProductsController : Controller
    {
        private readonly ProductService _service;
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;
        private readonly IFileStorageService _fileStorage;

        public ProductsController(
            ProductService service,
            ApplicationDbContext context,
            IUserContextService userContext,
            IFileStorageService fileStorage)
        {
            _service = service;
            _context = context;
            _userContext = userContext;
            _fileStorage = fileStorage;
        }

        // ================= INDEX =================
        public IActionResult Index(string? searchString, string? category)
        {
            var products = _context.Products.AsQueryable();

            // 🔥 AUTO EXPIRE HOT DEALS
            var now = DateTime.UtcNow;

            var expiredDeals = _context.Products
                .Where(p => p.IsHotDeal
                    && p.DealEndDate.HasValue
                    && p.DealEndDate <= now)
                .ToList();

            if (expiredDeals.Any())
            {
                foreach (var product in expiredDeals)
                {
                    product.IsHotDeal = false;
                }

                _context.SaveChanges();
            }

            if (!string.IsNullOrEmpty(searchString))
            {
                var normalizedSearch = Normalize(searchString);

                products = products
                    .AsEnumerable() // 🔥 switch to memory (important)
                    .Where(p =>
                        Normalize(p.Name).Contains(normalizedSearch) ||
                        Normalize(p.Category).Contains(normalizedSearch)
                    )
                    .AsQueryable();
            }

            if (!string.IsNullOrEmpty(category))
                products = products.Where(p => p.Category == category);

            // 🔥 GET UNIQUE CATEGORIES WITH IMAGE
            ViewBag.Categories = _context.Products
                .Where(p => p.Category != null)
                .GroupBy(p => p.Category)
                .Select(g => new
                {
                    Name = g.Key,
                    ImageUrl = g.Where(x => x.ImageUrl != null)
                             .Select(x => x.ImageUrl)
                             .FirstOrDefault()
                })
                .ToList();

            var userId = _userContext.GetUserId();

            var cartItems = _context.Carts
                            .Where(c => c.UserId == userId)
                            .ToList();

            var result = products
                .ToList()
                .Select(p => new VivekMedicalProducts.ViewModels.ProductViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Category = p.Category,
                    Price = p.Price,
                    GSTPercentage = p.GSTPercentage,
                    ImageUrl = p.ImageUrl,
                    QuotationUrl = p.QuotationUrl,
                    PriceType = p.PriceType,
                    IsHotDeal = p.IsHotDeal,
                    DiscountPercentage = p.DiscountPercentage,
                    DealEndDate = p.DealEndDate,

                    CartQuantity = cartItems
                        .Where(c => c.ProductId == p.Id)
                        .Select(c => c.Quantity)
                        .FirstOrDefault()
                })
                .ToList();

            if (!result.Any())
                TempData["InfoMessage"] = "No products available.";

            return View(result);
        }

        [HttpGet]
        public IActionResult GetSuggestions(string term)
        {
            var normalizedSearch = Normalize(term);

            var data = _context.Products
                .AsEnumerable()
                .Where(p =>
                    Normalize(p.Name).Contains(normalizedSearch) ||
                    Normalize(p.Category).Contains(normalizedSearch)
                )
                .Take(8)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    category = p.Category
                })
                .ToList();

            return Json(data);
        }

        private string Normalize(string text)
        {
            if (string.IsNullOrEmpty(text))
                return "";

            // remove special characters and spaces
            var cleaned = new string(text
                .Where(c => char.IsLetterOrDigit(c))
                .ToArray());

            return cleaned.ToLower();
        }

        // ================= ADD (GET) =================
        [HttpGet]
        public IActionResult AddProducts()
        {
            return View();
        }

        // ================= ADD (POST) =================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProducts(
    ProductModel product,
    IFormFile imageFile,
    IFormFile quotationFile)
        {
            if (!ModelState.IsValid)
                return View(product);

            try
            {
                // ✅ COMMON ALLOWED TYPES
                var allowedTypes = new[]
                {
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
        };

                // ================= IMAGE FILE =================
                if (imageFile != null && imageFile.Length > 0)
                {
                    if (!allowedTypes.Contains(imageFile.ContentType))
                    {
                        ModelState.AddModelError("", "Only JPG, PNG, PDF, DOC, DOCX allowed");
                        return View(product);
                    }

                    if (imageFile.Length > 10 * 1024 * 1024)
                    {
                        ModelState.AddModelError("", "File must be less than 10MB");
                        return View(product);
                    }

                    product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");
                }

                // ================= QUOTATION FILE =================
                if (quotationFile != null && quotationFile.Length > 0)
                {
                    if (!allowedTypes.Contains(quotationFile.ContentType))
                    {
                        ModelState.AddModelError("", "Only JPG, PNG, PDF, DOC, DOCX allowed");
                        return View(product);
                    }

                    if (quotationFile.Length > 10 * 1024 * 1024)
                    {
                        ModelState.AddModelError("", "File must be less than 10MB");
                        return View(product);
                    }

                    product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
                }

                // ================= SAVE =================
                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                TempData["SuccessMessage"] = "Product added successfully!";
                return RedirectToAction("AddProducts");
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", "Upload failed: " + ex.Message);
                return View(product);
            }
        }

        // ================= PRODUCT MANAGEMENT =================
        public IActionResult ProductManagement()
        {
            var products = _context.Products.ToList();
            return View(products);
        }

        // ================= EDIT (GET) =================
        [HttpGet]
        public IActionResult ProductEdit(int id)
        {
            var product = _context.Products.Find(id);
            if (product == null)
                return NotFound();

            return View(product);
        }

        // ================= EDIT (POST) =================

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ProductEdit(
  ProductModel model,
  IFormFile imageFile,
  IFormFile quotationFile)
        {
            // 🔥 Fix validation issues
            ModelState.Remove("imageFile");
            ModelState.Remove("quotationFile");

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var product = await _context.Products.FindAsync(model.Id);
            if (product == null)
                return NotFound();

            // ================= BASIC =================
            product.Name = model.Name;
            product.Price = model.Price;
            product.GSTPercentage = model.GSTPercentage;
            product.Description = model.Description;
            product.Category = model.Category;
            product.PriceType = model.PriceType;

            // ================= HOT DEAL =================
            product.IsHotDeal = model.IsHotDeal;
            product.DiscountPercentage = model.DiscountPercentage;

            // 🔥 IMPORTANT: PostgreSQL UTC FIX
            product.DealEndDate = model.DealEndDate.HasValue
                ? model.DealEndDate.Value.ToUniversalTime()
                : null;

            // ================= IMAGE =================
            if (imageFile != null && imageFile.Length > 0)
            {
                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");
            }

            // ================= PDF =================
            if (quotationFile != null && quotationFile.Length > 0)
            {
                product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
            }

            var result = await _context.SaveChangesAsync();
            Console.WriteLine("Rows affected: " + result);

            return RedirectToAction("ProductManagement");
        }


     /*   [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ProductEdit(ProductEditViewModel model)
        {
            var product = await _context.Products.FindAsync(model.Id);

            if (product == null)
                return NotFound();

            product.IsHotDeal = model.IsHotDeal;
            product.DiscountPercentage = model.DiscountPercentage;

            // 🔥 FIX HERE
            product.DealEndDate = model.DealEndDate.HasValue
                ? DateTime.SpecifyKind(model.DealEndDate.Value, DateTimeKind.Utc)
                : null;

            await _context.SaveChangesAsync();

            return RedirectToAction("ProductManagement"); // ✅ REQUIRED
        } */

        // ================= DELETE =================
        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
                return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Product deleted successfully!";
            return RedirectToAction("ProductManagement");
        }

        // ================= DETAILS =================
        public IActionResult Details(int id)
        {
            var product = _context.Products.FirstOrDefault(p => p.Id == id);

            if (product == null)
                return NotFound();

            return View(product);
        }

        // ================= AJAX DETAILS =================
        [HttpGet]
        public IActionResult GetDetails(int id)
        {
            var product = _context.Products
                                  .Where(p => p.Id == id)
                                  .Select(p => new
                                  {
                                      p.Id,
                                      p.Name,
                                      p.Category,
                                      p.Price,
                                      p.Description,
                                      p.ImageUrl,
                                      p.PriceType,
                                      p.IsHotDeal,
                                      p.DiscountPercentage,
                                      p.DealEndDate
                                  })
                                  .FirstOrDefault();

            if (product == null)
                return NotFound();

            return Json(product);
        }
    }
}