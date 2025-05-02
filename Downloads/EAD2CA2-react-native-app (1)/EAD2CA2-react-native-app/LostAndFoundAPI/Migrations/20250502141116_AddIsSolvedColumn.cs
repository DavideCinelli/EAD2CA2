using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostAndFoundAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSolvedColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSolved",
                table: "Items",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSolved",
                table: "Items");
        }
    }
}
