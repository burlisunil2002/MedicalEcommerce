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


        [Authorize]
        [HttpGet("/api/products/add-product-info")]
        public async Task<IActionResult> AddProductInfo()
        {
            var userId = _userContext.GetUserId();

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User not found"
                });
            }

            bool isAdmin =
                await _userManager.IsInRoleAsync(
                    user,
                    "Admin"
                );

            if (isAdmin)
            {
                return Ok(new
                {
                    success = true,
                    sellerName = "Admin",
                    isSubscribed = true,
                    isAdmin = true
                });
            }

            var seller =
                await _context.Sellers
                    .FirstOrDefaultAsync(x =>
                        x.UserId == userId);

            if (seller == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Seller not found"
                });
            }

            return Ok(new
            {
                success = true,
                sellerName = seller.BusinessName,
                isSubscribed =
                    seller.SubscriptionEndDate != null &&
                    seller.SubscriptionEndDate > DateTime.UtcNow,
                isAdmin = false
            });
        }

        [Authorize]
        [HttpPost("/api/products")]
        public async Task<IActionResult> AddProducts(
     [FromForm] ProductModel product,
     IFormFile imageFile,
     IFormFile? quotationFile)
        {

            foreach (var variant in product.Variants)
            {
                Console.WriteLine("--------------------------------");
                Console.WriteLine($"Model : {variant.Model}");
                Console.WriteLine($"Images : {variant.ImageFiles?.Count ?? 0}");

                if (variant.ImageFiles != null)
                {
                    foreach (var file in variant.ImageFiles)
                    {
                        Console.WriteLine(file.FileName);
                    }
                }
            }
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                #region User Validation

                var userId = _userContext.GetUserId();

                var user =
                    await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "User not found."
                    });
                }

                bool isAdmin =
                    await _userManager.IsInRoleAsync(
                        user,
                        "Admin");

                if (!isAdmin)
                {
                    var seller =
                        await _context.Sellers
                            .FirstOrDefaultAsync(x =>
                                x.UserId == userId);

                    if (seller == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Seller not found."
                        });
                    }

                    product.SellerId =
                        seller.SellerId;
                }

                #endregion

                #region Product Validation

                if (string.IsNullOrWhiteSpace(
                        product.Name))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Product Name is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        product.Brand))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Brand is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        product.Category))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Category is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        product.Description))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Description is required."
                    });
                }

                if (imageFile == null ||
                    imageFile.Length == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Please upload a product image."
                    });
                }

                if (product.Variants == null ||
                    !product.Variants.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Please add at least one variant."
                    });
                }

                #endregion

                #region Duplicate Prevention

                bool existingProduct =
                    await _context.Products
                        .AnyAsync(x =>
                            x.Name == product.Name &&
                            x.Brand == product.Brand &&
                            x.CreatedDate >
                            DateTime.UtcNow
                                .AddSeconds(-10));

                if (existingProduct)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Product is already being saved. Please wait."
                    });
                }

                #endregion

                #region Dates

                if (product.ExpiryDate.HasValue)
                {
                    product.ExpiryDate =
                        DateTime
                            .SpecifyKind(
                                product.ExpiryDate.Value,
                                DateTimeKind.Local)
                            .ToUniversalTime();
                }

                if (product.DealEndDate.HasValue)
                {
                    product.DealEndDate =
                        DateTime
                            .SpecifyKind(
                                product.DealEndDate.Value,
                                DateTimeKind.Local)
                            .ToUniversalTime();
                }

                product.CreatedDate =
                    DateTime.UtcNow;

                product.Status = "Active";

                #endregion

                #region Product Image Upload

                product.ImageUrl =
                    await _fileStorage.UploadAsync(
                        imageFile,
                        "products");

                if (quotationFile != null &&
                    quotationFile.Length > 0)
                {
                    product.QuotationUrl =
                        await _fileStorage.UploadAsync(
                            quotationFile,
                            "quotations");
                }

                #endregion

                #region Variants

                foreach (var v in product.Variants)
                {
                    if (string.IsNullOrWhiteSpace(
                            v.Model))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "Variant Model is required."
                        });
                    }

                    if (v.Price <= 0)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Please enter a valid price for '{v.Model}'."
                        });
                    }

                    if (v.ImageFiles == null ||
                        !v.ImageFiles.Any())
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Please upload at least one image for '{v.Model}'."
                        });
                    }

                    if (v.ImageFiles.Count > 5)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Maximum 5 images allowed for '{v.Model}'."
                        });
                    }

                    if (v.Specifications == null ||
                        !v.Specifications.Any())
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Please add at least one specification for '{v.Model}'."
                        });
                    }

                    v.Status = "Active";

                    int order = 1;

                    foreach (var file in v.ImageFiles)
                    {
                        if (file.Length <= 0)
                            continue;

                        var imageUrl =
                            await _fileStorage
                                .UploadAsync(
                                    file,
                                    "variants");

                        v.Images.Add(
                            new ProductVariantImage
                            {
                                ImageUrl =
                                    imageUrl,
                                DisplayOrder =
                                    order++
                            });
                    }

                    v.Specifications =
                        v.Specifications
                            .Where(x =>
                                !string.IsNullOrWhiteSpace(
                                    x.Key) &&
                                !string.IsNullOrWhiteSpace(
                                    x.Value))
                            .ToList();

                    if (!v.Specifications.Any())
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Please add valid specifications for '{v.Model}'."
                        });
                    }
                }

                #endregion

                _context.Products.Add(product);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Product added successfully.",
                    productId = product.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Something went wrong while saving the product.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }
        // ================= PRODUCT MANAGEMENT =================
        [Authorize]
        [HttpGet("/api/product-management")]
        public async Task<IActionResult> ProductManagement(
     string search = "",
     int page = 1,
     int pageSize = 20)
        {
            try
            {
                page = page <= 0 ? 1 : page;
                pageSize = pageSize <= 0 ? 20 : pageSize;

                var userId = _userContext.GetUserId();

                var user =
                    await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "User not found."
                    });
                }

                bool isAdmin =
                    await _userManager.IsInRoleAsync(
                        user,
                        "Admin");

                SellerModel seller = null;

                if (!isAdmin)
                {
                    seller =
                        await _context.Sellers
                            .AsNoTracking()
                            .FirstOrDefaultAsync(x =>
                                x.UserId == userId);

                    if (seller == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Seller not found."
                        });
                    }

                    if (seller.SubscriptionEndDate == null ||
                        seller.SubscriptionEndDate < DateTime.UtcNow)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Your subscription has expired."
                        });
                    }
                }

                var query =
                    _context.Products
                        .AsNoTracking()
                        .Include(p => p.Variants)
                            .ThenInclude(v => v.Images)
                        .Include(p => p.Variants)
                            .ThenInclude(v => v.Specifications)
                        .AsQueryable();

                if (!isAdmin)
                {
                    query = query.Where(x =>
                        x.SellerId ==
                        seller.SellerId);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    search = search.Trim().ToLower();

                    query = query.Where(x =>
                        x.Name.ToLower().Contains(search) ||
                        x.Brand.ToLower().Contains(search) ||
                        x.Category.ToLower().Contains(search));
                }

                var totalCount =
                    await query.CountAsync();

                var products =
                    await query
                        .OrderByDescending(x =>
                            x.CreatedDate)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(p => new
                        {
                            p.Id,
                            p.Name,
                            p.Brand,
                            p.Category,
                            p.Description,
                            p.ImageUrl,
                            p.GSTPercentage,
                            p.HSNCode,
                            p.PriceType,
                            p.IsHotDeal,
                            p.DiscountPercentage,
                            p.DealEndDate,
                            p.Status,
                            p.CreatedDate,

                            VariantCount =
                                p.Variants.Count,

                            Variants =
                                p.Variants
                                    .OrderBy(v =>
                                        v.ProductVariantId)
                                    .Select(v => new
                                    {
                                        v.ProductVariantId,
                                        v.Model,
                                        v.Size,
                                        v.Unit,
                                        v.PackSize,
                                        v.MinQuantity,
                                        v.MaxQuantity,
                                        v.StepQuantity,
                                        v.Price,
                                        v.StockQuantity,
                                        v.Status,

                                        Images =
                                            v.Images
                                                .OrderBy(i =>
                                                    i.DisplayOrder)
                                                .Select(i => new
                                                {
                                                    i.Id,
                                                    i.ImageUrl,
                                                    i.DisplayOrder
                                                }),

                                        Specifications =
                                            v.Specifications
                                                .Select(s => new
                                                {
                                                    s.Id,
                                                    s.Key,
                                                    s.Value
                                                })
                                    })
                        })
                        .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Products loaded successfully.",

                    sellerName =
                        isAdmin
                            ? "Admin"
                            : seller.BusinessName,

                    isSubscribed = true,

                    page,
                    pageSize,
                    totalCount,
                    totalPages =
                        (int)Math.Ceiling(
                            totalCount /
                            (double)pageSize),

                    products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500,
                    new
                    {
                        success = false,
                        message =
                            "An error occurred while loading products.",
                        error =
                            ex.InnerException?.Message ??
                            ex.Message
                    });
            }
        }

        // ================= EDIT (GET) =================
        [Authorize]
        [HttpGet("/api/products/edit/{id}")]
        public async Task<IActionResult> GetProductForEdit(int id)
        {
            try
            {
                var product = await _context.Products
                    .AsNoTracking()
                    .Include(p => p.Variants)
                        .ThenInclude(v => v.Images)
                    .Include(p => p.Variants)
                        .ThenInclude(v => v.Specifications)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (product == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Product not found."
                    });
                }

                return Ok(new
                {
                    success = true,
                    product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to load product.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }

        // ================= EDIT (POST) =================

        [Authorize]
        [HttpPut("/api/products/{id}")]
        public async Task<IActionResult> ProductEdit(
     int id,
     [FromForm] ProductModel model,
     IFormFile? imageFile,
     IFormFile? quotationFile)
        {
            using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                var product =
                    await _context.Products
                        .Include(p => p.Variants)
                            .ThenInclude(v => v.Images)
                        .Include(p => p.Variants)
                            .ThenInclude(v => v.Specifications)
                        .FirstOrDefaultAsync(p =>
                            p.Id == id);

                if (product == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Product not found."
                    });
                }

                #region Validation

                if (string.IsNullOrWhiteSpace(
                        model.Name))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Product Name is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        model.Brand))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Brand is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        model.Category))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Category is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                        model.Description))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Description is required."
                    });
                }

                if (model.Variants == null ||
                    !model.Variants.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Please add at least one variant."
                    });
                }

                #endregion

                #region Dates

                product.ExpiryDate =
                    model.ExpiryDate?.ToUniversalTime();

                product.DealEndDate =
                    model.DealEndDate?.ToUniversalTime();

                #endregion

                #region Product Update

                product.Name =
                    model.Name;

                product.Brand =
                    model.Brand;

                product.Category =
                    model.Category;

                product.Description =
                    model.Description;

                product.PriceType =
                    model.PriceType;

                product.GSTPercentage =
                    model.GSTPercentage;

                product.HSNCode =
                    model.HSNCode;

                product.Weight =
                    model.Weight;

                product.BatchNumber =
                    model.BatchNumber;

                product.IsFragile =
                    model.IsFragile;

                product.IsHotDeal =
                    model.IsHotDeal;

                product.DiscountPercentage =
                    model.DiscountPercentage;

                #endregion

                #region Product Files

                if (imageFile != null &&
                    imageFile.Length > 0)
                {
                    product.ImageUrl =
                        await _fileStorage
                            .UploadAsync(
                                imageFile,
                                "products");
                }

                if (quotationFile != null &&
                    quotationFile.Length > 0)
                {
                    product.QuotationUrl =
                        await _fileStorage
                            .UploadAsync(
                                quotationFile,
                                "quotations");
                }

                #endregion

                #region Remove Deleted Variants

                var incomingIds =
                    model.Variants
                        .Where(v =>
                            v.ProductVariantId > 0)
                        .Select(v =>
                            v.ProductVariantId)
                        .ToList();

                var deletedVariants =
                    product.Variants
                        .Where(v =>
                            !incomingIds
                                .Contains(
                                    v.ProductVariantId))
                        .ToList();

                _context.ProductVariants
                    .RemoveRange(
                        deletedVariants);

                #endregion

                #region Save Variants

                foreach (var v in model.Variants)
                {
                    if (string.IsNullOrWhiteSpace(
                            v.Model))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "Variant Model is required."
                        });
                    }

                    if (v.Price <= 0)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Price is required for '{v.Model}'."
                        });
                    }

                    if (!v.StockQuantity.HasValue ||
                        v.StockQuantity <= 0)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                $"Stock Quantity is required for '{v.Model}'."
                        });
                    }

                    var existingVariant =
                        product.Variants
                            .FirstOrDefault(x =>
                                x.ProductVariantId ==
                                v.ProductVariantId);

                    if (existingVariant != null)
                    {
                        existingVariant.Model =
                            v.Model;

                        existingVariant.Size =
                            v.Size;

                        existingVariant.Unit =
                            v.Unit;

                        existingVariant.PackSize =
                            v.PackSize;

                        existingVariant.MinQuantity =
                            v.MinQuantity > 0
                                ? v.MinQuantity
                                : 1;

                        existingVariant.MaxQuantity =
                            v.MaxQuantity;

                        existingVariant.StepQuantity =
                            v.StepQuantity > 0
                                ? v.StepQuantity
                                : 1;

                        existingVariant.Price =
                            v.Price;

                        existingVariant.StockQuantity =
                            v.StockQuantity;

                        existingVariant.Status =
                            "Active";

                        // Images
                        if (v.ImageFiles != null &&
                            v.ImageFiles.Any())
                        {
                            foreach (var img in existingVariant.Images.ToList())
                            {
                                _context.ProductVariantImages.Remove(img);
                            }

                            existingVariant.Images.Clear();

                            int order = 1;

                            foreach (var file
                                in v.ImageFiles)
                            {
                                var imageUrl =
                                    await _fileStorage
                                        .UploadAsync(
                                            file,
                                            "variants");

                                existingVariant.Images
                                    .Add(
                                        new ProductVariantImage
                                        {
                                            ImageUrl =
                                                imageUrl,
                                            DisplayOrder =
                                                order++
                                        });
                            }
                        }

                        // Specifications
                        _context
                            .ProductSpecifications
                            .RemoveRange(
                                existingVariant
                                    .Specifications);

                        existingVariant
                            .Specifications
                            .Clear();

                        foreach (var s in
                            v.Specifications
                                .Where(x =>
                                    !string
                                        .IsNullOrWhiteSpace(
                                            x.Key) &&
                                    !string
                                        .IsNullOrWhiteSpace(
                                            x.Value)))
                        {
                            existingVariant
                                .Specifications
                                .Add(
                                    new ProductSpecifications
                                    {
                                        Key = s.Key,
                                        Value = s.Value
                                    });
                        }
                    }
                    else
                    {
                        var newVariant =
                            new ProductVariant
                            {
                                ProductId =
                                    product.Id,
                                Model =
                                    v.Model,
                                Size =
                                    v.Size,
                                Unit =
                                    v.Unit,
                                PackSize =
                                    v.PackSize,
                                MinQuantity =
                                    v.MinQuantity > 0
                                        ? v.MinQuantity
                                        : 1,
                                MaxQuantity =
                                    v.MaxQuantity,
                                StepQuantity =
                                    v.StepQuantity > 0
                                        ? v.StepQuantity
                                        : 1,
                                Price =
                                    v.Price,
                                StockQuantity =
                                    v.StockQuantity,
                                Status =
                                    "Active"
                            };

                        int order = 1;

                        foreach (var file
                            in v.ImageFiles ??
                            Enumerable.Empty<IFormFile>())
                        {
                            var imageUrl =
                                await _fileStorage
                                    .UploadAsync(
                                        file,
                                        "variants");

                            newVariant.Images.Add(
                                new ProductVariantImage
                                {
                                    ImageUrl =
                                        imageUrl,
                                    DisplayOrder =
                                        order++
                                });
                        }

                        newVariant.Specifications =
                            v.Specifications
                                .Where(x =>
                                    !string
                                        .IsNullOrWhiteSpace(
                                            x.Key) &&
                                    !string
                                        .IsNullOrWhiteSpace(
                                            x.Value))
                                .Select(x =>
                                    new ProductSpecifications
                                    {
                                        Key = x.Key,
                                        Value = x.Value
                                    })
                                .ToList();

                        product.Variants
                            .Add(newVariant);
                    }
                }

                #endregion

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Product updated successfully.",
                    productId = product.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Something went wrong while updating the product.",
                    error =
                        ex.InnerException?.Message ??
                        ex.Message
                });
            }
        }


        [Authorize]
        [HttpPut("/api/products/change-status/{id}")]
        public async Task<IActionResult> ChangeStatus(int id)
        {
            try
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (product == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Product not found"
                    });
                }

                product.Status = product.Status == "Active"
     ? "InActive"
     : "Active";

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    status = product.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        // ================= DETAILS =================
        [HttpGet("/api/products/details/{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var product =
                await _context.Products
                    .Where(p =>
                        p.Id == id)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Category,
                        p.Description,
                        p.ImageUrl,
                        p.PriceType,
                        p.IsHotDeal,
                        p.DiscountPercentage,
                        p.DealEndDate
                    })
                    .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Product not found"
                });
            }

            return Ok(new
            {
                success = true,
                product
            });
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
            try
            {
                var product = await _context.Products
                    .AsNoTracking()
                    .Where(p =>
                        p.Id == id &&
                        p.Status == "Active")
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
                        discountPercentage =
                            p.DiscountPercentage,
                        gstPercentage =
                            p.GSTPercentage,

                        variants =
                            p.Variants
                                .Where(v =>
                                    v.Status == "Active")
                                .OrderBy(v =>
                                    v.ProductVariantId)
                                .Select(v => new
                                {
                                    id =
                                        v.ProductVariantId,

                                    model =
                                        v.Model,

                                    size =
                                        v.Size,

                                    unit =
                                        v.Unit,

                                    packSize =
                                        v.PackSize,

                                    price =
                                        v.Price,

                                    stock =
                                        v.StockQuantity,

                                    minQuantity =
                                        v.MinQuantity,

                                    maxQuantity =
                                        v.MaxQuantity,

                                    stepQuantity =
                                        v.StepQuantity,

                                    images =
                                        v.Images
                                            .OrderBy(i =>
                                                i.DisplayOrder)
                                            .Select(i => new
                                            {
                                                id =
                                                    i.Id,

                                                imageUrl =
                                                    i.ImageUrl,

                                                displayOrder =
                                                    i.DisplayOrder
                                            })
                                            .ToList(),

                                    specifications =
                                        v.Specifications
                                            .Select(s => new
                                            {
                                                key =
                                                    s.Key,

                                                value =
                                                    s.Value
                                            })
                                            .ToList()
                                })
                                .ToList(),

                        defaultVariantId =
                            p.Variants
                                .Where(v =>
                                    v.Status == "Active")
                                .OrderBy(v =>
                                    v.ProductVariantId)
                                .Select(v =>
                                    v.ProductVariantId)
                                .FirstOrDefault()
                    })
                    .FirstOrDefaultAsync();

                if (product == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message =
                            "Product not found."
                    });
                }

                return Ok(new
                {
                    success = true,
                    product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500,
                    new
                    {
                        success = false,
                        message =
                            "Failed to load product details.",
                        error =
                            ex.InnerException?.Message ??
                            ex.Message
                    });
            }
        }
    }
}


