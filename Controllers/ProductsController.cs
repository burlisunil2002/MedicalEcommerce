using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
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
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IFileStorageService _fileStorage;

        public ProductsController(
            UserManager<ApplicationUser> userManager,
            ProductService service,
            ApplicationDbContext context,
            IUserContextService userContext,
            IFileStorageService fileStorage)
        {
            _userManager = userManager;
            _service = service;
            _context = context;
            _userContext = userContext;
            _fileStorage = fileStorage;
        }

        [HttpGet("/api/products/search")]
        public IActionResult Search(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
                return Ok(new List<object>());

            term = term.ToLower();

            var results = _context.Products
                .Include(p => p.Variants)
                .Where(p =>
                    p.Name.ToLower().Contains(term) ||
                    p.Brand.ToLower().Contains(term) ||
                    p.Variants.Any(v => v.Model.ToLower().Contains(term))
                )
                .Select(p => new
                {
                    id = p.Id,
                    brand = p.Brand,
                    name = p.Name,
                    category = p.Category,
                    imageUrl = p.ImageUrl,
                    priceType = p.PriceType,

                    minPrice = p.Variants.Any()
         ? p.Variants.Min(v => v.Price)
         : 0,

                    maxPrice = p.Variants.Any()
         ? p.Variants.Max(v => v.Price)
         : 0,

                    isHotDeal = p.IsHotDeal,
                    discount = p.DiscountPercentage ?? 0,
                    dealEndDate = p.DealEndDate
                })
                .Take(10)
                .ToList();

            return Ok(results);
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


        public async Task<IActionResult> AddProducts()
        {
            var userId = _userContext.GetUserId();

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return RedirectToAction("Login", "Account");

            // 🔥 Check role
            bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

            SellerModel seller = null;

            if (!isAdmin)
            {
                seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);

                if (seller == null)
                    return RedirectToAction("SellerLogin", "Seller");

                ViewBag.sellerName = seller.BusinessName;
                ViewBag.IsSubscribed = seller.SubscriptionEndDate != null &&
                                       seller.SubscriptionEndDate > DateTime.UtcNow;
            }
            else
            {
                ViewBag.sellerName = "Admin";
                ViewBag.IsSubscribed = true;
            }

            return View(new ProductModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProducts(
      ProductModel product,
      IFormFile imageFile,
      IFormFile quotationFile)
        {
            var userId = _userContext.GetUserId();
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return RedirectToAction("Login", "Account");

            bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

            if (!isAdmin)
            {
                var seller = _context.Sellers.FirstOrDefault(s => s.UserId == userId);
                if (seller == null)
                    return RedirectToAction("SellerLogin", "Seller");

                product.SellerId = seller.SellerId;
            }

            // ✅ UTC FIX
            if (product.ExpiryDate.HasValue)
                product.ExpiryDate = DateTime.SpecifyKind(product.ExpiryDate.Value, DateTimeKind.Local).ToUniversalTime();

            if (product.DealEndDate.HasValue)
                product.DealEndDate = DateTime.SpecifyKind(product.DealEndDate.Value, DateTimeKind.Local).ToUniversalTime();

            product.CreatedDate = DateTime.UtcNow;
            product.Status = "Active";

            // ✅ PRODUCT IMAGE
            if (imageFile != null && imageFile.Length > 0)
                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");

            // ✅ VARIANTS
            if (product.Variants != null && product.Variants.Any())
            {
                foreach (var v in product.Variants)
                {
                    v.Status = "Active";

                    // 🔥 VARIANT IMAGE
                    if (v.ImageFile != null && v.ImageFile.Length > 0)
                    {
                        v.ImageUrl = await _fileStorage.UploadAsync(v.ImageFile, "variants");
                    }

                    // CLEAN SPECS
                    if (v.Specifications != null)
                    {
                        v.Specifications = v.Specifications
                            .Where(s => !string.IsNullOrWhiteSpace(s.Key) &&
                                        !string.IsNullOrWhiteSpace(s.Value))
                            .ToList();
                    }
                }
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Product added successfully!";
            return RedirectToAction("ProductManagement");
        }

        // ================= PRODUCT MANAGEMENT =================
        public IActionResult ProductManagement()
        {
            if (!User.Identity.IsAuthenticated)
                return RedirectToAction("SellerLogin", "Seller");

            List<ProductModel> products;

            // 👑 ADMIN
            if (User.IsInRole("Admin"))
            {
                products = _context.Products
    .Include(p => p.Variants)
        .ThenInclude(v => v.Specifications) // 🔥 NEW
    .OrderByDescending(p => p.CreatedDate)
    .ToList();

                ViewBag.sellerName = "Admin";
                ViewBag.IsSubscribed = true;

                return View(products);
            }

            // 🧑 SELLER
            var userId = _userContext.GetUserId();

            var seller = _context.Sellers
                .FirstOrDefault(s => s.UserId == userId);

            if (seller == null)
                return RedirectToAction("SellerLogin", "Seller");

            // 🔥 subscription check
            if (seller.SubscriptionEndDate == null ||
                seller.SubscriptionEndDate < DateTime.UtcNow)
            {
                TempData["ErrorMessage"] = "Your subscription has expired. Please upgrade your plan.";
                return Redirect("/Subscription");
            }

            ViewBag.sellerName = seller.BusinessName;
            ViewBag.IsSubscribed = true;

            products = _context.Products
    .Include(p => p.Variants)
        .ThenInclude(v => v.Specifications) // 🔥 NEW
    .OrderByDescending(p => p.CreatedDate)
    .ToList();

            return View(products);
        }

        // ================= EDIT (GET) =================
        [HttpGet]
        public IActionResult ProductEdit(int id)
        {
            var product = _context.Products
    .Include(p => p.Variants)
        .ThenInclude(v => v.Specifications)
    .FirstOrDefault(p => p.Id == id);

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
            var product = await _context.Products
                .Include(p => p.Variants)
                .ThenInclude(v => v.Specifications)
                .FirstOrDefaultAsync(p => p.Id == model.Id);

            if (product == null)
                return NotFound();

            // ✅ UTC FIX
            if (model.ExpiryDate.HasValue)
                product.ExpiryDate = DateTime.SpecifyKind(model.ExpiryDate.Value, DateTimeKind.Local).ToUniversalTime();

            if (model.DealEndDate.HasValue)
                product.DealEndDate = DateTime.SpecifyKind(model.DealEndDate.Value, DateTimeKind.Local).ToUniversalTime();

            // ✅ BASIC UPDATE
            product.Name = model.Name;
            product.Brand = model.Brand;
            product.Category = model.Category;
            product.Description = model.Description;
            product.PriceType = model.PriceType;
            product.GSTPercentage = model.GSTPercentage;
            product.HSNCode = model.HSNCode;
            product.Weight = model.Weight;
            product.BatchNumber = model.BatchNumber;
            product.IsFragile = model.IsFragile;
            product.IsHotDeal = model.IsHotDeal;
            product.DiscountPercentage = model.DiscountPercentage;

            // ✅ PRODUCT IMAGE
            if (imageFile != null && imageFile.Length > 0)
                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");

            // 🔥 STORE OLD VARIANTS (CRITICAL)
            var oldVariants = product.Variants.ToList();

            // ❌ REMOVE OLD
            _context.ProductVariants.RemoveRange(product.Variants);

            var newVariants = new List<ProductVariant>();

            if (model.Variants != null && model.Variants.Any())
            {
                foreach (var v in model.Variants)
                {
                    // Skip empty rows
                    if (string.IsNullOrWhiteSpace(v.Model) &&
                        v.Price <= 0 &&
                        v.StockQuantity <= 0)
                        continue;

                    var oldVariant = oldVariants
                        .FirstOrDefault(x => x.ProductVariantId == v.ProductVariantId);

                    var newVariant = new ProductVariant
                    {
                        ProductId = product.Id,
                        Model = v.Model,
                        Size = v.Size,
                        Unit = v.Unit,
                        PackSize = v.PackSize,
                        MinQuantity = v.MinQuantity > 0 ? v.MinQuantity : 1,
                        MaxQuantity = v.MaxQuantity,
                        StepQuantity = v.StepQuantity > 0 ? v.StepQuantity : 1,
                        Price = v.Price,
                        StockQuantity = v.StockQuantity,
                        Status = "Active"
                    };

                    // 🔥 IMAGE (FINAL LOGIC)
                    if (v.ImageFile != null && v.ImageFile.Length > 0)
                    {
                        newVariant.ImageUrl = await _fileStorage.UploadAsync(v.ImageFile, "variants");
                    }
                    else
                    {
                        newVariant.ImageUrl = oldVariant?.ImageUrl;
                    }

                    // 🔥 SPECS
                    if (v.Specifications != null)
                    {
                        newVariant.Specifications = v.Specifications
                            .Where(s => !string.IsNullOrWhiteSpace(s.Key) &&
                                        !string.IsNullOrWhiteSpace(s.Value))
                            .Select(s => new ProductSpecifications
                            {
                                Key = s.Key,
                                Value = s.Value
                            }).ToList();
                    }

                    newVariants.Add(newVariant);
                }
            }

            product.Variants = newVariants;

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
                                     // p.Price,
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


// -------------------- REACT API ------------------------- //

        [HttpGet("/api/products")]
        public IActionResult GetProducts()
        {
            var products = _context.Products
               .Include(p => p.Variants)
               .Where(p => p.Status == "Active")
               .Select(p => new
               {
                   id = p.Id,
                   name = p.Name,
                   brand = p.Brand,
                   category = p.Category,
                   imageUrl = p.ImageUrl,
                   description = p.Description,
                   priceType = p.PriceType,
                   // 🔥 PRICE RANGE
                   minPrice = p.Variants.Any()
                                ? p.Variants.Min(v => v.Price)
                                : 0,

                   maxPrice = p.Variants.Any()
                                ? p.Variants.Max(v => v.Price)
                                : 0,

                   isHotDeal = p.IsHotDeal,
                   discount = p.DiscountPercentage ?? 0,
                  

                   // 🔥 VARIANTS
                   variants = p.Variants
                       .Where(v => v.Status == "Active")
                       .Select(v => new
                       {
                           id = v.ProductVariantId,

                           model = v.Model,
                           size = v.Size,
                           unit = v.Unit,
                           packSize = v.PackSize,

                           price = v.Price,
                           stock = v.StockQuantity,

                           minQty = v.MinQuantity,
                           maxQty = v.MaxQuantity,
                           stepQty = v.StepQuantity,
                           specifications = v.Specifications.Select(s => new
                           {
                               key = s.Key,
                               value = s.Value
                           }).ToList()
                       }).ToList()
               })
                .ToList();

            if (products == null)
                return NotFound();

            return Ok(products);
        }

        /* Details Page API */

        [HttpGet("/api/products/{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    brand = p.Brand,
                    category = p.Category,
                    description = p.Description,
                    imageUrl = p.ImageUrl,

                    priceType = p.PriceType,
                    isHotDeal = p.IsHotDeal,
                    discountPercentage = p.DiscountPercentage,
                    gstPercentage = p.GSTPercentage,


                    // 🔥 VARIANTS (WITH IMAGE + SPECS)
                    variants = p.Variants
    .Where(v => v.Status == "Active")
    .OrderBy(v => v.ProductVariantId)
    .Select(v => new
    {
        id = v.ProductVariantId,

        model = v.Model,
        size = v.Size,
        unit = v.Unit,
        packSize = v.PackSize,

        price = v.Price,
        stock = v.StockQuantity,

        // FIX HERE
        minQuantity = v.MinQuantity,
        maxQuantity = v.MaxQuantity,
        stepQuantity = v.StepQuantity,

        imageUrl = v.ImageUrl,

        specifications = v.Specifications
            .Select(s => new
            {
                key = s.Key,
                value = s.Value
            })
            .ToList()
    })
    .ToList(),

                    // 🔥 DEFAULT VARIANT (FIRST)
                    defaultVariantId = p.Variants
                        .Where(v => v.Status == "Active")
                        .OrderBy(v => v.ProductVariantId)
                        .Select(v => v.ProductVariantId)
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (product == null)
                return NotFound();

            return Ok(product);
        }

    }
}


