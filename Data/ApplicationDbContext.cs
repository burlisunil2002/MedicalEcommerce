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
    public DbSet<EnquiryModel> Enquiry { get; set; }

    public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }
    public DbSet<CartModel> Carts { get; set; }

    public DbSet<CartModel> CartItems { get; set; }

    public DbSet<OrderModel> Orders { get; set; }
    public DbSet<OrderItemModel> OrderItems { get; set; }
    public DbSet<PaymentModel> Payments { get; set; }

    public DbSet<AdminOrderModel> AdminOrders { get; set; }

    public DbSet<AdminOrderTableModel> AdminOrderTable { get; set; }


    public DbSet<GstResponseModel> GstVerification { get; set; }

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
            .Property(p => p.Price)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<EnquiryModel>()
            .ToTable("Enquiry");

        modelBuilder.Entity<OrderModel>()
        .HasOne(o => o.Payment)
        .WithOne(p => p.Order)
        .HasForeignKey<PaymentModel>(p => p.OrderId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderModel>()
            .HasMany(o => o.OrderItems)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId);

        modelBuilder.Entity<AdminOrderModel>().HasNoKey();
        modelBuilder.Entity<AdminOrderTableModel>().HasNoKey();

        base.OnModelCreating(modelBuilder);


    }
}