using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LostAndFoundAPI;

namespace LostAndFoundAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemsController : ControllerBase
    {
        private readonly LostAndFoundDbContext _context;

        public ItemsController(LostAndFoundDbContext context)
        {
            _context = context;
        }

        // GET: api/Items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            return await _context.Items
                .Where(i => i.IsActive)
                .OrderByDescending(i => i.DateReported)
                .ToListAsync();
        }

        // GET: api/Items/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Item>> GetItem(int id)
        {
            var item = await _context.Items
                .FirstOrDefaultAsync(i => i.Id == id && i.IsActive);

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        // GET: api/Items/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Item>>> SearchItems(
            [FromQuery] string? searchTerm,
            [FromQuery] ItemCategory? category,
            [FromQuery] ItemStatus? status,
            [FromQuery] string? location,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.Items.Where(i => i.IsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(i => 
                    i.Name.ToLower().Contains(searchTerm) ||
                    i.Description.ToLower().Contains(searchTerm));
            }

            if (category.HasValue)
            {
                query = query.Where(i => i.Category == category.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(i => i.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                location = location.ToLower();
                query = query.Where(i => i.Location.ToLower().Contains(location));
            }

            if (fromDate.HasValue)
            {
                query = query.Where(i => i.DateReported >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(i => i.DateReported <= toDate.Value);
            }

            return await query.OrderByDescending(i => i.DateReported).ToListAsync();
        }

        // GET: api/Items/status/{status}
        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItemsByStatus(ItemStatus status)
        {
            return await _context.Items
                .Where(i => i.IsActive && i.Status == status)
                .OrderByDescending(i => i.DateReported)
                .ToListAsync();
        }

        // GET: api/Items/category/{category}
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItemsByCategory(ItemCategory category)
        {
            return await _context.Items
                .Where(i => i.IsActive && i.Category == category)
                .OrderByDescending(i => i.DateReported)
                .ToListAsync();
        }

        // GET: api/Items/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItemsByUser(int userId)
        {
            return await _context.Items
                .Where(i => i.IsActive && (i.ReporterId == userId || i.ClaimerId == userId))
                .OrderByDescending(i => i.DateReported)
                .ToListAsync();
        }
    }
} 