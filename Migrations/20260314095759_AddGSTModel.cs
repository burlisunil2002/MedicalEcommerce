using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class AddGSTModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "dataId",
                table: "GstVerification",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "flag",
                table: "GstVerification",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "message",
                table: "GstVerification",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "stj",
                table: "GstVerification",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "GSTNo",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_GstVerification_dataId",
                table: "GstVerification",
                column: "dataId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GSTNo",
                table: "AspNetUsers",
                column: "GSTNo",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_GstVerification_GstVerification_dataId",
                table: "GstVerification",
                column: "dataId",
                principalTable: "GstVerification",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GstVerification_GstVerification_dataId",
                table: "GstVerification");

            migrationBuilder.DropIndex(
                name: "IX_GstVerification_dataId",
                table: "GstVerification");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GSTNo",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "dataId",
                table: "GstVerification");

            migrationBuilder.DropColumn(
                name: "flag",
                table: "GstVerification");

            migrationBuilder.DropColumn(
                name: "message",
                table: "GstVerification");

            migrationBuilder.DropColumn(
                name: "stj",
                table: "GstVerification");

            migrationBuilder.AlterColumn<string>(
                name: "GSTNo",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
