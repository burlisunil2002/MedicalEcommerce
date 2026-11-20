
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Data;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ProductModel> Products { get; set; } = null!;

    public DbSet<SellerModel> Sellers { get; set; } = null!;

    public DbSet<EnquiryModel> Enquiry { get; set; } = null!;

    public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; } = null!;

    public DbSet<CartModel> Carts { get; set; } = null!;

    public DbSet<CartModel> CartItems { get; set; } = null!;

    public DbSet<OrderModel> Orders { get; set; } = null!;

    public DbSet<OrderItemModel> OrderItems { get; set; } = null!;

    public DbSet<OrderReturnModel> OrderReturns { get; set; } = null!;

    public DbSet<PaymentModel> Payments { get; set; } = null!;

    public DbSet<AdminOrderModel> AdminOrders { get; set; } = null!;

    public DbSet<AdminOrderTableModel> AdminOrderTable { get; set; } = null!;

    public DbSet<ProductVariant> ProductVariants { get; set; } = null!;

    public DbSet<ProductSpecifications> ProductSpecifications { get; set; } = null!;

    public DbSet<ProductVariantImage> ProductVariantImages { get; set; } = null!;

    public DbSet<PaymentSession> PaymentSessions { get; set; } = null!;

    public DbSet<CheckoutSessionModel> CheckoutSessions { get; set; } = null!;

    public DbSet<GstResponseModel> GstVerification { get; set; } = null!;

    public DbSet<WishlistModel> Wishlists { get; set; } = null!;

    public DbSet<PincodeServiceabilityModel> PincodeServiceability { get; set; } = null!;

    public DbSet<SubscriptionModel> Subscriptions { get; set; } = null!;

    public DbSet<UserAddress> UserAddresses { get; set; } = null!;

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<SellerInvoiceModel> SellerInvoices { get; set; } = null!;

    public DbSet<SellerInvoiceItemModel> SellerInvoiceItems { get; set; } = null!;

    public DbSet<DeliveryBatchModel> DeliveryBatches
    { get; set; } = null!;

    public DbSet<DeliveryBatchItemModel> DeliveryBatchItems
    => Set<DeliveryBatchItemModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =================================================
        // PRODUCTS
        // =================================================

        modelBuilder.Entity<ProductModel>()
            .Property(p => p.CreatedDate);

        modelBuilder.Entity<ProductModel>()
            .Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<ProductVariant>()
            .HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId);

        modelBuilder.Entity<ProductModel>()
            .HasOne(p => p.Seller)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SellerId)
            .OnDelete(DeleteBehavior.Cascade);

        // =================================================
        // SELLERS
        // =================================================

        modelBuilder.Entity<SellerModel>()
            .HasQueryFilter(s => s.Status == "Active");

        modelBuilder.Entity<SellerModel>()
            .HasIndex(s => s.GSTNumber)
            .IsUnique()
            .HasFilter("\"GSTNumber\" IS NOT NULL");

        // =================================================
        // APPLICATION USERS
        // =================================================

       // modelBuilder.Entity<ApplicationUser>()
       //     .HasQueryFilter(u => u.Status == "Active");

        // =================================================
        // ENQUIRIES
        // =================================================

        modelBuilder.Entity<EnquiryModel>()
            .ToTable("Enquiry");

        // =================================================
        // ORDERS
        // =================================================

        modelBuilder.Entity<OrderModel>()
            .HasMany(o => o.OrderItems)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId);

        // =================================================
        // AUDIT LOGS
        // =================================================
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.HasKey(x => x.Id);

            entity.HasIndex(x => x.EventId)
                .IsUnique();

            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
            entity.HasIndex(x => new { x.UserName, x.CreatedAt });
            entity.HasIndex(x => new { x.Module, x.CreatedAt });
            entity.HasIndex(x => new { x.Action, x.CreatedAt });
            entity.HasIndex(x => new { x.Status, x.CreatedAt });

            entity.Property(x => x.OldValues).HasColumnType("jsonb");
            entity.Property(x => x.NewValues).HasColumnType("jsonb");

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // =================================================
        // KEYLESS ADMIN QUERY MODELS
        // =================================================

        modelBuilder.Entity<AdminOrderModel>()
            .HasNoKey();

        modelBuilder.Entity<AdminOrderTableModel>()
            .HasNoKey();


        modelBuilder.Entity<SellerInvoiceModel>(e =>
        {
            e.HasIndex(x => x.InvoiceNumber).IsUnique();

            // One seller invoice per dispatch batch
            e.HasIndex(x => new { x.DeliveryBatchId, x.SellerId })
                .IsUnique()
                .HasFilter(
                    "\"DeliveryBatchId\" IS NOT NULL AND \"SellerId\" IS NOT NULL");

            // One JEDE invoice per dispatch batch
            e.HasIndex(x => x.DeliveryBatchId)
                .IsUnique()
                .HasFilter(
                    "\"DeliveryBatchId\" IS NOT NULL AND \"SellerId\" IS NULL");

            e.Property(x => x.TaxableTotal).HasPrecision(18, 2);
            e.Property(x => x.GstTotal).HasPrecision(18, 2);
            e.Property(x => x.InvoiceTotal).HasPrecision(18, 2);

            e.HasMany(x => x.Items)
                .WithOne(x => x.Invoice)
                .HasForeignKey(x => x.SellerInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        modelBuilder.Entity<SellerInvoiceItemModel>(e =>
        {
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.TaxableAmount).HasPrecision(18, 2);
            e.Property(x => x.GstPercentage).HasPrecision(5, 2);
            e.Property(x => x.GstAmount).HasPrecision(18, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);

            e.HasOne(x => x.DeliveryBatchItem)
                .WithMany()
                .HasForeignKey(x => x.DeliveryBatchItemId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.DeliveryBatchItemId)
                .IsUnique()
                .HasFilter("\"DeliveryBatchItemId\" IS NOT NULL");
        });


        modelBuilder.Entity<DeliveryBatchModel>(e =>
        {
            e.HasOne<OrderModel>()
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Items)
                .WithOne(x => x.DeliveryBatch)
                .HasForeignKey(x => x.DeliveryBatchId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique batch for Order + Seller + OutForDelivery date
            e.HasIndex(x => new
            {
                x.OrderId,
                x.SellerId,
                x.OutForDeliveryDate
            }).IsUnique();
        });

        modelBuilder.Entity<DeliveryBatchItemModel>(entity =>
        {
            entity.HasKey(x => x.DeliveryBatchItemId);

            entity.HasOne(x => x.DeliveryBatch)
                .WithMany(x => x.BatchItems)
                .HasForeignKey(x => x.DeliveryBatchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.OrderItem)
                .WithMany()
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new
            {
                x.DeliveryBatchId,
                x.OrderItemId
            }).IsUnique();

            entity.Property(x => x.TaxableAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.GstAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.LineTotal)
                .HasPrecision(18, 2);
        });

    }
}
