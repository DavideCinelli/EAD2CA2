using Microsoft.EntityFrameworkCore;
using LostAndFoundAPI.Models;

namespace LostAndFoundAPI.Data
{
    public static class DbInitializer
    {
        public static async Task UpdateItemStates(ApplicationDbContext context)
        {
            try
            {
                // Get all items
                var items = await context.Items.ToListAsync();
                
                Console.WriteLine($"Found {items.Count} items to process");
                
                foreach (var item in items)
                {
                    // Log current state
                    Console.WriteLine($"Processing item {item.Id}: IsLost={item.IsLost}, IsSolved={item.IsSolved}");
                    
                    // Update IsSolved based on business rules
                    if (item.IsSolved)
                    {
                        // If already solved, keep it solved
                        continue;
                    }
                    
                    // Set default state for unsolved items
                    item.IsSolved = false;
                    
                    Console.WriteLine($"Updated item {item.Id}: IsLost={item.IsLost}, IsSolved={item.IsSolved}");
                }
                
                // Save all changes
                var changedCount = await context.SaveChangesAsync();
                Console.WriteLine($"Successfully updated {changedCount} items");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating item states: {ex.Message}");
                throw;
            }
        }
    }
} 