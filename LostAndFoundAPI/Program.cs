using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using LostAndFoundAPI.Data;
using LostAndFoundAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add logger
var logger = LoggerFactory.Create(config => 
{
    config.AddConsole();
    config.AddDebug();
}).CreateLogger("Program");

// Add database context
try 
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connectionString))
    {
        logger.LogError("Database connection string is missing or empty");
        throw new InvalidOperationException("Database connection string is not configured");
    }

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
}
catch (Exception ex)
{
    logger.LogError(ex, "Error configuring database context");
    throw;
}

// Add services
builder.Services.AddScoped<TokenService>();

// Add controllers
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
            "http://localhost:8081",  // Expo web development
            "http://localhost:19006", // Expo development server
            "https://lostandfoundapp-g7a2apb2bqgjc7hj.uksouth-01.azurewebsites.net" // Production
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    logger.LogError("JWT Key is missing or empty in configuration");
    throw new InvalidOperationException("JWT Key is not properly configured");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LostAndFoundAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LostAndFoundAPI",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                logger.LogError(context.Exception, "Authentication failed: {Message}", context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Lost and Found API",
        Version = "v1",
        Description = "A REST API for managing lost and found items"
    });

    // Configure Swagger to use JWT authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
// IMPORTANT: Removed environment condition to enable Swagger in all environments

// Add static files middleware to serve the index.html file
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lost and Found API v1");
    c.RoutePrefix = "swagger"; // Set Swagger UI path to /swagger
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Create database and tables if they don't exist
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var scopeLogger = services.GetRequiredService<ILogger<Program>>();
        scopeLogger.LogError(ex, "An error occurred while creating the database.");
    }
}

app.Run();
