using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;
        private readonly ILogger<ProductsController> _logger;
        private readonly IWebHostEnvironment _env;

        // Bumping this key invalidates every cached product list/detail at
        // once. Cheap and correct for a single-instance deployment. If this
        // app ever scales to multiple server instances behind a load
        // balancer, swap IMemoryCache for IDistributedCache (Redis) so all
        // instances share one version counter — otherwise instance B keeps
        // serving stale cached data after a write hits instance A.
        private const string CacheVersionKey = "products:cache:version";

        public ProductsController(
            UserManager<ApplicationUser> userManager,
            ProductService service,
            ApplicationDbContext context,
            IUserContextService userContext,
            IFileStorageService fileStorage,
            IMemoryCache cache,
            ILogger<ProductsController> logger,
            IWebHostEnvironment env)
        {
            _userManager = userManager;
            _service = service;
            _context = context;
            _userContext = userContext;
            _fileStorage = fileStorage;
            _cache = cache;
            _logger = logger;
            _env = env;
        }

        // ============================================================
        // SHARED HELPERS
        // ============================================================

        private IActionResult ErrorResponse(
            Exception ex,
            string logContext,
            string publicMessage,
            int statusCode = StatusCodes.Status500InternalServerError,
            string? userId = null)
        {
            _logger.LogError(ex, "{Context} | UserId={UserId}", logContext, userId ?? "unknown");

            // Previously several catch blocks (most seriously ChangeStatus,
            // which returned ex.ToString() as the entire response body)
            // leaked raw exception/stack trace text to the client. That's
            // hidden in Production now and only surfaced in Development.
            var detail = _env.IsDevelopment()
                ? (ex.InnerException?.Message ?? ex.Message)
                : null;

            return StatusCode(statusCode, new
            {
                success = false,
                message = publicMessage,
                error = detail
            });
        }

        private int GetCacheVersion()
        {
            return _cache.GetOrCreate(CacheVersionKey, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromDays(1);
                return 1;
            });
        }

        /// <summary>
        /// Call after any write that changes what a public product listing
        /// or detail page would show (add, edit, status change). Cheap:
        /// just increments a counter, which changes every cache key derived
        /// from it, so old entries become unreachable and expire naturally.
        /// </summary>
        private void InvalidateProductCache()
        {
            var current = GetCacheVersion();
            _cache.Set(CacheVersionKey, current + 1, TimeSpan.FromDays(1));
        }

        private bool ClientHasCurrentEtag(string etag)
        {
            return Request.Headers.TryGetValue("If-None-Match", out var incoming) &&
                   incoming.ToString() == etag;
        }

        private void SetCacheHeaders(string etag, int maxAgeSeconds)
        {
            Response.Headers["ETag"] = etag;
            Response.Headers["Cache-Control"] = $"public, max-age={maxAgeSeconds}";
        }

        private sealed record ProductListCacheEntry(object Products, int TotalCount);

        [HttpGet("/api/products/search")]
        public async Task<IActionResult> Search(string term, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(term))
                return Ok(new List<object>());

            var normalized = term.Trim().ToLower();

            var results = await _context.Products
                .AsNoTracking()
                .Include(p => p.Variants)
                .Where(p =>
                    p.Name.ToLower().Contains(normalized) ||
                    p.Brand.ToLower().Contains(normalized) ||
                    p.Variants.Any(v => v.Model.ToLower().Contains(normalized)))
                .Select(p => new
                {
                    id = p.Id,
                    brand = p.Brand,
                    name = p.Name,
                    category = p.Category,
                    imageUrl = p.ImageUrl,
                    priceType = p.PriceType,

                    minPrice = p.Variants.Any() ? p.Variants.Min(v => v.Price) : 0,
                    maxPrice = p.Variants.Any() ? p.Variants.Max(v => v.Price) : 0,

                    isHotDeal = p.IsHotDeal,
                    discount = p.DiscountPercentage ?? 0,
                    dealEndDate = p.DealEndDate
                })
                .Take(10)
                .ToListAsync(cancellationToken);

            return Ok(results);
        }

        // NOTE: previously this endpoint had no explicit route and relied on
        // MVC convention routing (/Products/GetSuggestions). Made it explicit
        // and consistent with the rest of the API. If your frontend currently
        // calls a different URL for autocomplete suggestions, point it here.
        [HttpGet("/api/products/suggestions")]
        public async Task<IActionResult> GetSuggestions(string term, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(term))
                return Ok(new List<object>());

            // Previously this loaded the ENTIRE Products table into app
            // memory (.AsEnumerable() before filtering) just to strip
            // punctuation before comparing. That's an unbounded, ever-slower
            // full table scan on every keystroke as the catalog grows.
            // Filtering directly in SQL loses the punctuation-stripping
            // trick, but Contains()+ToLower() is translatable to SQL and
            // covers the overwhelming majority of real searches.
            var normalized = term.Trim().ToLower();

            var data = await _context.Products
                .AsNoTracking()
                .Where(p =>
                    p.Status == "Active" &&
                    (p.Name.ToLower().Contains(normalized) ||
                     p.Category.ToLower().Contains(normalized)))
                .OrderBy(p => p.Name)
                .Take(8)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    category = p.Category
                })
                .ToListAsync(cancellationToken);

            return Ok(data);
        }

        //  Helpers //

        private async Task<SellerModel?> GetCurrentSellerAsync()
        {
            var userId = _userContext.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Sellers
                .FirstOrDefaultAsync(x => x.UserId == userId);
        }

        private bool HasActiveSubscription(SellerModel seller)
        {
            return seller.SubscriptionEndDate != null &&
                   seller.SubscriptionEndDate >= DateTime.UtcNow;
        }

        private int GetProductLimit(string productRange)
        {
            return productRange switch
            {
                "1-5" => 5,
                "6-10" => 10,
                "11-15" => 15,
                "16-20" => 20,
                "20+" => int.MaxValue,
                _ => 0
            };
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
                return Unauthorized(new { success = false, message = "User not found" });
            }

            bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

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

            var seller = await _context.Sellers.FirstOrDefaultAsync(x => x.UserId == userId);

            if (seller == null)
            {
                return BadRequest(new { success = false, message = "Seller not found" });
            }

            return Ok(new
            {
                success = true,
                sellerName = seller.BusinessName,
                isSubscribed = seller.SubscriptionEndDate != null && seller.SubscriptionEndDate > DateTime.UtcNow,
                isAdmin = false
            });
        }

        [Authorize]
        [HttpPost("/api/products")]
        public async Task<IActionResult> AddProducts(
            [FromForm] ProductModel product,
            IFormFile imageFile,
            IFormFile? quotationFile,
            CancellationToken cancellationToken)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                #region User Validation

                var userId = _userContext.GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found." });
                }

                bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    if (seller == null)
                    {
                        return Unauthorized(new { success = false, message = "Seller not found." });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(403, new
                        {
                            success = false,
                            message = "Your subscription has expired. Please renew it."
                        });
                    }

                    var activeSubscription = await _context.Subscriptions
                        .Where(x => x.SellerId == seller.SellerId && x.Status == "Active")
                        .OrderByDescending(x => x.EndDate)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (activeSubscription == null)
                    {
                        return BadRequest(new { success = false, message = "No active subscription found." });
                    }

                    int limit = GetProductLimit(activeSubscription.ProductRange);

                    int currentProducts = await _context.Products
                        .CountAsync(x => x.SellerId == seller.SellerId, cancellationToken);

                    if (currentProducts >= limit)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = $"Your subscription allows only {limit} products. Please upgrade your plan."
                        });
                    }

                    product.SellerId = seller.SellerId;
                }

                #endregion

                #region Product Validation

                if (string.IsNullOrWhiteSpace(product.Name))
                {
                    return BadRequest(new { success = false, message = "Product Name is required." });
                }

                if (string.IsNullOrWhiteSpace(product.Brand))
                {
                    return BadRequest(new { success = false, message = "Brand is required." });
                }

                if (string.IsNullOrWhiteSpace(product.Category))
                {
                    return BadRequest(new { success = false, message = "Category is required." });
                }

                if (string.IsNullOrWhiteSpace(product.Description))
                {
                    return BadRequest(new { success = false, message = "Description is required." });
                }

                if (imageFile == null || imageFile.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Please upload a product image." });
                }

                if (product.Variants == null || !product.Variants.Any())
                {
                    return BadRequest(new { success = false, message = "Please add at least one variant." });
                }

                #endregion

                #region Duplicate Prevention

                // Lightweight double-submit guard (e.g. user double-clicks
                // "Save"). Not a true idempotency mechanism — a proper fix
                // is a client-supplied idempotency key cached for a short
                // window — but this catches the common accidental case.
                bool existingProduct = await _context.Products
                    .AnyAsync(x =>
                        x.Name == product.Name &&
                        x.Brand == product.Brand &&
                        x.CreatedDate > DateTime.UtcNow.AddSeconds(-10),
                        cancellationToken);

                if (existingProduct)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Product is already being saved. Please wait."
                    });
                }

                #endregion

                #region Dates

                if (product.ExpiryDate.HasValue)
                {
                    product.ExpiryDate = DateTime
                        .SpecifyKind(product.ExpiryDate.Value, DateTimeKind.Local)
                        .ToUniversalTime();
                }

                if (product.DealEndDate.HasValue)
                {
                    product.DealEndDate = DateTime
                        .SpecifyKind(product.DealEndDate.Value, DateTimeKind.Local)
                        .ToUniversalTime();
                }

                product.CreatedDate = DateTime.UtcNow;
                product.Status = "Active";

                #endregion

                #region Product Image Upload

                product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");

                if (quotationFile != null && quotationFile.Length > 0)
                {
                    product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
                }

                #endregion

                #region Variants

                foreach (var v in product.Variants)
                {
                    if (string.IsNullOrWhiteSpace(v.Model))
                    {
                        return BadRequest(new { success = false, message = "Variant Model is required." });
                    }

                    if (v.Price <= 0)
                    {
                        return BadRequest(new { success = false, message = $"Please enter a valid price for '{v.Model}'." });
                    }

                    if (v.ImageFiles == null || !v.ImageFiles.Any())
                    {
                        return BadRequest(new { success = false, message = $"Please upload at least one image for '{v.Model}'." });
                    }

                    if (v.ImageFiles.Count > 5)
                    {
                        return BadRequest(new { success = false, message = $"Maximum 5 images allowed for '{v.Model}'." });
                    }

                    if (v.Specifications == null || !v.Specifications.Any())
                    {
                        return BadRequest(new { success = false, message = $"Please add at least one specification for '{v.Model}'." });
                    }

                    v.Status = "Active";

                    // Upload all images for this variant in parallel instead
                    // of one-by-one — with 5 images this turns 5x network
                    // round-trips into effectively 1x (bounded by the
                    // slowest upload), which matters a lot for "fast" saves
                    // when a seller is uploading product photos.
                    var filesToUpload = v.ImageFiles.Where(f => f.Length > 0).ToList();
                    var uploadedUrls = await Task.WhenAll(
                        filesToUpload.Select(f => _fileStorage.UploadAsync(f, "variants")));

                    int order = 1;
                    foreach (var url in uploadedUrls)
                    {
                        v.Images.Add(new ProductVariantImage
                        {
                            ImageUrl = url,
                            DisplayOrder = order++
                        });
                    }

                    v.Specifications = v.Specifications
                        .Where(x => !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.Value))
                        .ToList();

                    if (!v.Specifications.Any())
                    {
                        return BadRequest(new { success = false, message = $"Please add valid specifications for '{v.Model}'." });
                    }
                }

                #endregion

                _context.Products.Add(product);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                // New product should show up immediately on the storefront,
                // not after the cache TTL expires.
                InvalidateProductCache();

                return Ok(new
                {
                    success = true,
                    message = "Product added successfully.",
                    productId = product.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ErrorResponse(ex, "Failed to save product.", "Something went wrong while saving the product.");
            }
        }

        // ================= PRODUCT MANAGEMENT =================
        [Authorize]
        [HttpGet("/api/product-management")]
        public async Task<IActionResult> ProductManagement(
            string search = "",
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            try
            {
                page = page <= 0 ? 1 : page;
                pageSize = pageSize <= 0 ? 20 : Math.Clamp(pageSize, 1, 100);

                var userId = _userContext.GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found." });
                }

                bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                SellerModel? seller = null;

                if (!isAdmin)
                {
                    seller = await GetCurrentSellerAsync();

                    if (seller == null)
                    {
                        return BadRequest(new { success = false, message = "Seller not found." });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(403, new { success = false, message = "Subscription expired." });
                    }
                }

                var query = _context.Products
                    .AsNoTracking()
                    .Include(p => p.Variants).ThenInclude(v => v.Images)
                    .Include(p => p.Variants).ThenInclude(v => v.Specifications)
                    .AsQueryable();

                if (!isAdmin)
                {
                    query = query.Where(x => x.SellerId == seller!.SellerId);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var term = search.Trim().ToLower();

                    query = query.Where(x =>
                        x.Name.ToLower().Contains(term) ||
                        x.Brand.ToLower().Contains(term) ||
                        x.Category.ToLower().Contains(term));
                }

                var totalCount = await query.CountAsync(cancellationToken);

                var products = await query
                    .OrderByDescending(x => x.CreatedDate)
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

                        VariantCount = p.Variants.Count,

                        Variants = p.Variants
                            .OrderBy(v => v.ProductVariantId)
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

                                Images = v.Images
                                    .OrderBy(i => i.DisplayOrder)
                                    .Select(i => new { i.Id, i.ImageUrl, i.DisplayOrder }),

                                Specifications = v.Specifications
                                    .Select(s => new { s.Id, s.Key, s.Value })
                            })
                    })
                    .ToListAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    message = "Products loaded successfully.",
                    sellerName = isAdmin ? "Admin" : seller!.BusinessName,
                    isSubscribed = true,
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    products
                });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load product management list.", "An error occurred while loading products.");
            }
        }

        // ================= EDIT (GET) =================
        [Authorize]
        [HttpGet("/api/products/edit/{id}")]
        public async Task<IActionResult> GetProductForEdit(int id, CancellationToken cancellationToken)
        {
            try
            {
                var userId = _userContext.GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found." });
                }

                bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                var query = _context.Products
                    .Include(p => p.Variants).ThenInclude(v => v.Images)
                    .Include(p => p.Variants).ThenInclude(v => v.Specifications)
                    .AsQueryable();

                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    // Previously missing: seller could be null here (e.g.
                    // seller record deleted/never created) and the original
                    // code went straight to seller.SellerId, which throws a
                    // NullReferenceException (a raw 500 with no useful
                    // message) instead of a clean 401.
                    if (seller == null)
                    {
                        return Unauthorized(new { success = false, message = "Seller not found." });
                    }

                    query = query.Where(x => x.SellerId == seller.SellerId);
                }

                var product = await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (product == null)
                {
                    return NotFound(new { success = false, message = "Product not found." });
                }

                return Ok(new { success = true, product });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load product for edit.", "Failed to load product.");
            }
        }

        // ================= EDIT (POST) =================

        [Authorize]
        [HttpPut("/api/products/{id}")]
        public async Task<IActionResult> ProductEdit(
            int id,
            [FromForm] ProductModel model,
            IFormFile? imageFile,
            IFormFile? quotationFile,
            CancellationToken cancellationToken)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var userId = _userContext.GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found." });
                }

                bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                var query = _context.Products
                    .Include(p => p.Variants).ThenInclude(v => v.Images)
                    .Include(p => p.Variants).ThenInclude(v => v.Specifications)
                    .AsQueryable();

                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    // Same missing-null-check bug as GetProductForEdit,
                    // except here it would also have crashed one line later
                    // on HasActiveSubscription(seller).
                    if (seller == null)
                    {
                        return Unauthorized(new { success = false, message = "Seller not found." });
                    }

                    if (!HasActiveSubscription(seller))
                    {
                        return StatusCode(403, new { success = false, message = "Subscription expired." });
                    }

                    query = query.Where(x => x.SellerId == seller.SellerId);
                }

                var product = await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (product == null)
                {
                    return NotFound(new { success = false, message = "Product not found." });
                }

                #region Validation

                if (string.IsNullOrWhiteSpace(model.Name))
                {
                    return BadRequest(new { success = false, message = "Product Name is required." });
                }

                if (string.IsNullOrWhiteSpace(model.Brand))
                {
                    return BadRequest(new { success = false, message = "Brand is required." });
                }

                if (string.IsNullOrWhiteSpace(model.Category))
                {
                    return BadRequest(new { success = false, message = "Category is required." });
                }

                if (string.IsNullOrWhiteSpace(model.Description))
                {
                    return BadRequest(new { success = false, message = "Description is required." });
                }

                if (model.Variants == null || !model.Variants.Any())
                {
                    return BadRequest(new { success = false, message = "Please add at least one variant." });
                }

                #endregion

                #region Dates

                product.ExpiryDate = model.ExpiryDate?.ToUniversalTime();
                product.DealEndDate = model.DealEndDate?.ToUniversalTime();

                #endregion

                #region Product Update

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

                #endregion

                #region Product Files

                if (imageFile != null && imageFile.Length > 0)
                {
                    product.ImageUrl = await _fileStorage.UploadAsync(imageFile, "products");
                }

                if (quotationFile != null && quotationFile.Length > 0)
                {
                    product.QuotationUrl = await _fileStorage.UploadAsync(quotationFile, "quotations");
                }

                #endregion

                #region Remove Deleted Variants

                var incomingIds = model.Variants
                    .Where(v => v.ProductVariantId > 0)
                    .Select(v => v.ProductVariantId)
                    .ToList();

                var deletedVariants = product.Variants
                    .Where(v => !incomingIds.Contains(v.ProductVariantId))
                    .ToList();

                _context.ProductVariants.RemoveRange(deletedVariants);

                #endregion

                #region Save Variants

                foreach (var v in model.Variants)
                {
                    if (string.IsNullOrWhiteSpace(v.Model))
                    {
                        return BadRequest(new { success = false, message = "Variant Model is required." });
                    }

                    if (v.Price <= 0)
                    {
                        return BadRequest(new { success = false, message = $"Price is required for '{v.Model}'." });
                    }

                    if (!v.StockQuantity.HasValue || v.StockQuantity <= 0)
                    {
                        return BadRequest(new { success = false, message = $"Stock Quantity is required for '{v.Model}'." });
                    }

                    var existingVariant = product.Variants
                        .FirstOrDefault(x => x.ProductVariantId == v.ProductVariantId);

                    if (existingVariant != null)
                    {
                        existingVariant.Model = v.Model;
                        existingVariant.Size = v.Size;
                        existingVariant.Unit = v.Unit;
                        existingVariant.PackSize = v.PackSize;
                        existingVariant.MinQuantity = v.MinQuantity > 0 ? v.MinQuantity : 1;
                        existingVariant.MaxQuantity = v.MaxQuantity;
                        existingVariant.StepQuantity = v.StepQuantity > 0 ? v.StepQuantity : 1;
                        existingVariant.Price = v.Price;
                        existingVariant.StockQuantity = v.StockQuantity;
                        existingVariant.Status = "Active";

                        if (v.ImageFiles != null && v.ImageFiles.Any())
                        {
                            foreach (var img in existingVariant.Images.ToList())
                            {
                                _context.ProductVariantImages.Remove(img);
                            }

                            existingVariant.Images.Clear();

                            // Parallel upload — same rationale as AddProducts.
                            var filesToUpload = v.ImageFiles.Where(f => f.Length > 0).ToList();
                            var uploadedUrls = await Task.WhenAll(
                                filesToUpload.Select(f => _fileStorage.UploadAsync(f, "variants")));

                            int order = 1;
                            foreach (var url in uploadedUrls)
                            {
                                existingVariant.Images.Add(new ProductVariantImage
                                {
                                    ImageUrl = url,
                                    DisplayOrder = order++
                                });
                            }
                        }

                        _context.ProductSpecifications.RemoveRange(existingVariant.Specifications);
                        existingVariant.Specifications.Clear();

                        foreach (var s in v.Specifications.Where(x =>
                            !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.Value)))
                        {
                            existingVariant.Specifications.Add(new ProductSpecifications
                            {
                                Key = s.Key,
                                Value = s.Value
                            });
                        }
                    }
                    else
                    {
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

                        var newVariantFiles = (v.ImageFiles ?? Enumerable.Empty<IFormFile>())
                            .Where(f => f.Length > 0)
                            .ToList();

                        var newVariantUrls = await Task.WhenAll(
                            newVariantFiles.Select(f => _fileStorage.UploadAsync(f, "variants")));

                        int order = 1;
                        foreach (var url in newVariantUrls)
                        {
                            newVariant.Images.Add(new ProductVariantImage
                            {
                                ImageUrl = url,
                                DisplayOrder = order++
                            });
                        }

                        newVariant.Specifications = v.Specifications
                            .Where(x => !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.Value))
                            .Select(x => new ProductSpecifications { Key = x.Key, Value = x.Value })
                            .ToList();

                        product.Variants.Add(newVariant);
                    }
                }

                #endregion

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                InvalidateProductCache();

                return Ok(new
                {
                    success = true,
                    message = "Product updated successfully.",
                    productId = product.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ErrorResponse(ex, "Failed to update product.", "Something went wrong while updating the product.");
            }
        }

        [Authorize]
        [HttpPut("/api/products/change-status/{id}")]
        public async Task<IActionResult> ChangeStatus(int id, CancellationToken cancellationToken)
        {
            try
            {
                var userId = _userContext.GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found." });
                }

                bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (product == null)
                {
                    return NotFound(new { success = false, message = "Product not found" });
                }

                // CRITICAL FIX: previously there was no ownership check at
                // all here — any authenticated seller could deactivate any
                // other seller's (or admin's) product just by calling this
                // endpoint with that product's id. Now a non-admin caller
                // must actually own the product.
                if (!isAdmin)
                {
                    var seller = await GetCurrentSellerAsync();

                    if (seller == null || product.SellerId != seller.SellerId)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = "You are not authorized to modify this product."
                        });
                    }
                }

                product.Status = product.Status == "Active" ? "InActive" : "Active";

                await _context.SaveChangesAsync(cancellationToken);

                InvalidateProductCache();

                return Ok(new { success = true, status = product.Status });
            }
            catch (Exception ex)
            {
                // Previously: return StatusCode(500, ex.ToString()) — a full
                // stack trace, straight to the client, as the entire
                // response body. That's fixed.
                return ErrorResponse(ex, "Failed to change product status.", "Failed to update product status.");
            }
        }

        // ================= DETAILS =================
        [HttpGet("/api/products/details/{id}")]
        public async Task<IActionResult> GetDetails(int id, CancellationToken cancellationToken)
        {
            var version = GetCacheVersion();
            var cacheKey = $"product:details-light:v{version}:{id}";
            var etag = $"\"{cacheKey}\"";

            if (ClientHasCurrentEtag(etag))
            {
                return StatusCode(StatusCodes.Status304NotModified);
            }

            if (!_cache.TryGetValue(cacheKey, out object? cachedProduct))
            {
                var product = await _context.Products
                    .AsNoTracking()
                    .Where(p => p.Id == id)
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
                    .FirstOrDefaultAsync(cancellationToken);

                if (product == null)
                {
                    return NotFound(new { success = false, message = "Product not found" });
                }

                cachedProduct = product;
                _cache.Set(cacheKey, cachedProduct, TimeSpan.FromMinutes(5));
            }

            SetCacheHeaders(etag, maxAgeSeconds: 60);

            return Ok(new { success = true, product = cachedProduct });
        }

        // -------------------- REACT API ------------------------- //

        [HttpGet("/api/products")]
        public async Task<IActionResult> GetProducts(
            int page = 1,
            int pageSize = 24,
            CancellationToken cancellationToken = default)
        {
            // NOTE — behavior change, read before deploying:
            // This previously returned the entire active catalog in one
            // response with no limit. That does not scale — every home page
            // load pulled every product, every variant, and every image row
            // for the whole store. It's now paginated (24 per page by
            // default). The response BODY is still a flat array (same shape
            // your frontend already expects), but the total count now comes
            // back in the X-Total-Count / X-Total-Pages headers instead of
            // the body, so this doesn't break existing `res.json()` calls —
            // it just means only the first 24 products come back until the
            // frontend is updated to request further pages.
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 60);

            var version = GetCacheVersion();
            var cacheKey = $"products:list:v{version}:p{page}:s{pageSize}";
            var etag = $"\"{cacheKey}\"";

            if (ClientHasCurrentEtag(etag))
            {
                return StatusCode(StatusCodes.Status304NotModified);
            }

            if (!_cache.TryGetValue(cacheKey, out ProductListCacheEntry? cached))
            {
                var baseQuery = _context.Products
                    .AsNoTracking()
                    .Where(p => p.Status == "Active");

                var totalCount = await baseQuery.CountAsync(cancellationToken);

                var products = await baseQuery
                    .Include(p => p.Variants).ThenInclude(v => v.Images)
                    .OrderByDescending(p => p.CreatedDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        brand = p.Brand,
                        category = p.Category,
                        imageUrl = p.ImageUrl,
                        description = p.Description,
                        priceType = p.PriceType,

                        minPrice = p.Variants.Any() ? p.Variants.Min(v => v.Price) : 0,
                        maxPrice = p.Variants.Any() ? p.Variants.Max(v => v.Price) : 0,

                        isHotDeal = p.IsHotDeal,
                        discount = p.DiscountPercentage ?? 0,

                        defaultVariant = p.Variants
                            .Where(v => v.Status == "Active")
                            .OrderBy(v => v.ProductVariantId)
                            .Select(v => new
                            {
                                productVariantId = v.ProductVariantId,
                                model = v.Model,
                                price = v.Price,
                                stockQuantity = v.StockQuantity,
                                minQuantity = v.MinQuantity,
                                maxQuantity = v.MaxQuantity,
                                stepQuantity = v.StepQuantity,
                                imageUrl = v.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault()
                            })
                            .FirstOrDefault(),

                        variants = p.Variants
                            .Where(v => v.Status == "Active")
                            .Select(v => new
                            {
                                productVariantId = v.ProductVariantId,
                                model = v.Model,
                                size = v.Size,
                                unit = v.Unit,
                                packSize = v.PackSize,
                                price = v.Price,
                                stockQuantity = v.StockQuantity,
                                minQuantity = v.MinQuantity,
                                maxQuantity = v.MaxQuantity,
                                stepQuantity = v.StepQuantity,
                                imageUrl = v.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault()
                            })
                            .ToList()
                    })
                    .ToListAsync(cancellationToken);

                cached = new ProductListCacheEntry(products, totalCount);

                // Short TTL: even if a write somehow bypasses
                // InvalidateProductCache(), stale data self-heals within
                // 5 minutes rather than staying wrong indefinitely.
                _cache.Set(cacheKey, cached, TimeSpan.FromMinutes(5));
            }

            SetCacheHeaders(etag, maxAgeSeconds: 60);
            Response.Headers["X-Total-Count"] = cached!.TotalCount.ToString();
            Response.Headers["X-Page"] = page.ToString();
            Response.Headers["X-Page-Size"] = pageSize.ToString();
            Response.Headers["X-Total-Pages"] = ((int)Math.Ceiling(cached.TotalCount / (double)pageSize)).ToString();

            return Ok(cached.Products);
        }

        /* Details Page API */

        [HttpGet("/api/products/{id}")]
        public async Task<IActionResult> GetProduct(int id, CancellationToken cancellationToken)
        {
            try
            {
                var version = GetCacheVersion();
                var cacheKey = $"product:detail:v{version}:{id}";
                var etag = $"\"{cacheKey}\"";

                if (ClientHasCurrentEtag(etag))
                {
                    return StatusCode(StatusCodes.Status304NotModified);
                }

                if (!_cache.TryGetValue(cacheKey, out object? cachedProduct))
                {
                    var product = await _context.Products
                        .AsNoTracking()
                        .Where(p => p.Id == id && p.Status == "Active")
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
                                    minQuantity = v.MinQuantity,
                                    maxQuantity = v.MaxQuantity,
                                    stepQuantity = v.StepQuantity,

                                    images = v.Images
                                        .OrderBy(i => i.DisplayOrder)
                                        .Select(i => new { id = i.Id, imageUrl = i.ImageUrl, displayOrder = i.DisplayOrder })
                                        .ToList(),

                                    specifications = v.Specifications
                                        .Select(s => new { key = s.Key, value = s.Value })
                                        .ToList()
                                })
                                .ToList(),

                            defaultVariantId = p.Variants
                                .Where(v => v.Status == "Active")
                                .OrderBy(v => v.ProductVariantId)
                                .Select(v => v.ProductVariantId)
                                .FirstOrDefault()
                        })
                        .FirstOrDefaultAsync(cancellationToken);

                    if (product == null)
                    {
                        return NotFound(new { success = false, message = "Product not found." });
                    }

                    cachedProduct = product;
                    _cache.Set(cacheKey, cachedProduct, TimeSpan.FromMinutes(10));
                }

                SetCacheHeaders(etag, maxAgeSeconds: 120);

                return Ok(new { success = true, product = cachedProduct });
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Failed to load product details.", "Failed to load product details.");
            }
        }
    }
}
