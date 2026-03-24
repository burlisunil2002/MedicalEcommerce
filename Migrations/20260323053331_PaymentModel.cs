using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class PaymentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubTotal",
                table: "Carts");

            migrationBuilder.AddColumn<string>(
                name: "RazorpayPaymentId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RazorpayPaymentId",
                table: "Payments");

            migrationBuilder.AddColumn<decimal>(
                name: "SubTotal",
                table: "Carts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
