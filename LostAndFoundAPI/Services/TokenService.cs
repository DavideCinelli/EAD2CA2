using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LostAndFoundAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace LostAndFoundAPI.Services
{
    public class TokenService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<TokenService> _logger;

        public TokenService(IConfiguration config, ILogger<TokenService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public string CreateToken(User user)
        {
            try
            {
                var jwtKey = _config["Jwt:Key"];
                if (string.IsNullOrEmpty(jwtKey))
                {
                    _logger.LogError("JWT Key is missing or empty in configuration");
                    throw new InvalidOperationException("JWT Key is not properly configured");
                }

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email)
                };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

                var expireDays = 7; // Default to 7 days
                if (!string.IsNullOrEmpty(_config["Jwt:ExpireDays"]) && 
                    int.TryParse(_config["Jwt:ExpireDays"], out int configuredDays))
                {
                    expireDays = configuredDays;
                }

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(expireDays),
                    SigningCredentials = creds,
                    Issuer = _config["Jwt:Issuer"] ?? "LostAndFoundAPI",
                    Audience = _config["Jwt:Audience"] ?? "LostAndFoundAPI"
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                return tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating JWT token");
                throw;
            }
        }
    }
} 