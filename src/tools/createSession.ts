import { z } from "zod";
import { CreateSessionParams } from '../utils/powerdrillClient.js';

// Define the schema for session creation parameters
const createSessionParamsSchema = z.object({
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
});

// Define the tool
export const createSessionTool = {
  name: 'powerdrill_create_session',
  description: 'Create a new session for grouping related jobs and maintaining conversation context',
  parameters: createSessionParamsSchema,
  handler: async (args: z.infer<typeof createSessionParamsSchema>, extra: unknown) => {
    try {
      // Initialize Powerdrill client
      const { PowerdrillClient } = await import('../utils/powerdrillClient.js');
      const client = new PowerdrillClient();
      
      // Create session parameters
      const sessionParams: CreateSessionParams = {
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
      
      console.log(`Created session ${response.data.id}`);
      
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
}; 