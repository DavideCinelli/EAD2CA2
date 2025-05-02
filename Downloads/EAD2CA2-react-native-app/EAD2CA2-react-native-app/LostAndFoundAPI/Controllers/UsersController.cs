using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using LostAndFoundAPI.Data;
using LostAndFoundAPI.Models;
using LostAndFoundAPI.Models.DTOs;
using LostAndFoundAPI.Services;

namespace LostAndFoundAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly TokenService _tokenService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(ApplicationDbContext context, TokenService tokenService, ILogger<UsersController> logger)
        {
            _context = context;
            _tokenService = tokenService;
            _logger = logger;
        }

        // GET: api/Users (for testing only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserResponseDTO>>> GetUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                var userDTOs = users.Select(u => new UserResponseDTO
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email
                });

                return Ok(userDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error occurred while retrieving users");
            }
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult<UserResponseDTO>> Register(UserRegisterDTO registerDto)
        {
            if (registerDto == null)
            {
                return BadRequest("Registration data is required");
            }

            if (string.IsNullOrWhiteSpace(registerDto.Username) || 
                string.IsNullOrWhiteSpace(registerDto.Email) || 
                string.IsNullOrWhiteSpace(registerDto.Password))
            {
                return BadRequest("Username, email, and password are required fields");
            }

            try
            {
                if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
                    return BadRequest("Username is already taken");

                if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                    return BadRequest("Email is already registered");

                var user = new User
                {
                    Username = registerDto.Username,
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var token = _tokenService.CreateToken(user);

                return Ok(new UserResponseDTO
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Token = token
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user {Username}", registerDto.Username);
                return StatusCode(500, "An error occurred while registering the user");
            }
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult<UserResponseDTO>> Login(UserLoginDTO loginDto)
        {
            if (loginDto == null)
            {
                return BadRequest("Login data is required");
            }

            if (string.IsNullOrWhiteSpace(loginDto.Username) || 
                string.IsNullOrWhiteSpace(loginDto.Password))
            {
                return BadRequest("Username and password are required fields");
            }

            try
            {
                var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == loginDto.Username);

                if (user == null)
                    return Unauthorized("Invalid username");

                if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                    return Unauthorized("Invalid password");

                var token = _tokenService.CreateToken(user);

                return Ok(new UserResponseDTO
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Token = token
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in user {Username}", loginDto.Username);
                return StatusCode(500, "An error occurred during login");
            }
        }
    }
} 