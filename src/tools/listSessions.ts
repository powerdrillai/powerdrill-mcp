import { z } from "zod";
import { PowerdrillClient } from '../utils/powerdrillClient.js';

// Define the parameters schema using Zod
const listSessionsParametersSchema = z.object({
  pageNumber: z.number().optional().default(1).describe('The page number to start listing (default: 1)'),
  pageSize: z.number().optional().default(10).describe('The number of items on a single page (default: 10)'),
  search: z.string().optional().describe('Search for sessions by name')
});

// Define the session interface
export interface Session {
  id: string;
  name: string;
  output_language: string;
  job_mode: string;
  max_contextual_job_history: number;
  agent_id: string;
}

// Define the Powerdrill API response
export interface SessionsResponse {
  code: number;
  data: {
    page_number: number;
    page_size: number;
    total_items: number;
    records: Session[];
  };
}

// Type for handler args
type ListSessionsArgs = z.infer<typeof listSessionsParametersSchema>;

// Define the tool
export const listSessionsToolDefinition = {
  name: 'powerdrill_list_sessions',
  description: 'List sessions from Powerdrill',
  parameters: listSessionsParametersSchema,
  handler: async (args: ListSessionsArgs, extra: unknown) => {
    try {
      const { pageNumber, pageSize, search } = args;

      // Initialize Powerdrill client
      const client = new PowerdrillClient();

      // Fetch sessions
      const response = await client.listSessions({
        pageNumber,
        pageSize,
        search
      });

      // Check if response is valid
      if (response.code !== 0 || !response.data || !response.data.records) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }

      // Format the response as MCP content
      const result = {
        page_number: response.data.page_number,
        page_size: response.data.page_size,
        total_items: response.data.total_items,
        sessions: response.data.records.map((session: Session) => ({
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
}; 