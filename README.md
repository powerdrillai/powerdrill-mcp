# Powerdrill MCP Server

A Model Context Protocol (MCP) server that provides tools to interact with Powerdrill datasets, authenticated with Powerdrill User ID and Project API Key.

## Features

- Authenticate with Powerdrill using User ID and Project API Key
- List available datasets in your Powerdrill account
- Get detailed information about specific datasets
- Create and run jobs on datasets with natural language questions
- Integration with Claude Desktop and other MCP-compatible clients

## Installation

### From npm

```bash
# Install globally
npm install -g @powerdrillai/powerdrill-mcp

# Or run directly with npx
npx @powerdrillai/powerdrill-mcp
```

### From Source

Clone this repository and install dependencies:

```bash
git clone https://github.com/yourusername/powerdrill-mcp.git
cd powerdrill-mcp
npm install
```

## CLI Usage

If installed globally:

```bash
# Start the MCP server
powerdrill-mcp
```

If using npx:

```bash
npx @powerdrillai/powerdrill-mcp
```

You'll need to configure environment variables with your Powerdrill credentials before running:

```bash
# Set environment variables
export POWERDRILL_USER_ID="your_user_id"
export POWERDRILL_PROJECT_API_KEY="your_project_api_key"
```

Or create a `.env` file with these values.

## Prerequisites

To use this MCP server, you'll need a Powerdrill account with valid API credentials (**User ID** and **API Key**). Here's how to obtain them:

1. Sign up for a Powerdrill Team account if you haven't already
2. Navigate to your account settings
3. Look for the API section where you'll find your:
   - User ID: A unique identifier for your account
   - API Key: Your authentication token for API access

First, watch this video tutorial on how to create your Powerdrill Team:

[![Create Powerdrill Team Tutorial](https://img.youtube.com/vi/I-0yGD9HeDw/maxresdefault.jpg)](https://www.youtube.com/watch?v=I-0yGD9HeDw)

Then, follow this video tutorial for setting up your API credentials:

[![Powerdrill API Setup Tutorial](https://img.youtube.com/vi/qs-GsUgjb1g/maxresdefault.jpg)](https://www.youtube.com/watch?v=qs-GsUgjb1g)

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

### Integrating with Cursor

1. Open Cursor
2. Go to Settings > MCP Tools
3. Add a new MCP tool with the following configuration:

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
5. Restart Cursor if needed

### Using the tools

Once connected, you can use the Powerdrill tools in your conversations with Claude:

- List datasets: `What datasets are available in my Powerdrill account?`
- Get dataset overview: `Tell me more about this dataset: {dataset_id}`
- Create a job: `Analyze dataset {dataset_id} with this question: "How has the trend changed over time?"`

## Available Tools

### mcp_powerdrill_list_datasets

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

### mcp_powerdrill_get_dataset_overview

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

### mcp_powerdrill_create_job

Creates a job to analyze data with natural language questions.

Parameters:
- `question` (required): The natural language question or prompt to analyze the data
- `dataset_id` (required): The ID of the dataset to analyze
- `datasource_ids` (optional): Array of specific data source IDs within the dataset to analyze
- `session_id` (optional): Session ID to group related jobs
- `stream` (optional, default: false): Whether to stream the results
- `output_language` (optional, default: "AUTO"): The language for the output
- `job_mode` (optional, default: "AUTO"): The job mode

Example response:
```json
{
  "job_id": "job-cm3ikdeuj02zk01l1yeuirt77",
  "blocks": [
    {
      "type": "CODE",
      "content": "```python\nimport pandas as pd\n\ndef invoke(input_0: pd.DataFrame) -> pd.DataFrame:\n...",
      "stage": "Analyze"
    },
    {
      "type": "TABLE",
      "url": "https://static.powerdrill.ai/tmp_datasource_cache/code_result/...",
      "name": "trend_data.csv",
      "expires_at": "2024-11-21T09:56:34.290544Z"
    },
    {
      "type": "IMAGE",
      "url": "https://static.powerdrill.ai/tmp_datasource_cache/code_result/...",
      "name": "Trend of Deaths from Natural Disasters Over the Century",
      "expires_at": "2024-11-21T09:56:34.290544Z"
    },
    {
      "type": "MESSAGE",
      "content": "Analysis of Trends in the Number of Deaths from Natural Disasters...",
      "stage": "Respond"
    }
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
