using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductSpecificationModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SAFE DROP (only if exists)
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='ProductSpecifications'
        AND column_name='ProductId'
    ) THEN
        ALTER TABLE ""ProductSpecifications"" DROP COLUMN ""ProductId"";
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "ProductSpecifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
