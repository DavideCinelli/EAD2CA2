using Microsoft.EntityFrameworkCore;

namespace LostAndFoundAPI
{
    public class LostAndFoundDbContext : DbContext
    {
        public LostAndFoundDbContext(DbContextOptions<LostAndFoundDbContext> options)
            : base(options)
        {
        }

        public DbSet<Item> Items { get; set; }
    }

    // Define the Item model (this will represent a table in the database)
    public class Item
    {
        public int Id { get; set; }           // Primary Key
        public string Name { get; set; }      // Name of the item
        public string Description { get; set; } // Description of the item
        public string Category { get; set; }  // Category (Lost or Found)
        public string Location { get; set; }  // Location where the item was found or lost
        public DateTime DateReported { get; set; } // Date when the item was reported
        public string Contact { get; set; }   // Contact info for the person reporting
    }
}
