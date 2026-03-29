using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Storage;

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

            if (!string.IsNullOrEmpty(searchString))
                products = products.Where(p => p.Name.Contains(searchString));

            if (!string.IsNullOrEmpty(category))
                products = products.Where(p => p.Category == category);

            ViewBag.Categories = _context.Products
                                .Select(p => p.Category)
                                .Distinct()
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

        // ================= ADD (GET) =================
        [HttpGet]
        public IActionResult AddProducts()
        {
            return View();
        }

        // ================= ADD (POST) =================
        [HttpPost]
        public async Task<IActionResult> AddProducts(ProductModel product,
                                                    IFormFile imageFile,
                                                    IFormFile quotationFile)
        {
            if (!ModelState.IsValid)
                return View(product);

            // IMAGE UPLOAD
            if (imageFile != null && imageFile.Length > 0)
            {
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };

                if (!allowedTypes.Contains(imageFile.ContentType))
                {
                    ModelState.AddModelError("", "Only JPG/PNG allowed");
                    return View(product);
                }

                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");
            }

            // QUOTATION UPLOAD (PDF)
            if (quotationFile != null && quotationFile.Length > 0)
            {
                if (quotationFile.ContentType != "application/pdf")
                {
                    ModelState.AddModelError("", "Only PDF allowed");
                    return View(product);
                }

                product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Product added successfully!";
            return RedirectToAction("Index");
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
        public async Task<IActionResult> ProductEdit(ProductModel model,
                                                     IFormFile imageFile,
                                                     IFormFile quotationFile)
        {
            var product = await _context.Products.FindAsync(model.Id);

            if (product == null)
                return NotFound();

            product.Name = model.Name;
            product.Price = model.Price;
            product.GSTPercentage = model.GSTPercentage;
            product.Description = model.Description;
            product.Category = model.Category;
            product.PriceType = model.PriceType;

            // IMAGE UPDATE
            if (imageFile != null && imageFile.Length > 0)
            {
                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");
            }

            // PDF UPDATE
            if (quotationFile != null && quotationFile.Length > 0)
            {
                product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
            }

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Product updated successfully!";
            return RedirectToAction("ProductManagement");
        }

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
                                      p.PriceType
                                  })
                                  .FirstOrDefault();

            if (product == null)
                return NotFound();

            return Json(product);
        }
    }
}