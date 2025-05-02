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
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> GetItems([FromQuery] string? filter = null)
        {
            try
            {
                _logger.LogInformation("Getting items with filter: {Filter}", filter);
                var query = _context.Items.Include(i => i.User).AsQueryable();

                // Apply filter
                if (!string.IsNullOrEmpty(filter))
                {
                    _logger.LogInformation("Applying filter: {Filter}", filter);
                    switch (filter.ToLower())
                    {
                        case "lost":
                            _logger.LogInformation("Filtering lost items");
                            query = query.Where(i => i.IsLost && !i.IsSolved);
                            break;
                        case "found":
                            _logger.LogInformation("Filtering found items");
                            query = query.Where(i => !i.IsLost && !i.IsSolved);
                            break;
                        case "solved":
                            _logger.LogInformation("Filtering solved items");
                            query = query.Where(i => i.IsSolved);
                            break;
                        case "all":
                            _logger.LogInformation("No filter applied, returning all items");
                            break;
                        default:
                            _logger.LogWarning("Invalid filter value: {Filter}", filter);
                            return BadRequest($"Invalid filter value: {filter}");
                    }
                }
                else
                {
                    // Default behavior: show unsolved items
                    _logger.LogInformation("No filter specified, returning unsolved items");
                    query = query.Where(i => !i.IsSolved);
                }

                var items = await query.ToListAsync();
                _logger.LogInformation("Retrieved {Count} items", items.Count);
                _logger.LogInformation("Items by status: Solved={Solved}, Unsolved={Unsolved}, Lost={Lost}, Found={Found}",
                    items.Count(i => i.IsSolved),
                    items.Count(i => !i.IsSolved),
                    items.Count(i => i.IsLost),
                    items.Count(i => !i.IsLost));

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
                }).ToList();

                _logger.LogInformation("Returning {Count} DTOs", itemDTOs.Count);
                return Ok(itemDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting items with filter: {Filter}", filter);
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
        public async Task<ActionResult<ItemResponseDTO>> UpdateItem(int id, ItemUpdateDTO itemDTO)
        {
            if (itemDTO == null)
            {
                return BadRequest("Update data is required");
            }

            try
            {
                _logger.LogInformation("Starting update for item {ItemId} with data: {ItemDTO}", id, itemDTO);
                
                // Load the existing item with tracking
                var item = await _context.Items
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    _logger.LogWarning("Item {ItemId} not found", id);
                    return NotFound();
                }

                _logger.LogInformation("Current item state - IsLost: {IsLost}, IsSolved: {IsSolved}", 
                    item.IsLost, item.IsSolved);

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

                _logger.LogInformation("Update type - IsOnlyUpdatingSolvedStatus: {IsOnlyUpdatingSolvedStatus}", 
                    isOnlyUpdatingSolvedStatus);

                if (!isOnlyUpdatingSolvedStatus && item.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to update item {ItemId} owned by {OwnerId}", 
                        userId, id, item.UserId);
                    return Forbid();
                }

                // Explicitly handle boolean updates to avoid any casting issues
                if (itemDTO.IsSolved.HasValue)
                {
                    _logger.LogInformation("Updating IsSolved from {OldValue} to {NewValue}", 
                        item.IsSolved, itemDTO.IsSolved.Value);
                    item.IsSolved = itemDTO.IsSolved.Value;
                    _context.Entry(item).Property(x => x.IsSolved).IsModified = true;
                }

                if (itemDTO.IsLost.HasValue)
                {
                    _logger.LogInformation("Updating IsLost from {OldValue} to {NewValue}", 
                        item.IsLost, itemDTO.IsLost.Value);
                    item.IsLost = itemDTO.IsLost.Value;
                    _context.Entry(item).Property(x => x.IsLost).IsModified = true;
                }

                // Update other properties
                if (itemDTO.Name != null) item.Name = itemDTO.Name;
                if (itemDTO.Description != null) item.Description = itemDTO.Description;
                if (itemDTO.Category != null) item.Category = itemDTO.Category;
                if (itemDTO.Location != null) item.Location = itemDTO.Location;
                if (itemDTO.Date != null) item.Date = itemDTO.Date;
                if (itemDTO.ImageUrl != null) item.ImageUrl = itemDTO.ImageUrl;

                _logger.LogInformation("Updated item state before save - IsLost: {IsLost}, IsSolved: {IsSolved}", 
                    item.IsLost, item.IsSolved);

                // Save changes
                var result = await _context.SaveChangesAsync();
                _logger.LogInformation("SaveChanges affected {Count} records", result);

                if (result > 0)
                {
                    // Create response DTO
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
                        Username = item.User?.Username ?? "Unknown"
                    };

                    _logger.LogInformation("Successfully updated item {ItemId}. Final state - IsLost: {IsLost}, IsSolved: {IsSolved}",
                        id, itemResponseDTO.IsLost, itemResponseDTO.IsSolved);

                    return Ok(itemResponseDTO);
                }
                else
                {
                    _logger.LogWarning("SaveChanges returned 0 affected records");
                    return StatusCode(500, "Failed to persist changes");
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

        // POST: api/Items/UpdateAllStates
        [HttpPost("UpdateAllStates")]
        [Authorize]
        public async Task<IActionResult> UpdateAllStates()
        {
            try
            {
                _logger.LogInformation("Starting bulk update of item states");
                
                await DbInitializer.UpdateItemStates(_context);
                
                _logger.LogInformation("Successfully completed bulk update of item states");
                
                return Ok(new { message = "Successfully updated all item states" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk update of item states");
                return StatusCode(500, "Internal server error occurred while updating item states");
            }
        }

        // POST: api/Items/{id}/MarkAsSolved
        [HttpPost("{id}/MarkAsSolved")]
        [Authorize]
        public async Task<ActionResult<ItemResponseDTO>> MarkItemAsSolved(int id)
        {
            try
            {
                _logger.LogInformation("Marking item {ItemId} as solved", id);

                // First verify the item exists
                var item = await _context.Items
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    _logger.LogWarning("Item {ItemId} not found", id);
                    return NotFound();
                }

                // Execute direct SQL update
                var sql = "UPDATE Items SET IsSolved = 1 WHERE Id = @p0";
                var result = await _context.Database.ExecuteSqlRawAsync(sql, id);

                if (result > 0)
                {
                    // Fetch the updated item
                    var updatedItem = await _context.Items
                        .Include(i => i.User)
                        .FirstOrDefaultAsync(i => i.Id == id);

                    if (updatedItem == null)
                    {
                        return NotFound();
                    }

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

                    _logger.LogInformation("Successfully marked item {ItemId} as solved", id);
                    return Ok(itemResponseDTO);
                }
                else
                {
                    _logger.LogWarning("No rows affected when marking item {ItemId} as solved", id);
                    return NotFound();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking item {ItemId} as solved", id);
                return StatusCode(500, "Internal server error occurred while marking the item as solved");
            }
        }

        private bool ItemExists(int id)
        {
            return _context.Items.Any(e => e.Id == id);
        }
    }
} 