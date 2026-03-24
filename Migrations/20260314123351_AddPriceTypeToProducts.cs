using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceTypeToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PriceType",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceType",
                table: "Products");
        }
    }
}
