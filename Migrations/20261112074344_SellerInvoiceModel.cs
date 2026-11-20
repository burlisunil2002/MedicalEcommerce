using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class SellerInvoiceModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryBatchId",
                table: "OrderItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeliveryBatches",
                columns: table => new
                {
                    DeliveryBatchId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    SellerId = table.Column<int>(type: "integer", nullable: false),
                    BatchNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DispatchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryBatches", x => x.DeliveryBatchId);
                    table.ForeignKey(
                        name: "FK_DeliveryBatches_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SellerInvoices",
                columns: table => new
                {
                    SellerInvoiceId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvoiceNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    OrderNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SellerId = table.Column<int>(type: "integer", nullable: true),
                    SupplierType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SupplierName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SupplierGSTIN = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SupplierAddress = table.Column<string>(type: "text", nullable: false),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerAddress = table.Column<string>(type: "text", nullable: false),
                    CustomerPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CustomerGSTIN = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PlaceOfSupply = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IssuedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TaxableTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    GstTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    InvoiceTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DeliveryBatchId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerInvoices", x => x.SellerInvoiceId);
                    table.ForeignKey(
                        name: "FK_SellerInvoices_DeliveryBatches_DeliveryBatchId",
                        column: x => x.DeliveryBatchId,
                        principalTable: "DeliveryBatches",
                        principalColumn: "DeliveryBatchId");
                });

            migrationBuilder.CreateTable(
                name: "SellerInvoiceItems",
                columns: table => new
                {
                    SellerInvoiceItemId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SellerInvoiceId = table.Column<int>(type: "integer", nullable: false),
                    OrderItemId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HSNCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TaxableAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    GstPercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    GstAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerInvoiceItems", x => x.SellerInvoiceItemId);
                    table.ForeignKey(
                        name: "FK_SellerInvoiceItems_SellerInvoices_SellerInvoiceId",
                        column: x => x.SellerInvoiceId,
                        principalTable: "SellerInvoices",
                        principalColumn: "SellerInvoiceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_DeliveryBatchId",
                table: "OrderItems",
                column: "DeliveryBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_OrderId_SellerId_BatchNumber",
                table: "DeliveryBatches",
                columns: new[] { "OrderId", "SellerId", "BatchNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_OrderItemId",
                table: "SellerInvoiceItems",
                column: "OrderItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_SellerInvoiceId",
                table: "SellerInvoiceItems",
                column: "SellerInvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_DeliveryBatchId",
                table: "SellerInvoices",
                column: "DeliveryBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoices_InvoiceNumber",
                table: "SellerInvoices",
                column: "InvoiceNumber",
                unique: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_DeliveryBatches_DeliveryBatchId",
                table: "OrderItems",
                column: "DeliveryBatchId",
                principalTable: "DeliveryBatches",
                principalColumn: "DeliveryBatchId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_DeliveryBatches_DeliveryBatchId",
                table: "OrderItems");

            migrationBuilder.DropTable(
                name: "SellerInvoiceItems");

            migrationBuilder.DropTable(
                name: "SellerInvoices");

            migrationBuilder.DropTable(
                name: "DeliveryBatches");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_DeliveryBatchId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DeliveryBatchId",
                table: "OrderItems");
        }
    }
}
