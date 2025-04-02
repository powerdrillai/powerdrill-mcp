import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface PowerdrillConfig {
  userId: string;
  projectApiKey: string;
  apiUrl: string;
}

// Job creation parameters interface
export interface CreateJobParams {
  session_id: string;
  question: string;
  dataset_id: string;
  datasource_ids?: string[];
  stream?: boolean;
  output_language?: string;
  job_mode?: string;
}

// Session creation parameters interface
export interface CreateSessionParams {
  name: string;
  user_id?: string;
  output_language?: string;
  job_mode?: string;
  max_contextual_job_history?: number;
  agent_id?: string;
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
   * Get overview information for a specific dataset
   * @param datasetId The ID of the dataset to retrieve overview for
   * @returns Promise with the dataset overview
   */
  async getDatasetOverview(datasetId: string) {
    try {
      const response = await this.client.get(`/datasets/${datasetId}/overview?user_id=${this.config.userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error retrieving dataset overview for ${datasetId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a job to analyze data with natural language questions
   * @param params Parameters for creating a job
   * @returns Promise with the job result
   */
  async createJob(params: CreateJobParams) {
    try {
      // Include user_id in the request body
      const requestBody = {
        ...params,
        user_id: this.config.userId
      };

      const response = await this.client.post('/jobs', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error creating job:', error.message);
      throw error;
    }
  }

  /**
   * Create a new session
   * @param params Parameters for creating a session
   * @returns Promise with the session result
   */
  async createSession(params: CreateSessionParams) {
    try {
      // Include user_id in the request body if not provided
      const requestBody = {
        ...params,
        user_id: params.user_id || this.config.userId
      };

      const response = await this.client.post('/sessions', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error creating session:', error.message);
      throw error;
    }
  }
} 