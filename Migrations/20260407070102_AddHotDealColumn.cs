using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddHotDealColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DealEndDate",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "Products",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHotDeal",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DealEndDate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DiscountPercentage",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsHotDeal",
                table: "Products");
        }
    }
}
