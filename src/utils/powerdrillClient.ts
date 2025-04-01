import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface PowerdrillConfig {
  userId: string;
  projectApiKey: string;
  apiUrl: string;
}

export class PowerdrillClient {
  private client;
  private config: PowerdrillConfig;

  constructor(config?: Partial<PowerdrillConfig>) {
    this.config = {
      userId: config?.userId || process.env.POWERDRILL_USER_ID || '',
      projectApiKey: config?.projectApiKey || process.env.POWERDRILL_PROJECT_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.POWERDRILL_API_URL || 'https://ai.data.cloud/api/v2/team'
    };

    if (!this.config.userId || !this.config.projectApiKey) {
      throw new Error('Powerdrill User ID and Project API Key are required');
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-pd-api-key': this.config.projectApiKey
      }
    });
  }

  /**
   * List all datasets available in the project
   * @returns Promise with the list of datasets
   */
  async listDatasets() {
    try {
      const response = await this.client.get(`/datasets?user_id=${this.config.userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error listing datasets:', error.message);
      throw error;
    }
  }

  /**
   * Get details for a specific dataset
   * @param datasetId The ID of the dataset to retrieve
   * @returns Promise with the dataset details
   */
  async getDataset(datasetId: string) {
    try {
      const response = await this.client.get(`/datasets/${datasetId}?user_id=${this.config.userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error retrieving dataset ${datasetId}:`, error.message);
      throw error;
    }
  }
} 