using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerSubscription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FreeSubscriptionEndDate",
                table: "Sellers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FreeSubscriptionStartDate",
                table: "Sellers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLaunchFreeSubscription",
                table: "Sellers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlan",
                table: "Sellers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionStartDate",
                table: "Sellers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FreeSubscriptionEndDate",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "FreeSubscriptionStartDate",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "IsLaunchFreeSubscription",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlan",
                table: "Sellers");

            migrationBuilder.DropColumn(
                name: "SubscriptionStartDate",
                table: "Sellers");
        }
    }
}
