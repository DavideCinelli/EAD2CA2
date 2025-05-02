using Microsoft.EntityFrameworkCore;
using LostAndFoundAPI.Models;

namespace LostAndFoundAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Item> Items { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure Item entity
            modelBuilder.Entity<Item>()
                .HasOne(i => i.User)
                .WithMany(u => u.Items)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create composite index for IsSolved and IsLost
            modelBuilder.Entity<Item>()
                .HasIndex(i => new { i.IsSolved, i.IsLost })
                .HasDatabaseName("IX_Items_IsSolved_IsLost");

            modelBuilder.Entity<Item>(entity =>
            {
                // Configure boolean properties to never be value generated
                entity.Property(e => e.IsLost)
                    .ValueGeneratedNever();

                entity.Property(e => e.IsSolved)
                    .ValueGeneratedNever();

                // Configure trigger
                entity.ToTable(tb => tb.HasTrigger("trg----aid"));
            });
        }
    }
} 