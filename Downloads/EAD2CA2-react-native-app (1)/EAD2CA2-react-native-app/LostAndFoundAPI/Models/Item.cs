using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LostAndFoundAPI.Models
{
    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public string Date { get; set; } = string.Empty;

        [Required]
        public bool IsLost { get; set; }

        [Required]
        public bool IsSolved { get; set; }

        public string? ImageUrl { get; set; }

        [Required]
        public int UserId { get; set; }

        // Navigation property
        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
} 