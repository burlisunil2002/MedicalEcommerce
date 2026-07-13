using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReturnEligible",
                table: "OrderItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "OrderItems",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundCompletedDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnApprovedDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnEligibleTill",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnImages",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReason",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnRemarks",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnRequestedDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReviewedBy",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnStatus",
                table: "OrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsReturnEligible",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "PickupDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "RefundCompletedDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnApprovedDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnEligibleTill",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnImages",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnRemarks",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnRequestedDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnReviewedBy",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnStatus",
                table: "OrderItems");
        }
    }
}
