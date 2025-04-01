# Powerdrill MCP Server

A Model Context Protocol (MCP) server that provides tools to interact with Powerdrill datasets, authenticated with Powerdrill User ID and Project API Key.

## Features

- Authenticate with Powerdrill using User ID and Project API Key
- List available datasets through MCP tools
- Get detailed overview information for a specific dataset
- Integration with Claude Desktop and other MCP-compatible clients

## Quick Setup

The easiest way to set up the server is using the provided setup script:

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

This will:
1. Install dependencies
2. Build the TypeScript code
3. Create a `.env` file if it doesn't exist
4. Generate a Claude Desktop configuration file

Then edit your `.env` file with your actual credentials:
```
POWERDRILL_USER_ID=your_actual_user_id
POWERDRILL_PROJECT_API_KEY=your_actual_project_api_key
```

## Manual Installation

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Copy the environment example file
cp .env.example .env

# Edit the .env file with your credentials
```

## Usage

### Running the server

```bash
npm start
```

### Integrating with Claude Desktop

1. Open Claude Desktop
2. Go to Settings > Server Settings
3. Add a new server with the configuration from `claude_desktop_config.json` or manually configure:

```json
{
  "powerdrill": {
    "command": "node",
    "args": ["/path/to/powerdrill-mcp/dist/index.js"],
    "env": {
      "POWERDRILL_USER_ID": "your_actual_user_id",
      "POWERDRILL_PROJECT_API_KEY": "your_actual_project_api_key"
    }
  }
}
```

4. Save the configuration
5. Restart Claude Desktop

### Using the tools

Once connected, you can use the Powerdrill tools in your conversations with Claude:

- List datasets: `What datasets are available in my Powerdrill account?`
- Get dataset overview: `Tell me more about this dataset: {dataset_id}`

## Available Tools

### powerdrill_list_datasets

Lists available datasets from your Powerdrill account.

Parameters:
- `limit` (optional): Maximum number of datasets to return

Example response:
```json
{
  "datasets": [
    {
      "id": "dataset-dasfadsgadsgas",
      "name": "mysql",
      "description": "mysql databases"
    }
  ]
}
```

### powerdrill_get_dataset_overview

Gets detailed overview information about a specific dataset.

Parameters:
- `datasetId` (required): The ID of the dataset to get overview information for

Example response:
```json
{
  "id": "dset-cm5axptyyxxx298",
  "name": "sales_indicators_2024",
  "description": "A dataset comprising 373 travel bookings with 15 attributes...",
  "summary": "This dataset contains 373 travel bookings with 15 attributes...",
  "exploration_questions": [
    "How does the booking price trend over time based on the BookingTimestamp?",
    "How does the average booking price change with respect to the TravelDate?"
  ],
  "keywords": [
    "Travel Bookings",
    "Booking Trends",
    "Travel Agencies"
  ]
}
```

## Troubleshooting

If you encounter issues:

1. Make sure your environment variables are set correctly in `.env`
2. Check that the server starts successfully with `npm start`
3. Verify your Claude Desktop configuration points to the correct file paths
4. Check the console output for any error messages

## License

MIT
