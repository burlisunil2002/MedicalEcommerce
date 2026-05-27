using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rotativa.AspNetCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;
using VivekMedicalProducts.Services.Storage;



var builder = WebApplication.CreateBuilder(args);

// Register MVC
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<ProductService>();

// Session (only if you really need it)
builder.Services.AddSession();

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
    options.Cookie.SameSite = SameSiteMode.None;             // ?? MUST

    options.LoginPath = "/Account/Login";
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


// ? MVC ROUTES (VERY IMPORTANT)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");


// ? API ROUTES
app.MapControllers();


// ? REACT FALLBACK (ONLY AFTER MVC FAILS)
app.MapFallbackToFile("react/index.html");

app.Run();


