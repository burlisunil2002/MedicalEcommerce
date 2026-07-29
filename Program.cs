using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Authentication.Cookies;
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

Console.WriteLine("=== Program.cs ===");
Console.WriteLine(builder.Configuration["Twilio:AccountSid"]);
Console.WriteLine(builder.Configuration["Twilio:AuthToken"]);
Console.WriteLine(builder.Configuration["Twilio:FromNumber"]);
Console.WriteLine("==================");

// Register MVC
builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;
    }); 
builder.Services.AddScoped<ProductService>();

// Session (only if you really need it)
builder.Services.AddSession();

builder.Services.AddScoped<ISmsService, TwilioSmsService>();

// Authentication
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;

    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

    options.Cookie.SameSite = SameSiteMode.None;

    // React Admin Login Page
    options.LoginPath = "/admin-login";

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.None;
});

builder.Services.AddAuthorization();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


// Email Service
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddTransient<EmailService>();


builder.Services.AddHttpClient<GstVerificationService>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContextService, UserContextService>();

builder.Services.AddScoped<InvoiceService>();

Rotativa.AspNetCore.RotativaConfiguration.Setup(builder.Environment.WebRootPath);

builder.Services.AddScoped<IFileStorageService, SupabaseService>();

builder.Services.AddScoped<ICouponService, CouponService>();

builder.Services.AddScoped<ICheckoutService, CheckoutService>();

builder.Services.AddScoped<ICartCalculationService, CartCalculationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "https://sunilmedicalproducts.online"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});



var app = builder.Build();

// ?? Single scope (BEST PRACTICE)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await DbSeeder.SeedAdminUser(services);


    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync(); // DB ready

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        string[] roles = { "Admin", "Customer", "Seller" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("ERROR: " + ex.Message);
        Console.WriteLine("INNER: " + ex.InnerException?.Message);
    }
}
// Middleware pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCors("ReactPolicy");

app.UseSession();

app.UseCookiePolicy();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapControllers();

app.MapFallbackToFile("react/index.html");

app.Run();



