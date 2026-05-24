using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class WishlistModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wishlists_ProductVariants_ProductVariantId",
                table: "Wishlists");

            migrationBuilder.AlterColumn<int>(
                name: "ProductVariantId",
                table: "Wishlists",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Wishlists_ProductVariants_ProductVariantId",
                table: "Wishlists",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "ProductVariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wishlists_ProductVariants_ProductVariantId",
                table: "Wishlists");

            migrationBuilder.AlterColumn<int>(
                name: "ProductVariantId",
                table: "Wishlists",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Wishlists_ProductVariants_ProductVariantId",
                table: "Wishlists",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "ProductVariantId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
