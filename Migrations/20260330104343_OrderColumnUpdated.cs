using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class OrderColumnUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemOrderModifiedDate",
                table: "AdminOrders");

            migrationBuilder.AddColumn<DateTime>(
                name: "OrderModifiedDate",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderModifiedDate",
                table: "Orders");

            migrationBuilder.AddColumn<DateTime>(
                name: "ItemOrderModifiedDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
