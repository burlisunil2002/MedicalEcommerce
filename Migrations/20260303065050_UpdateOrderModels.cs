using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOrderModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderStatus",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "PaymentStatus",
                table: "Orders",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "OrderDate",
                table: "Orders",
                newName: "CreatedDate");

            migrationBuilder.RenameColumn(
                name: "GSTTotal",
                table: "Orders",
                newName: "GSTAmount");

            migrationBuilder.RenameColumn(
                name: "SubTotal",
                table: "OrderItems",
                newName: "TotalPrice");

            migrationBuilder.AddColumn<string>(
                name: "PaymentScreenshot",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UTRNumber",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "GSTAmount",
                table: "OrderItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "GSTPercentage",
                table: "OrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "PaymentScreenshot",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UTRNumber",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "GSTAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "GSTPercentage",
                table: "OrderItems");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Orders",
                newName: "PaymentStatus");

            migrationBuilder.RenameColumn(
                name: "GSTAmount",
                table: "Orders",
                newName: "GSTTotal");

            migrationBuilder.RenameColumn(
                name: "CreatedDate",
                table: "Orders",
                newName: "OrderDate");

            migrationBuilder.RenameColumn(
                name: "TotalPrice",
                table: "OrderItems",
                newName: "SubTotal");

            migrationBuilder.AddColumn<string>(
                name: "OrderStatus",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
