using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedCloudImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "QuotationPath",
                table: "Products",
                newName: "QuotationUrl");

            migrationBuilder.RenameColumn(
                name: "ImagePath",
                table: "Products",
                newName: "ImageUrl");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "QuotationUrl",
                table: "Products",
                newName: "QuotationPath");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "Products",
                newName: "ImagePath");
        }
    }
}
