using System.ComponentModel.DataAnnotations;

namespace LostAndFoundAPI.Models.DTOs
{
    public class ItemCreateDTO
    {
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
    }

    public class ItemUpdateDTO
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        [StringLength(200)]
        public string? Location { get; set; }

        public string? Date { get; set; }

        public bool? IsLost { get; set; }

        public bool? IsSolved { get; set; }

        public string? ImageUrl { get; set; }
    }

    public class ItemResponseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public bool IsLost { get; set; }
        public bool IsSolved { get; set; }
        public string? ImageUrl { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
    }
} 