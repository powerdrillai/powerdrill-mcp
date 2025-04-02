import { z } from "zod";
import { PowerdrillClient } from '../utils/powerdrillClient.js';

// Define the parameters schema using Zod
const listDatasetsParametersSchema = z.object({
  limit: z.number().optional().describe('Maximum number of datasets to return')
});

// Define the dataset interface
export interface Dataset {
  id: string;
  name: string;
  description?: string;
}

// Define the Powerdrill API response
export interface PowerdrillResponse {
  code: number;
  data: {
    page_number: number;
    page_size: number;
    total_items: number;
    records: Dataset[];
  };
}

// Type for handler args
type ListDatasetsArgs = z.infer<typeof listDatasetsParametersSchema>;

// Define the tool
export const listDatasetsToolDefinition = {
  name: 'powerdrill_list_datasets',
  description: 'List available datasets from Powerdrill',
  parameters: listDatasetsParametersSchema,
  handler: async (args: ListDatasetsArgs, extra: unknown) => {
    try {
      const { limit } = args;

      // Initialize Powerdrill client
      const client = new PowerdrillClient();

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
}; 