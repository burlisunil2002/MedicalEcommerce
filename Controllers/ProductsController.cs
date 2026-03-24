using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

namespace VivekMedicalProducts.Controllers
{
    public class ProductsController : Controller
    {
        private readonly ProductService _service;
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;


        public ProductsController(ProductService service, IWebHostEnvironment env, ApplicationDbContext context, IUserContextService userContext)
        {
            _service = service;
            _env = env;
            _context = context;
            _userContext = userContext;

        }

        // Show all products + Search + Category filter
        public IActionResult Index(string? searchString, string? category)
        {
            var products = _context.Products.AsQueryable();

            // 🔍 Search
            if (!string.IsNullOrEmpty(searchString))
            {
                products = products.Where(p => p.Name.Contains(searchString));
            }

            // 📂 Category filter
            if (!string.IsNullOrEmpty(category))
            {
                products = products.Where(p => p.Category == category);
            }

            // 📦 Load categories
            ViewBag.Categories = _context.Products
                                .Select(p => p.Category)
                                .Distinct()
                                .ToList();

            // 👤 Get UserId or SessionId (Amazon style)
            var userId = _userContext.GetUserId();


            // 🛒 Get cart items
            var cartItems = _context.Carts
                            .Where(c => c.UserId == userId)
                            .ToList();

            // Convert to ViewModel
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
                    ImagePath = p.ImagePath,
                    QuotationPath = p.QuotationPath,
                    PriceType = p.PriceType,

                    CartQuantity = cartItems
                            .Where(c => c.ProductId == p.Id)
                            .Select(c => c.Quantity)
                            .FirstOrDefault()
                })
                .ToList();

            if (!result.Any())
            {
                TempData["InfoMessage"] = "No products available.";
            }

            return View(result);
        }


        // Show add product form
        [HttpGet]
        public IActionResult AddProducts()
        {
            return View();
        }

        // PRODUCT LIST PAGE
        public IActionResult ProductManagement()
        {
            var products = _context.Products.ToList();
            return View(products);
        }


        [HttpGet]
        public IActionResult ProductEdit(int id)
        {
            var product = _context.Products.Find(id);
            if (product == null)
                return NotFound();

            return View(product);
        }

        // EDIT POST
        [HttpPost]
        public IActionResult ProductEdit(ProductModel model, IFormFile imageFile, IFormFile quotationFile)
        {
            var product = _context.Products.Find(model.Id);

            if (product == null)
                return NotFound();

            product.Name = model.Name;
            product.Price = model.Price;
            product.GSTPercentage = model.GSTPercentage;
            product.Description = model.Description;

            // IMAGE UPLOAD
            if (imageFile != null)
            {
                var fileName = Guid.NewGuid() + Path.GetExtension(imageFile.FileName);
                var path = Path.Combine("wwwroot/images", fileName);

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    imageFile.CopyTo(stream);
                }

                product.ImagePath = "/images/" + fileName;
            }

            // QUOTATION UPLOAD
            if (quotationFile != null)
            {
                var fileName = Guid.NewGuid() + Path.GetExtension(quotationFile.FileName);
                var path = Path.Combine("wwwroot/quotations", fileName);

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    quotationFile.CopyTo(stream);
                }

                product.QuotationPath = "/quotations/" + fileName;
            }

            _context.SaveChanges();

            TempData["SuccessMessage"] = "Product updated successfully!";

            return RedirectToAction("ProductManagement");
        }


        // DELETE (POST)
        [HttpPost]
        public IActionResult Delete(int id)
        {
            var product = _context.Products.Find(id);

            if (product == null)
                return NotFound();

            _context.Products.Remove(product);
            _context.SaveChanges();

            TempData["SuccessMessage"] = "Product Deleted successfully!";

            return RedirectToAction("ProductManagement");
        }

        public IActionResult Details(int id)
        {
            var product = _context.Products.FirstOrDefault(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            return View(product);
        }

        // GET: /Products/GetDetails/5
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
                                      p.ImagePath,
                                      p.PriceType
                                  })
                                  .FirstOrDefault();

            if (product == null)
                return NotFound();

            return Json(product);
        }


        // Handle form submission
        [HttpPost]
        public async Task<IActionResult> AddProducts(ProductModel product,
                                            IFormFile imageFile,
                                            IFormFile quotationFile)
        {
            if (product.PriceType == "Normal" && product.Price == null)
            {
                ModelState.AddModelError("Price", "Price is required for Normal price type");
            }
            if (!ModelState.IsValid)
            {
                return View(product);
            }

            // ================= IMAGE UPLOAD =================
            if (imageFile != null && imageFile.Length > 0)
            {
                string imageFolder = Path.Combine(_env.WebRootPath, "images");
                Directory.CreateDirectory(imageFolder);

                string imageFileName = Guid.NewGuid() + Path.GetExtension(imageFile.FileName);
                string imagePath = Path.Combine(imageFolder, imageFileName);

                using (var stream = new FileStream(imagePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(stream);
                }

                product.ImagePath = "/images/" + imageFileName;
            }

            // ================= QUOTATION UPLOAD =================
            if (quotationFile != null && quotationFile.Length > 0)
            {
                string quotationFolder = Path.Combine(_env.WebRootPath, "quotations");
                Directory.CreateDirectory(quotationFolder);

                string quotationFileName = Guid.NewGuid() + Path.GetExtension(quotationFile.FileName);
                string quotationPath = Path.Combine(quotationFolder, quotationFileName);

                using (var stream = new FileStream(quotationPath, FileMode.Create))
                {
                    await quotationFile.CopyToAsync(stream);
                }

                product.QuotationPath = "/quotations/" + quotationFileName;
            }

            _service.AddProducts(product);

            TempData["SuccessMessage"] = "Product added successfully!";
            return RedirectToAction("Index");
        }
        public IActionResult ViewQuotation(int id)
        {
            var product = _context.Products.FirstOrDefault(p => p.Id == id);

            if (product == null || string.IsNullOrEmpty(product.QuotationPath))
                return NotFound();

            var filePath = Path.Combine(_env.WebRootPath, product.QuotationPath.TrimStart('/'));

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            var contentType = "application/pdf";  // mainly for PDF viewing

            return File(fileBytes, contentType);

        }
    }
}