import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
import { z } from "zod";

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['POWERDRILL_USER_ID', 'POWERDRILL_PROJECT_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Define dataset interface
interface Dataset {
  id: string;
  name: string;
  description?: string;
}

// Initialize the MCP server
const server = new McpServer({
  name: 'powerdrill-mcp',
  version: '0.1.0',
  description: 'MCP server for Powerdrill dataset tools'
});

// Register the listDatasets tool with simplified parameters
server.tool(
  'powerdrill_list_datasets',
  {
    limit: z.number().optional().describe('Maximum number of datasets to return')
  },
  async (args, extra) => {
    try {
      const { limit } = args;
      
      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();
      
      // Fetch datasets
      const response = await client.listDatasets();
      
      // Check if response is valid
      if (response.code !== 0 || !response.data || !response.data.records) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }
      
      // Apply limit if provided
      let datasets = response.data.records || [];
      if (limit && limit > 0) {
        datasets = datasets.slice(0, limit);
      }
      
      // Format the response as MCP content
      const result = {
        datasets: datasets.map((dataset: Dataset) => ({
          id: dataset.id,
          name: dataset.name,
          description: dataset.description || ''
        }))
      };
      
      // Return the formatted response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error listing datasets: ${error.message}`);
      
      // Return error response
      return {
        content: [
          {
            type: "text",
            text: `Error listing datasets: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => {
    console.log('Powerdrill MCP server started');
  })
  .catch((error: Error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  }); 