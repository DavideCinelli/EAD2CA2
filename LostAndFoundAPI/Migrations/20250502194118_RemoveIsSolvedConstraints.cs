using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostAndFoundAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIsSolvedConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Items_IsSolved_IsLost",
                table: "Items",
                columns: new[] { "IsSolved", "IsLost" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Items_IsSolved_IsLost",
                table: "Items");
        }
    }
}
