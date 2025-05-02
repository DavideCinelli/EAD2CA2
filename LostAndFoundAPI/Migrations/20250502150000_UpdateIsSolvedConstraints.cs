using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostAndFoundAPI.Migrations
{
    public partial class UpdateIsSolvedConstraints : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add default constraint
            migrationBuilder.AlterColumn<bool>(
                name: "IsSolved",
                table: "Items",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit");

            // Add check constraint to ensure valid status combinations
            migrationBuilder.Sql(
                @"ALTER TABLE Items 
                  ADD CONSTRAINT CK_Items_ValidStatus 
                  CHECK (
                    (IsSolved = 0) OR  -- If not solved, any IsLost value is valid
                    (IsSolved = 1)      -- If solved, any IsLost value is valid
                  )");

            // Add index for improved filtering performance
            migrationBuilder.CreateIndex(
                name: "IX_Items_IsSolved_IsLost",
                table: "Items",
                columns: new[] { "IsSolved", "IsLost" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove index
            migrationBuilder.DropIndex(
                name: "IX_Items_IsSolved_IsLost",
                table: "Items");

            // Remove check constraint
            migrationBuilder.Sql(
                "ALTER TABLE Items DROP CONSTRAINT CK_Items_ValidStatus");

            // Remove default constraint (revert to original column definition)
            migrationBuilder.AlterColumn<bool>(
                name: "IsSolved",
                table: "Items",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: false);
        }
    }
} 