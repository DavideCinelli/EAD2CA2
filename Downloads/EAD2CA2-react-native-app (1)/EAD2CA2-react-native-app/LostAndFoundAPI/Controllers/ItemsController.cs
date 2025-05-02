using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using LostAndFoundAPI.Data;
using LostAndFoundAPI.Models;
using LostAndFoundAPI.Models.DTOs;

namespace LostAndFoundAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ItemsController> _logger;

        public ItemsController(ApplicationDbContext context, ILogger<ItemsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> GetItems()
        {
            try
            {
                var items = await _context.Items
                    .Include(i => i.User)
                    .ToListAsync();

                var itemDTOs = items.Select(i => new ItemResponseDTO
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Category = i.Category,
                    Location = i.Location,
                    Date = i.Date,
                    IsLost = i.IsLost,
                    IsSolved = i.IsSolved,
                    ImageUrl = i.ImageUrl,
                    UserId = i.UserId,
                    Username = i.User?.Username ?? "Unknown"
                });

                return Ok(itemDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting items");
                return StatusCode(500, "Internal server error occurred while retrieving items");
            }
        }

        // GET: api/Items/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ItemResponseDTO>> GetItem(int id)
        {
            try
            {
                var item = await _context.Items
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound();
                }

                var itemDTO = new ItemResponseDTO
                {
                    Id = item.Id,
                    Name = item.Name,
                    Description = item.Description,
                    Category = item.Category,
                    Location = item.Location,
                    Date = item.Date,
                    IsLost = item.IsLost,
                    IsSolved = item.IsSolved,
                    ImageUrl = item.ImageUrl,
                    UserId = item.UserId,
                    Username = item.User?.Username ?? "Unknown"
                };

                return itemDTO;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting item with ID {ItemId}", id);
                return StatusCode(500, "Internal server error occurred while retrieving the item");
            }
        }

        // POST: api/Items
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ItemResponseDTO>> CreateItem(ItemCreateDTO itemDTO)
        {
            if (itemDTO == null)
            {
                return BadRequest("Item data is required");
            }

            if (string.IsNullOrWhiteSpace(itemDTO.Name) || 
                string.IsNullOrWhiteSpace(itemDTO.Location))
            {
                return BadRequest("Name and location are required fields");
            }

            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("User ID claim not found or invalid");
                    return Unauthorized("User identification failed");
                }
                
                var item = new Item
                {
                    Name = itemDTO.Name,
                    Description = itemDTO.Description,
                    Category = itemDTO.Category,
                    Location = itemDTO.Location,
                    Date = itemDTO.Date,
                    IsLost = itemDTO.IsLost,
                    IsSolved = itemDTO.IsSolved,
                    ImageUrl = itemDTO.ImageUrl,
                    UserId = userId
                };

                _context.Items.Add(item);
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(userId);
                
                var itemResponseDTO = new ItemResponseDTO
                {
                    Id = item.Id,
                    Name = item.Name,
                    Description = item.Description,
                    Category = item.Category,
                    Location = item.Location,
                    Date = item.Date,
                    IsLost = item.IsLost,
                    IsSolved = item.IsSolved,
                    ImageUrl = item.ImageUrl,
                    UserId = item.UserId,
                    Username = user?.Username ?? "Unknown"
                };

                return CreatedAtAction(nameof(GetItem), new { id = item.Id }, itemResponseDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new item");
                return StatusCode(500, "Internal server error occurred while creating the item");
            }
        }

        // PUT: api/Items/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateItem(int id, ItemUpdateDTO itemDTO)
        {
            if (itemDTO == null)
            {
                return BadRequest("Update data is required");
            }

            try
            {
                var item = await _context.Items.FindAsync(id);
                if (item == null)
                {
                    return NotFound();
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("User ID claim not found or invalid when updating item {ItemId}", id);
                    return Unauthorized("User identification failed");
                }

                // Only check ownership if updating fields other than IsSolved
                bool isOnlyUpdatingSolvedStatus = itemDTO.Name == null && 
                    itemDTO.Description == null && 
                    itemDTO.Category == null && 
                    itemDTO.Location == null && 
                    itemDTO.Date == null && 
                    itemDTO.IsLost == null && 
                    itemDTO.ImageUrl == null && 
                    itemDTO.IsSolved.HasValue;

                if (!isOnlyUpdatingSolvedStatus && item.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to update item {ItemId} owned by {OwnerId}", 
                        userId, id, item.UserId);
                    return Forbid();
                }

                if (itemDTO.Name != null)
                    item.Name = itemDTO.Name;
                
                if (itemDTO.Description != null)
                    item.Description = itemDTO.Description;
                
                if (itemDTO.Category != null)
                    item.Category = itemDTO.Category;
                
                if (itemDTO.Location != null)
                    item.Location = itemDTO.Location;
                
                if (itemDTO.Date != null)
                    item.Date = itemDTO.Date;
                
                if (itemDTO.IsLost.HasValue)
                    item.IsLost = itemDTO.IsLost.Value;

                if (itemDTO.IsSolved.HasValue)
                    item.IsSolved = itemDTO.IsSolved.Value;

                if (itemDTO.ImageUrl != null)
                    item.ImageUrl = itemDTO.ImageUrl;

                try
                {
                    await _context.SaveChangesAsync();

                    // Get the updated item with user info
                    var updatedItem = await _context.Items
                        .Include(i => i.User)
                        .FirstOrDefaultAsync(i => i.Id == id);

                    var itemResponseDTO = new ItemResponseDTO
                    {
                        Id = updatedItem.Id,
                        Name = updatedItem.Name,
                        Description = updatedItem.Description,
                        Category = updatedItem.Category,
                        Location = updatedItem.Location,
                        Date = updatedItem.Date,
                        IsLost = updatedItem.IsLost,
                        IsSolved = updatedItem.IsSolved,
                        ImageUrl = updatedItem.ImageUrl,
                        UserId = updatedItem.UserId,
                        Username = updatedItem.User?.Username ?? "Unknown"
                    };

                    return Ok(itemResponseDTO);
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    if (!ItemExists(id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        _logger.LogError(ex, "Concurrency error when updating item {ItemId}", id);
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating item {ItemId}", id);
                return StatusCode(500, "Internal server error occurred while updating the item");
            }
        }

        // DELETE: api/Items/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteItem(int id)
        {
            try
            {
                var item = await _context.Items.FindAsync(id);
                if (item == null)
                {
                    return NotFound();
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("User ID claim not found or invalid when deleting item {ItemId}", id);
                    return Unauthorized("User identification failed");
                }

                if (item.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to delete item {ItemId} owned by {OwnerId}", 
                        userId, id, item.UserId);
                    return Forbid();
                }

                _context.Items.Remove(item);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting item {ItemId}", id);
                return StatusCode(500, "Internal server error occurred while deleting the item");
            }
        }

        private bool ItemExists(int id)
        {
            return _context.Items.Any(e => e.Id == id);
        }
    }
} 