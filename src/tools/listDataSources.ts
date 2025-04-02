import { z } from "zod";
import { PowerdrillClient } from '../utils/powerdrillClient.js';

// Define the parameters schema using Zod
const listDataSourcesParametersSchema = z.object({
  datasetId: z.string().describe('The ID of the dataset to list data sources from'),
  pageNumber: z.number().optional().describe('The page number to start listing (default: 1)'),
  pageSize: z.number().optional().describe('The number of items on a single page (default: 10)'),
  status: z.string().optional().describe('Filter data sources by status: synching, invalid, synched (comma-separated for multiple)')
});

// Define the data source interface
export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  size: number;
  dataset_id: string;
}

// Define the Powerdrill API response
export interface PowerdrillResponse {
  code: number;
  data: {
    page_number: number;
    page_size: number;
    total_items: number;
    records: DataSource[];
  };
}

// Type for handler args
type ListDataSourcesArgs = z.infer<typeof listDataSourcesParametersSchema>;

// Define the tool
export const listDataSourcesToolDefinition = {
  name: 'powerdrill_list_data_sources',
  description: 'List data sources from a specific dataset in Powerdrill',
  parameters: listDataSourcesParametersSchema,
  handler: async (args: ListDataSourcesArgs, extra: unknown) => {
    try {
      const { datasetId, pageNumber, pageSize, status } = args;

      // Initialize Powerdrill client
      const client = new PowerdrillClient();

      // Fetch data sources
      const response = await client.listDataSources(datasetId, {
        pageNumber,
        pageSize,
        status
      });

      // Check if response is valid
      if (response.code !== 0 || !response.data || !response.data.records) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
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
        data_sources: dataSources.map((dataSource: DataSource) => ({
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
}; 