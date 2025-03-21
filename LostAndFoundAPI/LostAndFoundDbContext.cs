using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LostAndFoundAPI
{
    public class LostAndFoundDbContext : DbContext
    {
        public LostAndFoundDbContext(DbContextOptions<LostAndFoundDbContext> options)
            : base(options)
        {
        }

        public DbSet<Item> Items { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Item>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Item>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.ClaimerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public enum ItemStatus
    {
        Lost,
        Found,
        Claimed,
        Returned
    }

    public enum ItemCategory
    {
        Electronics,
        Clothing,
        Jewelry,
        Documents,
        Keys,
        Wallet,
        Bag,
        Other
    }

    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public ItemCategory Category { get; set; }

        [Required]
        public ItemStatus Status { get; set; }

        [Required]
        [StringLength(200)]
        public string Location { get; set; }

        [Required]
        public DateTime DateReported { get; set; }

        [Required]
        public int ReporterId { get; set; }

        [Required]
        [StringLength(100)]
        public string ReporterName { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string ReporterEmail { get; set; }

        [Phone]
        [StringLength(20)]
        public string ReporterPhone { get; set; }

        [StringLength(500)]
        public string AdditionalNotes { get; set; }

        public DateTime? DateFound { get; set; }

        public DateTime? DateClaimed { get; set; }

        public DateTime? DateReturned { get; set; }

        public int? ClaimerId { get; set; }

        [StringLength(100)]
        public string ClaimerName { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string ClaimerEmail { get; set; }

        [Phone]
        [StringLength(20)]
        public string ClaimerPhone { get; set; }

        [StringLength(200)]
        public string ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        [Index(IsUnique = true)]
        public string Email { get; set; }

        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [Required]
        [StringLength(100)]
        public string PasswordHash { get; set; }

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        public DateTime LastLogin { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsEmailVerified { get; set; }

        public DateTime? EmailVerificationDate { get; set; }

        public string ResetPasswordToken { get; set; }

        public DateTime? ResetPasswordTokenExpiry { get; set; }
    }
}
