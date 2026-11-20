using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class BatchModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SellerInvoices_DeliveryBatchId",
                table: "SellerInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoices_OrderId",
                table: "SellerInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoices_OrderId_SellerId",
                table: "SellerInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoiceItems_OrderItemId",
                table: "SellerInvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryBatches_OrderId_SellerId_BatchNumber",
                table: "DeliveryBatches");

            migrationBuilder.AlterColumn<int>(
                name: "DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "SellerId",
                table: "DeliveryBatches",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "OutForDeliveryDate",
                table: "DeliveryBatches",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_DeliveryBatchId",
                table: "SellerInvoices",
                column: "DeliveryBatchId",
                unique: true,
                filter: "\"DeliveryBatchId\" IS NOT NULL AND \"SellerId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_DeliveryBatchId_SellerId",
                table: "SellerInvoices",
                columns: new[] { "DeliveryBatchId", "SellerId" },
                unique: true,
                filter: "\"DeliveryBatchId\" IS NOT NULL AND \"SellerId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                column: "DeliveryBatchItemId",
                unique: true,
                filter: "\"DeliveryBatchItemId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_OrderId_SellerId_OutForDeliveryDate",
                table: "DeliveryBatches",
                columns: new[] { "OrderId", "SellerId", "OutForDeliveryDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SellerInvoices_DeliveryBatchId",
                table: "SellerInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoices_DeliveryBatchId_SellerId",
                table: "SellerInvoices");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryBatches_OrderId_SellerId_OutForDeliveryDate",
                table: "DeliveryBatches");

            migrationBuilder.DropColumn(
                name: "OutForDeliveryDate",
                table: "DeliveryBatches");

            migrationBuilder.AlterColumn<int>(
                name: "DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "SellerId",
                table: "DeliveryBatches",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_DeliveryBatchId",
                table: "SellerInvoices",
                column: "DeliveryBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_OrderId",
                table: "SellerInvoices",
                column: "OrderId",
                unique: true,
                filter: "\"SellerId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_OrderId_SellerId",
                table: "SellerInvoices",
                columns: new[] { "OrderId", "SellerId" },
                unique: true,
                filter: "\"SellerId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                column: "DeliveryBatchItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_OrderItemId",
                table: "SellerInvoiceItems",
                column: "OrderItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_OrderId_SellerId_BatchNumber",
                table: "DeliveryBatches",
                columns: new[] { "OrderId", "SellerId", "BatchNumber" },
                unique: true);
        }
    }
}
