using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Models;
namespace VivekMedicalProducts.Data;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<ProductModel> Products { get; set; }

    public DbSet<SellerModel> Sellers { get; set; }

    public DbSet<EnquiryModel> Enquiry { get; set; }

    public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }
    public DbSet<CartModel> Carts { get; set; }

    public DbSet<CartModel> CartItems { get; set; }

    public DbSet<OrderModel> Orders { get; set; }
    public DbSet<OrderItemModel> OrderItems { get; set; }

    public DbSet<OrderReturnModel> OrderReturns { get; set; }
    public DbSet<PaymentModel> Payments { get; set; }

    public DbSet<AdminOrderModel> AdminOrders { get; set; }

    public DbSet<AdminOrderTableModel> AdminOrderTable { get; set; }

    public DbSet<ProductVariant> ProductVariants { get; set; }

    public DbSet<ProductSpecifications> ProductSpecifications { get; set; }

    public DbSet<ProductVariantImage> ProductVariantImages { get; set; }

    public DbSet<PaymentSession> PaymentSessions { get; set; }

    public DbSet<CheckoutSessionModel> CheckoutSessions { get; set; }

    public DbSet<GstResponseModel> GstVerification { get; set; }

    public DbSet<WishlistModel> Wishlists { get; set; }

    public DbSet<PincodeServiceabilityModel> PincodeServiceability { get; set; }

    public DbSet<SubscriptionModel> Subscriptions { get; set; }

    public DbSet<UserAddress> UserAddresses { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<ProductModel>()
            .Property(p => p.CreatedDate)
            ;

        modelBuilder.Entity<ProductModel>()
            .Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<ProductModel>()
     .HasQueryFilter(p => p.Status == "Active");

        modelBuilder.Entity<ProductVariant>()
        .HasOne(v => v.Product)
        .WithMany(p => p.Variants)
        .HasForeignKey(v => v.ProductId);


        modelBuilder.Entity<SellerModel>()
            .HasQueryFilter(s => s.Status == "Active");

        modelBuilder.Entity<ApplicationUser>()
            .HasQueryFilter(u => u.Status == "Active");

        modelBuilder.Entity<EnquiryModel>()
            .ToTable("Enquiry");

        modelBuilder.Entity<OrderModel>()
            .HasMany(o => o.OrderItems)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId);

        modelBuilder.Entity<ProductModel>()
            .HasOne(p => p.Seller)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SellerId)
            .OnDelete(DeleteBehavior.Cascade);


        modelBuilder.Entity<AdminOrderModel>().HasNoKey();
        modelBuilder.Entity<AdminOrderTableModel>().HasNoKey();


        base.OnModelCreating(modelBuilder);


    }
}