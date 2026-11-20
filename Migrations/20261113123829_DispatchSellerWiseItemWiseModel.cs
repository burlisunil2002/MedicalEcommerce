using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class DispatchSellerWiseItemWiseModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DeliveryBatchItems",
                columns: table => new
                {
                    DeliveryBatchItemId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryBatchId = table.Column<int>(type: "integer", nullable: false),
                    OrderItemId = table.Column<int>(type: "integer", nullable: false),
                    DispatchedQuantity = table.Column<int>(type: "integer", nullable: false),
                    TaxableAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    GstAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryBatchItems", x => x.DeliveryBatchItemId);
                    table.ForeignKey(
                        name: "FK_DeliveryBatchItems_DeliveryBatches_DeliveryBatchId",
                        column: x => x.DeliveryBatchId,
                        principalTable: "DeliveryBatches",
                        principalColumn: "DeliveryBatchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryBatchItems_OrderItems_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "OrderItemId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                column: "DeliveryBatchItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatchItems_DeliveryBatchId_OrderItemId",
                table: "DeliveryBatchItems",
                columns: new[] { "DeliveryBatchId", "OrderItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatchItems_OrderItemId",
                table: "DeliveryBatchItems",
                column: "OrderItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_SellerInvoiceItems_DeliveryBatchItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems",
                column: "DeliveryBatchItemId",
                principalTable: "DeliveryBatchItems",
                principalColumn: "DeliveryBatchItemId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SellerInvoiceItems_DeliveryBatchItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems");

            migrationBuilder.DropTable(
                name: "DeliveryBatchItems");

            migrationBuilder.DropIndex(
                name: "IX_SellerInvoiceItems_DeliveryBatchItemId",
                table: "SellerInvoiceItems");

            migrationBuilder.DropColumn(
                name: "DeliveryBatchItemId",
                table: "SellerInvoiceItems");
        }
    }
}
