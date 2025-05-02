# Lost and Found API

A RESTful API for managing lost and found items built with ASP.NET Core.

## Features

- User authentication with JWT
- CRUD operations for lost and found items
- Entity Framework Core with SQL Server
- Swagger/OpenAPI documentation

## Prerequisites

- .NET 8.0 SDK
- SQL Server (or SQL Server LocalDB)

## Getting Started

1. Clone this repository
2. Update the connection string in `appsettings.json` if needed
3. Run the API:

```bash
dotnet run
```

4. Navigate to `https://localhost:5001/` to view the API documentation

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token

### Items

- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get item by ID
- `POST /api/items` - Add new item (requires authentication)
- `PUT /api/items/{id}` - Update item (requires authentication)
- `DELETE /api/items/{id}` - Delete item (requires authentication)

## Azure Deployment

When deploying to Azure App Service, follow these steps to ensure Swagger works correctly:

1. Make sure Program.cs has Swagger enabled for all environments (not just Development)
2. Include the web.config file with the proper configuration
3. Create an appsettings.Production.json file with Swagger enabled
4. If you encounter issues with Swagger not appearing in Azure:
   - Check that your App Service Plan is at least Basic tier
   - Try restarting the App Service
   - Check Application Logs for any errors
   - Ensure no environment conditional code is blocking Swagger

If you're seeing a blank page or error when accessing Swagger in Azure, you can troubleshoot by:

1. Opening the Kudu console (Advanced Tools) in the Azure portal
2. Checking the logs for any specific errors
3. Verifying the Swagger endpoint is accessible at `/swagger/v1/swagger.json`

## Development

### Entity Framework Migrations

To create a new migration:

```bash
dotnet ef migrations add <MigrationName>
```

To apply migrations to the database:

```bash
dotnet ef database update
```

## License

This project is licensed under the MIT License. 