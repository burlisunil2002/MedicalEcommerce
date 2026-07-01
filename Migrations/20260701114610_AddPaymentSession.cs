using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CheckoutSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    GuestId = table.Column<string>(type: "text", nullable: true),
                    SelectedAddressId = table.Column<int>(type: "integer", nullable: true),
                    CouponCode = table.Column<string>(type: "text", nullable: true),
                    SubTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    GSTAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    ShippingCharge = table.Column<decimal>(type: "numeric", nullable: false),
                    CouponDiscount = table.Column<decimal>(type: "numeric", nullable: false),
                    GrandTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_UserAddresses_SelectedAddressId",
                        column: x => x.SelectedAddressId,
                        principalTable: "UserAddresses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PaymentSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CheckoutSessionId = table.Column<int>(type: "integer", nullable: false),
                    RazorpayOrderId = table.Column<string>(type: "text", nullable: false),
                    RazorpayPaymentId = table.Column<string>(type: "text", nullable: true),
                    RazorpaySignature = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    GuestId = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    PaymentStatus = table.Column<string>(type: "text", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentCompletedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentSessions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_SelectedAddressId",
                table: "CheckoutSessions",
                column: "SelectedAddressId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CheckoutSessions");

            migrationBuilder.DropTable(
                name: "PaymentSessions");
        }
    }
}
