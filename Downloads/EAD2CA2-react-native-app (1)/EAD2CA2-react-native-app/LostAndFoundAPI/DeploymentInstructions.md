# Azure Deployment Instructions

This guide walks through the steps to deploy the Lost and Found API to Azure App Service with working Swagger.

## Prerequisites

- Azure account with an active subscription
- .NET 8.0 SDK or later
- The Lost and Found API project

## Deployment Steps

### 1. Prepare Your Application

1. **Ensure Swagger works locally**:
   - Run the application locally with `dotnet run`
   - Navigate to `https://localhost:5001/` or `https://localhost:5001/swagger`
   - Verify that Swagger UI loads and all endpoints are visible

2. **Check Program.cs configuration**:
   - Make sure Swagger is enabled for all environments (remove environment conditionals)
   - Ensure static files middleware is included
   ```csharp
   app.UseDefaultFiles();
   app.UseStaticFiles();
   app.UseSwagger();
   app.UseSwaggerUI(c => {
       c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lost and Found API v1");
   });
   ```

3. **Include necessary configuration files**:
   - Ensure you have a valid `web.config` file in your project
   - Add an `appsettings.Production.json` file with Swagger settings
   - Include an `index.html` in the wwwroot folder if you want a redirect to Swagger

### 2. Publish Your Application

1. **Build and publish the application**:
   ```bash
   dotnet publish -c Release
   ```

2. **Create a zip package** (optional - for manual deployment):
   - Navigate to the publish output folder: `bin/Release/net8.0/publish`
   - Create a zip file containing all published files

### 3. Create Azure Resources

1. **Log in to the Azure Portal** (https://portal.azure.com)

2. **Create a new App Service**:
   - Click "Create a resource"
   - Search for "Web App"
   - Click "Create"

3. **Configure the App Service**:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: Choose a unique name for your app (this will be the URL - e.g., `yourapp.azurewebsites.net`)
   - **Publish**: Code
   - **Runtime stack**: .NET 8 (or your version)
   - **Operating System**: Windows
   - **Region**: Choose a region close to your users
   - **App Service Plan**: 
     - Create new or select existing
     - **Important**: Choose at least Basic tier (B1) to ensure Swagger works correctly

4. **Review + create**:
   - Review your settings
   - Click "Create"

### 4. Deploy Your Application

#### Using Visual Studio

1. Right-click on your project in Solution Explorer
2. Select "Publish..."
3. Choose "Azure" as the target
4. Select "Azure App Service (Windows)"
5. Log in to your Azure account if prompted
6. Select the App Service you created
7. Click "Finish"
8. Click "Publish"

#### Using Azure CLI

1. Install the Azure CLI if you haven't already
2. Log in to Azure:
   ```bash
   az login
   ```
3. Deploy the app:
   ```bash
   az webapp deployment source config-zip --resource-group <your-resource-group> --name <your-app-name> --src <path-to-zip-file>
   ```

#### Using the Azure Portal

1. In your App Service, go to "Deployment Center"
2. Select "Local Git" or "GitHub" or other source control
3. Follow the prompts to connect your repository
4. Complete the deployment setup

### 5. Verify the Deployment

1. Wait for the deployment to complete
2. Navigate to your App Service URL:
   - `https://<your-app-name>.azurewebsites.net/`
   - `https://<your-app-name>.azurewebsites.net/swagger`

3. Check that Swagger UI loads correctly and API endpoints work

### 6. Troubleshooting

If Swagger doesn't work after deployment:

1. **Check app logs**:
   - In the Azure Portal, go to your App Service
   - Navigate to "App Service logs" and enable logging
   - Check the logs for errors

2. **Restart the App Service**:
   - Sometimes a simple restart resolves issues
   - In the Azure Portal, go to your App Service
   - Click "Restart"

3. **Verify configuration**:
   - Use Kudu console (Advanced Tools) to check your deployed files
   - Ensure `web.config` and other configuration files are correctly deployed
   - Try accessing the raw Swagger JSON: `https://<your-app-name>.azurewebsites.net/swagger/v1/swagger.json`

4. **Update App Service Plan**:
   - If using a Free tier, try upgrading to Basic tier or higher

5. **Check connection strings**:
   - Verify that your database connection string is correct in Application Settings

## Next Steps

After successful deployment, consider:

1. **Setting up CI/CD** for automated deployments
2. **Configuring SSL** for secure communication
3. **Setting up monitoring** using Application Insights
4. **Creating a custom domain** for your API

For detailed troubleshooting guidance, refer to the `troubleshooting.md` document. 