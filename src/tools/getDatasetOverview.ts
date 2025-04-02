import { z } from "zod";

// Define the parameters schema using Zod
const getDatasetOverviewParametersSchema = z.object({
  datasetId: z.string().describe('The ID of the dataset to get overview information for')
});

// Define response data interfaces
interface DatasetOverviewData {
  id: string;
  name: string;
  description: string;
  summary: string;
  exploration_questions: string[];
  keywords: string[];
}

interface PowerdrillResponse {
  code: number;
  data: DatasetOverviewData;
}

// Define the tool
export const getDatasetOverviewTool = {
  name: 'powerdrill_get_dataset_overview',
  description: 'Get detailed overview information about a specific dataset including description, summary, exploration questions and keywords',
  parameters: getDatasetOverviewParametersSchema,
  handler: async (args: z.infer<typeof getDatasetOverviewParametersSchema>, extra: unknown) => {
    try {
      const { datasetId } = args;

      // Initialize Powerdrill client
      const { PowerdrillClient } = await import('../utils/powerdrillClient.js');
      const client = new PowerdrillClient();

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
}; 