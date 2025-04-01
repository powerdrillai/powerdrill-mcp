import { z } from "zod";
import { CreateJobParams } from '../utils/powerdrillClient.js';

// Define the schema for job creation parameters
const createJobParamsSchema = z.object({
  question: z.string().describe('The natural language question or prompt to analyze the data'),
  dataset_id: z.string().describe('The ID of the dataset to analyze'),
  datasource_ids: z.array(z.string()).optional().describe('Optional array of specific data source IDs within the dataset to analyze'),
  session_id: z.string().optional().describe('Optional session ID to group related jobs'),
  stream: z.boolean().optional().default(false).describe('Whether to stream the results (default: false)'),
  output_language: z.string().optional().default('AUTO').describe('The language for the output (default: AUTO)'),
  job_mode: z.string().optional().default('AUTO').describe('The job mode (default: AUTO)')
});

// Define interfaces for the job response
interface JobBlock {
  type: string;
  content: any;
  group_id?: string;
  group_name?: string;
  stage?: string;
}

interface JobResponse {
  job_id: string;
  blocks: JobBlock[];
}

interface PowerdrillJobResponse {
  code: number;
  data: JobResponse;
}

// Define the tool
export const createJobTool = {
  name: 'powerdrill_create_job',
  description: 'Create a job to analyze data with natural language questions',
  parameters: createJobParamsSchema,
  handler: async (args: z.infer<typeof createJobParamsSchema>, extra: unknown) => {
    try {
      // Initialize Powerdrill client
      const { PowerdrillClient } = await import('../utils/powerdrillClient.js');
      const client = new PowerdrillClient();
      
      // Create job parameters
      const jobParams: CreateJobParams = {
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
      const processedBlocks = response.data.blocks.map((block: JobBlock) => {
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
}; 