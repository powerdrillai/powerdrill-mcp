# Powerdrill MCP Server

A Model Context Protocol (MCP) server that provides tools to interact with Powerdrill datasets, authenticated with Powerdrill User ID and Project API Key.

Notes: currently the Powerdrill MCP server implemented the READ-ONLY interfaces for security reason to avoid the data being deleted by LLM in accident.

If you want to modify data (CREATE/DELETE/UPDATE) in Powerdrill, please go to https://powerdrill.ai/ with your Team access, or if you have the Powerdrill User ID and Project API Key of your Team, you can manipulate the data via https://powerdrill-flow.streamlit.app/.

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
# Run the latest version
npx -y @powerdrillai/powerdrill-mcp@latest
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
4. Generate configuration files for Claude Desktop and Cursor with the npx-based configuration (recommended)

Then edit your `.env` file with your actual credentials:
```
POWERDRILL_USER_ID=your_actual_user_id
POWERDRILL_PROJECT_API_KEY=your_actual_project_api_key
```

Also update the credentials in the generated configuration files before using them.

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
3. Add a new server with one of the following configurations:

#### Option 1: Using npx (Recommended)

```json
{
  "powerdrill": {
    "command": "npx",
    "args": [
      "-y",
      "@powerdrillai/powerdrill-mcp@latest"
    ],
    "env": {
      "POWERDRILL_USER_ID": "your_actual_user_id",
      "POWERDRILL_PROJECT_API_KEY": "your_actual_project_api_key"
    }
  }
}
```

#### Option 2: Using node with local installation

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
3. Add a new MCP tool with one of the following configurations:

#### Option 1: Using npx (Recommended)

```json
{
  "powerdrill": {
    "command": "npx",
    "args": [
      "-y",
      "@powerdrillai/powerdrill-mcp@latest"
    ],
    "env": {
      "POWERDRILL_USER_ID": "your_actual_user_id",
      "POWERDRILL_PROJECT_API_KEY": "your_actual_project_api_key"
    }
  }
}
```

#### Option 2: Using node with local installation

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
- Create a session: `Create a new session named "Sales Analysis 2024" for my data analysis`
- List data sources: `What data sources are available in dataset {dataset_id}?`
- List sessions: `Show me all my current analysis sessions`

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
      "name": "mydata",
      "description": "my dataset"
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

### mcp_powerdrill_create_session

Creates a new session to group related jobs together.

Parameters:
- `name` (required): The session name, which can be up to 128 characters in length
- `output_language` (optional, default: "AUTO"): The language in which the output is generated. Options include: "AUTO", "EN", "ES", "AR", "PT", "ID", "JA", "RU", "HI", "FR", "DE", "VI", "TR", "PL", "IT", "KO", "ZH-CN", "ZH-TW"
- `job_mode` (optional, default: "AUTO"): Job mode for the session. Options include: "AUTO", "DATA_ANALYTICS"
- `max_contextual_job_history` (optional, default: 10): The maximum number of recent jobs retained as context for the next job (0-10)
- `agent_id` (optional, default: "DATA_ANALYSIS_AGENT"): The ID of the agent

Example response:
```json
{
  "session_id": "session-abcdefghijklmnopqrstuvwxyz"
}
```

### mcp_powerdrill_list_data_sources

Lists data sources in a specific dataset.

Parameters:
- `datasetId` (required): The ID of the dataset to list data sources from
- `pageNumber` (optional, default: 1): The page number to start listing
- `pageSize` (optional, default: 10): The number of items on a single page
- `status` (optional): Filter data sources by status: synching, invalid, synched (comma-separated for multiple)

Example response:
```json
{
  "count": 3,
  "total": 5,
  "page": 1,
  "page_size": 10,
  "data_sources": [
    {
      "id": "dsource-a1b2c3d4e5f6g7h8i9j0",
      "name": "sales_data.csv",
      "type": "CSV",
      "status": "synched",
      "size": 1048576,
      "dataset_id": "dset-cm5axptyyxxx298"
    },
    {
      "id": "dsource-b2c3d4e5f6g7h8i9j0k1",
      "name": "customer_info.xlsx",
      "type": "EXCEL",
      "status": "synched",
      "size": 2097152,
      "dataset_id": "dset-cm5axptyyxxx298"
    },
    {
      "id": "dsource-c3d4e5f6g7h8i9j0k1l2",
      "name": "market_research.pdf",
      "type": "PDF",
      "status": "synched",
      "size": 3145728,
      "dataset_id": "dset-cm5axptyyxxx298"
    }
  ]
}
```

### mcp_powerdrill_list_sessions

Lists available sessions for the current user.

Parameters:
- `pageNumber` (optional, default: 1): The page number to start listing
- `pageSize` (optional, default: 10): The number of items on a single page
- `search` (optional): Search for sessions by name

Example response:
```json
{
  "page_number": 1,
  "page_size": 10,
  "total_items": 25,
  "count": 3,
  "sessions": [
    {
      "id": "session-a1b2c3d4e5f6g7h8i9j0",
      "name": "Sales Analysis 2024",
      "output_language": "EN",
      "job_mode": "DATA_ANALYTICS",
      "max_contextual_job_history": 10,
      "agent_id": "DATA_ANALYSIS_AGENT"
    },
    {
      "id": "session-b2c3d4e5f6g7h8i9j0k1",
      "name": "Customer Segmentation",
      "output_language": "AUTO",
      "job_mode": "AUTO",
      "max_contextual_job_history": 8,
      "agent_id": "DATA_ANALYSIS_AGENT"
    },
    {
      "id": "session-c3d4e5f6g7h8i9j0k1l2",
      "name": "Market Trends",
      "output_language": "EN",
      "job_mode": "DATA_ANALYTICS",
      "max_contextual_job_history": 5,
      "agent_id": "DATA_ANALYSIS_AGENT"
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
