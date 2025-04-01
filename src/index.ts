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
      
      console.log(`Retrieved ${datasets.length} datasets from Powerdrill`);
      
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

// Register the getDatasetOverview tool
server.tool(
  'powerdrill_get_dataset_overview',
  {
    datasetId: z.string().describe('The ID of the dataset to get overview information for')
  },
  async (args, extra) => {
    try {
      const { datasetId } = args;
      
      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();
      
      // Fetch dataset overview
      const response = await client.getDatasetOverview(datasetId);
      
      // Check if response is valid
      if (response.code !== 0 || !response.data) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }
      
      console.log(`Retrieved overview for dataset ${datasetId}`);
      
      // Format the response as MCP content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: response.data.id,
              name: response.data.name,
              description: response.data.description,
              summary: response.data.summary,
              exploration_questions: response.data.exploration_questions,
              keywords: response.data.keywords
            })
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error getting dataset overview: ${error.message}`);
      
      // Return error response
      return {
        content: [
          {
            type: "text",
            text: `Error getting dataset overview: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register the createJob tool
server.tool(
  'powerdrill_create_job',
  {
    question: z.string().describe('The natural language question or prompt to analyze the data'),
    dataset_id: z.string().describe('The ID of the dataset to analyze'),
    datasource_ids: z.array(z.string()).optional().describe('Optional array of specific data source IDs within the dataset to analyze'),
    session_id: z.string().optional().describe('Optional session ID to group related jobs'),
    stream: z.boolean().optional().default(false).describe('Whether to stream the results (default: false)'),
    output_language: z.string().optional().default('AUTO').describe('The language for the output (default: AUTO)'),
    job_mode: z.string().optional().default('AUTO').describe('The job mode (default: AUTO)')
  },
  async (args, extra) => {
    try {
      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();
      
      // Create job parameters
      const jobParams = {
        question: args.question,
        dataset_id: args.dataset_id,
        datasource_ids: args.datasource_ids,
        session_id: args.session_id,
        stream: args.stream,
        output_language: args.output_language,
        job_mode: args.job_mode
      };
      
      // Create job
      const response = await client.createJob(jobParams);
      
      // Check if response is valid
      if (response.code !== 0 || !response.data) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }
      
      console.log(`Created job ${response.data.job_id} for dataset ${args.dataset_id}`);
      
      // Process blocks for a cleaner response
      const processedBlocks = response.data.blocks.map((block: any) => {
        // For TABLE and IMAGE types, just include the URL and name
        if (block.type === 'TABLE' || block.type === 'IMAGE') {
          return {
            type: block.type,
            url: block.content.url,
            name: block.content.name,
            expires_at: block.content.expires_at
          };
        }
        
        // For other types, keep the original content
        return {
          type: block.type,
          content: block.content,
          stage: block.stage
        };
      });
      
      // Format the response as MCP content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              job_id: response.data.job_id,
              blocks: processedBlocks
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error creating job: ${error.message}`);
      
      // Return error response
      return {
        content: [
          {
            type: "text",
            text: `Error creating job: ${error.message}`
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