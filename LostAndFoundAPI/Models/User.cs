using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace LostAndFoundAPI.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        // Navigation property
        public ICollection<Item> Items { get; set; } = new List<Item>();
    }
} 