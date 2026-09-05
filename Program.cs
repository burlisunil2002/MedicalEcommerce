using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rotativa.AspNetCore;
using System.Text.Json.Serialization;
using VivekMedicalProducts.Configuration;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Notification;
using VivekMedicalProducts.Services.Storage;

var builder = WebApplication.CreateBuilder(args);


// =====================================================
// MVC / API
// =====================================================

builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;
    });


// =====================================================
// APPLICATION SERVICES
// =====================================================

builder.Services.AddScoped<ProductService>();

builder.Services.AddScoped<ISmsService, TwilioSmsService>();

builder.Services.AddHttpClient<GstVerificationService>();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IUserContextService, UserContextService>();

builder.Services.AddScoped<InvoiceService>();

builder.Services.AddScoped<IFileStorageService, SupabaseService>();

builder.Services.AddScoped<ICouponService, CouponService>();

builder.Services.AddScoped<ICheckoutService, CheckoutService>();

builder.Services.AddScoped<ICartCalculationService, CartCalculationService>();


// =====================================================
// SESSION
// =====================================================

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);

    options.Cookie.HttpOnly = true;

    options.Cookie.IsEssential = true;

    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

    options.Cookie.SameSite = SameSiteMode.Lax;
});


// =====================================================
// DATABASE
// =====================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"
        ),
        npgsqlOptions =>
        {
            npgsqlOptions.CommandTimeout(60);
        }
    );
});


// =====================================================
// ASP.NET IDENTITY
// =====================================================

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();


// =====================================================
// AUTHENTICATION COOKIE
// =====================================================

builder.Services.ConfigureApplicationCookie(options =>
{
    // Authentication cookie
    options.Cookie.Name = "VMP.Auth";

    // Prevent JavaScript access
    options.Cookie.HttpOnly = true;

    // HTTPS only in production
    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

    /*
     * React frontend -> API
     *
     * Keep None if frontend and backend
     * are on different origins.
     */
    options.Cookie.SameSite = SameSiteMode.None;

    options.Cookie.Path = "/";

    /*
     * Persistent login lifetime.
     *
     * Because your SignInAsync uses
     * isPersistent: true, the cookie survives
     * browser restart.
     */
    options.ExpireTimeSpan = TimeSpan.FromDays(30);

    /*
     * Active users get their expiry extended.
     */
    options.SlidingExpiration = true;

    /*
     * API should return 401 instead of redirecting
     * to an HTML login page.
     */
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode =
            StatusCodes.Status401Unauthorized;

        return Task.CompletedTask;
    };

    /*
     * API should return 403 instead of redirecting.
     */
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode =
            StatusCodes.Status403Forbidden;

        return Task.CompletedTask;
    };
});


builder.Services.AddAuthorization();


// =====================================================
// EMAIL
// =====================================================

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

builder.Services.AddTransient<EmailService>();


// =====================================================
// ROTATIVA
// =====================================================

Rotativa.AspNetCore.RotativaConfiguration
    .Setup(builder.Environment.WebRootPath);


// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy
                .WithOrigins(
                    "https://sunilmedicalproducts.online"
                // Add this only if you actually use www:
                // "https://www.sunilmedicalproducts.online"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});


var app = builder.Build();


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var context =
            services.GetRequiredService<ApplicationDbContext>();

        // Database first
        await context.Database.MigrateAsync();


        // Roles
        var roleManager =
            services.GetRequiredService<RoleManager<IdentityRole>>();

        string[] roles =
        {
            "Admin",
            "Customer",
            "Seller"
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(
                    new IdentityRole(role)
                );
            }
        }


        // Admin user after database is ready
        await DbSeeder.SeedAdminUser(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            $"Database initialization failed: {ex}"
        );
    }
}


// =====================================================
// PRODUCTION ERROR HANDLING
// =====================================================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");

    app.UseHsts();
}


// =====================================================
// MIDDLEWARE
// =====================================================

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCors("ReactPolicy");

app.UseSession();

app.UseAuthentication();

app.UseAuthorization();


// =====================================================
// ROUTES
// =====================================================

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapControllers();

app.MapFallbackToFile("react/index.html");

app.Run();