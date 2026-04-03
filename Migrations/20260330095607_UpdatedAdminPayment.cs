using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAdminPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemStatus",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "PaymentVerifiedDate",
                table: "AdminOrders");

            migrationBuilder.RenameColumn(
                name: "UTRNumber",
                table: "AdminOrders",
                newName: "RazorpayPaymentId");

            migrationBuilder.RenameColumn(
                name: "Total",
                table: "AdminOrders",
                newName: "GrandTotal");

            migrationBuilder.RenameColumn(
                name: "PaymentScreenshot",
                table: "AdminOrders",
                newName: "OrderStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RazorpayPaymentId",
                table: "AdminOrders",
                newName: "UTRNumber");

            migrationBuilder.RenameColumn(
                name: "OrderStatus",
                table: "AdminOrders",
                newName: "PaymentScreenshot");

            migrationBuilder.RenameColumn(
                name: "GrandTotal",
                table: "AdminOrders",
                newName: "Total");

            migrationBuilder.AddColumn<string>(
                name: "ItemStatus",
                table: "AdminOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentVerifiedDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
