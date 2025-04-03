#!/usr/bin/env node

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
  version: '0.1.9',
  description: 'MCP server for Powerdrill dataset tools'
});

// Register the listDatasets tool with simplified parameters
server.tool(
  'mcp_powerdrill_list_datasets',
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
      if (!response) {
        throw new Error(`Empty response received from API`);
      }

      if (response.code !== 0) {
        throw new Error(`API returned error code: ${response.code}, message: ${response.message || 'No message'}`);
      }

      if (!response.data || !response.data.records) {
        throw new Error(`Invalid API response format: missing data.records property`);
      }

      // Apply limit if provided
      let datasets = response.data.records || [];
      if (limit && limit > 0) {
        datasets = datasets.slice(0, limit);
      }

      if (datasets.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "No datasets found",
                datasets: []
              })
            }
          ]
        };
      }

      // Format the response as MCP content
      const result = {
        count: datasets.length,
        total: response.data.total_items || datasets.length,
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
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error listing datasets: ${error.message}`);
      console.error(error.stack);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Error listing datasets: ${error.message}`,
              errorType: error.name,
              errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
);

// Register the getDatasetOverview tool
server.tool(
  'mcp_powerdrill_get_dataset_overview',
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
  'mcp_powerdrill_create_job',
  {
    question: z.string().describe('The natural language question or prompt to analyze the data'),
    dataset_id: z.string().describe('The ID of the dataset to analyze'),
    datasource_ids: z.array(z.string()).optional().describe('Optional array of specific data source IDs within the dataset to analyze'),
    session_id: z.string().describe('Session ID to group related jobs'),
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

// Register the createSession tool
server.tool(
  'mcp_powerdrill_create_session',
  {
    name: z.string().describe('The session name, which can be up to 128 characters in length'),
    output_language: z.enum(['AUTO', 'EN', 'ES', 'AR', 'PT', 'ID', 'JA', 'RU', 'HI', 'FR', 'DE', 'VI', 'TR', 'PL', 'IT', 'KO', 'ZH-CN', 'ZH-TW'])
      .optional()
      .default('AUTO')
      .describe('The language in which the output is generated'),
    job_mode: z.enum(['AUTO', 'DATA_ANALYTICS'])
      .optional()
      .default('AUTO')
      .describe('Job mode for the session'),
    max_contextual_job_history: z.number()
      .min(0)
      .max(10)
      .optional()
      .default(10)
      .describe('The maximum number of recent jobs retained as context for the next job'),
    agent_id: z.enum(['DATA_ANALYSIS_AGENT'])
      .optional()
      .default('DATA_ANALYSIS_AGENT')
      .describe('The ID of the agent')
  },
  async (args, extra) => {
    try {
      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();

      // Create session parameters
      const sessionParams = {
        name: args.name,
        output_language: args.output_language,
        job_mode: args.job_mode,
        max_contextual_job_history: args.max_contextual_job_history,
        agent_id: args.agent_id
      };

      // Create session
      const response = await client.createSession(sessionParams);

      // Check if response is valid
      if (response.code !== 0 || !response.data) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }

      // Format the response as MCP content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              session_id: response.data.id
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error creating session: ${error.message}`);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: `Error creating session: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register the listDataSources tool
server.tool(
  'mcp_powerdrill_list_data_sources',
  {
    datasetId: z.string().describe('The ID of the dataset to list data sources from'),
    pageNumber: z.number().optional().describe('The page number to start listing (default: 1)'),
    pageSize: z.number().optional().describe('The number of items on a single page (default: 10)'),
    status: z.string().optional().describe('Filter data sources by status: synching, invalid, synched (comma-separated for multiple)')
  },
  async (args, extra) => {
    try {
      const { datasetId, pageNumber, pageSize, status } = args;

      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();

      // Fetch data sources
      const response = await client.listDataSources(datasetId, {
        pageNumber,
        pageSize,
        status
      });

      // Check if response is valid
      if (!response) {
        throw new Error(`Empty response received from API`);
      }

      if (response.code !== 0) {
        throw new Error(`API returned error code: ${response.code}, message: ${response.message || 'No message'}`);
      }

      if (!response.data || !response.data.records) {
        throw new Error(`Invalid API response format: missing data.records property`);
      }

      const dataSources = response.data.records || [];

      if (dataSources.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "No data sources found in the dataset",
                data_sources: []
              }, null, 2)
            }
          ]
        };
      }

      // Format the response as MCP content
      const result = {
        count: dataSources.length,
        total: response.data.total_items || dataSources.length,
        page: response.data.page_number || 1,
        page_size: response.data.page_size || 10,
        data_sources: dataSources.map((dataSource: any) => ({
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          status: dataSource.status,
          size: dataSource.size,
          dataset_id: dataSource.dataset_id
        }))
      };

      // Return the formatted response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error listing data sources: ${error.message}`);
      console.error(error.stack);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Error listing data sources: ${error.message}`,
              errorType: error.name,
              errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
);

// Register the list sessions tool
server.tool(
  'mcp_powerdrill_list_sessions',
  {
    pageNumber: z.number().optional().describe('The page number to start listing (default: 1)'),
    pageSize: z.number().optional().describe('The number of items on a single page (default: 10)'),
    search: z.string().optional().describe('Search for sessions by name')
  },
  async (args, extra) => {
    try {
      const { pageNumber, pageSize, search } = args;

      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();

      // Fetch sessions
      const response = await client.listSessions({
        pageNumber,
        pageSize,
        search
      });

      // Check if response is valid
      if (!response) {
        throw new Error(`Empty response received from API`);
      }

      if (response.code !== 0) {
        throw new Error(`API returned error code: ${response.code}, message: ${response.message || 'No message'}`);
      }

      if (!response.data || !response.data.records) {
        throw new Error(`Invalid API response format: missing data.records property`);
      }

      const sessions = response.data.records || [];

      if (sessions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "No sessions found",
                sessions: []
              }, null, 2)
            }
          ]
        };
      }

      // Format the response as MCP content
      const result = {
        page_number: response.data.page_number,
        page_size: response.data.page_size,
        total_items: response.data.total_items,
        count: sessions.length,
        sessions: sessions.map((session: any) => ({
          id: session.id,
          name: session.name,
          output_language: session.output_language,
          job_mode: session.job_mode,
          max_contextual_job_history: session.max_contextual_job_history,
          agent_id: session.agent_id
        }))
      };

      // Return the formatted response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error listing sessions: ${error.message}`);
      console.error(error.stack);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Error listing sessions: ${error.message}`,
              errorType: error.name,
              errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
);

// Register the createDataset tool
server.tool(
  'mcp_powerdrill_create_dataset',
  {
    name: z.string().describe('The dataset name, which can be up to 128 characters in length'),
    description: z.string().optional().describe('The dataset description, which can be up to 128 characters in length')
  },
  async (args, extra) => {
    try {
      const { name, description } = args;

      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();

      // Create dataset parameters
      const datasetParams = {
        name,
        description
      };

      // Create dataset
      const response = await client.createDataset(datasetParams);

      // Check if response is valid
      if (response.code !== 0 || !response.data) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }

      // Format the response as MCP content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: response.data.id,
              message: "Dataset created successfully"
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error creating dataset: ${error.message}`);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Error creating dataset: ${error.message}`,
              errorType: error.name,
              errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
);

// Register the createDataSourceFromLocalFile tool
server.tool(
  'mcp_powerdrill_create_data_source_from_local_file',
  {
    dataset_id: z.string().describe('The ID of the dataset to create the data source in'),
    file_path: z.string().describe('The local path to the file to upload'),
    file_name: z.string().optional().describe('Optional custom name for the file, defaults to the original filename'),
    chunk_size: z.number().optional().default(5 * 1024 * 1024).describe('Size of each chunk in bytes, default is 5MB')
  },
  async (args, extra) => {
    try {
      const { dataset_id, file_path, file_name, chunk_size } = args;

      // Import required modules
      const fs = await import('fs');
      const path = await import('path');
      const axios = await import('axios');

      // Validate file existence
      if (!fs.existsSync(file_path)) {
        throw new Error(`File not found: ${file_path}`);
      }

      // Get file stats
      const stats = fs.statSync(file_path);
      const fileSize = stats.size;

      // Determine file name if not provided
      const actualFileName = file_name || path.basename(file_path);

      // Initialize Powerdrill client
      const client = new (await import('./utils/powerdrillClient.js')).PowerdrillClient();

      // Helper function to read a file in chunks
      const readFileChunk = (filePath: string, start: number, end: number): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(filePath, { start, end });
          const chunks: Buffer[] = [];

          readStream.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else {
              chunks.push(Buffer.from(chunk));
            }
          });
          readStream.on('error', (err) => reject(err));
          readStream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };

      // Helper function to upload a file chunk and get its ETag
      const uploadFileChunk = async (url: string, chunk: Buffer): Promise<string> => {
        try {
          const response = await axios.default.put(url, chunk, {
            headers: {
              'Content-Type': 'application/octet-stream'
            }
          });

          // Extract ETag from response headers, remove quotes if present
          const etag = response.headers.etag || '';
          return etag.replace(/"/g, '');
        } catch (error: any) {
          console.error('Error uploading file chunk:', error.message);
          throw error;
        }
      };

      // Helper function to poll a data source until it's synched or fails
      const pollDataSourceStatus = async (datasetId: string, dataSourceId: string, maxAttempts: number = 20, delayMs: number = 3000) => {
        let attempts = 0;

        while (attempts < maxAttempts) {
          const response = await client.getDataSource(datasetId, dataSourceId);

          if (response.code !== 0) {
            throw new Error(`Error getting data source status: ${JSON.stringify(response)}`);
          }

          if (response.data.status === 'synched') {
            return response;
          }

          if (response.data.status === 'invalid') {
            throw new Error(`Data source processing failed with status: invalid`);
          }

          // Wait before the next attempt
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempts++;
        }

        throw new Error(`Timed out waiting for data source to be synched after ${maxAttempts} attempts`);
      };

      // Step 1: Initiate multipart upload
      const initUploadResponse = await client.initiateMultipartUpload({
        file_name: actualFileName,
        file_size: fileSize
      });

      if (initUploadResponse.code !== 0 || !initUploadResponse.data) {
        throw new Error(`Failed to initiate multipart upload: ${JSON.stringify(initUploadResponse)}`);
      }

      const { upload_id, file_object_key, part_items } = initUploadResponse.data;

      // Step 2: Upload each file part
      const partEtags = [];

      for (const part of part_items) {
        const startByte = (part.number - 1) * chunk_size;
        const endByte = Math.min(startByte + part.size - 1, fileSize - 1);

        // Read file chunk
        const chunk = await readFileChunk(file_path, startByte, endByte);

        // Upload chunk and get ETag
        const etag = await uploadFileChunk(part.upload_url, chunk);

        partEtags.push({
          number: part.number,
          etag: etag
        });
      }

      // Step 3: Complete multipart upload
      const completeUploadResponse = await client.completeMultipartUpload({
        file_object_key,
        upload_id,
        part_etags: partEtags
      });

      if (completeUploadResponse.code !== 0 || !completeUploadResponse.data) {
        throw new Error(`Failed to complete multipart upload: ${JSON.stringify(completeUploadResponse)}`);
      }

      // Step 4: Create data source
      const createDataSourceResponse = await client.createDataSource(dataset_id, {
        name: actualFileName,
        type: 'FILE',
        file_object_key: completeUploadResponse.data.file_object_key
      });

      if (createDataSourceResponse.code !== 0 || !createDataSourceResponse.data) {
        throw new Error(`Failed to create data source: ${JSON.stringify(createDataSourceResponse)}`);
      }

      const dataSourceId = createDataSourceResponse.data.id;

      // Step 5: Poll until data source is synched
      const finalStatus = await pollDataSourceStatus(dataset_id, dataSourceId);

      // Format the response as MCP content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              dataset_id,
              data_source: {
                id: dataSourceId,
                name: finalStatus.data.name,
                type: finalStatus.data.type,
                status: finalStatus.data.status,
                size: finalStatus.data.size
              },
              file: {
                name: actualFileName,
                size: fileSize,
                object_key: file_object_key
              }
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error creating data source from local file: ${error.message}`);
      console.error(error.stack);

      // Return error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Error creating data source from local file: ${error.message}`,
              errorType: error.name || 'UnknownError',
              errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
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
  })
  .catch((error: Error) => {
    process.exit(1);
  }); 