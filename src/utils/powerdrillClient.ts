import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface PowerdrillConfig {
  userId: string;
  projectApiKey: string;
  apiUrl: string;
}

// Dataset creation parameters interface
export interface CreateDatasetParams {
  name: string;
  description?: string;
  user_id?: string;
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
   * @param options Optional parameters like timeout
   * @returns Promise with the list of datasets
   */
  async listDatasets(options: { timeout?: number } = {}) {
    const timeout = options.timeout || 30000; // Default 30 second timeout

    try {
      const response = await this.client.get(`/datasets?user_id=${this.config.userId}`, {
        timeout: timeout,
        validateStatus: (status) => status >= 200 && status < 500 // Don't throw on 4xx errors
      });

      // Handle HTTP errors manually
      if (response.status >= 400) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText || 'Unknown error'}`);
      }

      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid API response: missing data');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error(`PowerdrillClient: Request timed out after ${timeout}ms`);
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error(`PowerdrillClient: HTTP error ${error.response.status}`, error.response.data);
        throw new Error(`API error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('PowerdrillClient: No response received', error.request);
        throw new Error('No response received from API');
      }

      console.error('PowerdrillClient: Error listing datasets:', error.message);
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

  /**
   * List data sources in a dataset
   * @param datasetId The ID of the dataset to list data sources from
   * @param options Optional parameters like page number, page size, status and timeout
   * @returns Promise with the list of data sources
   */
  async listDataSources(datasetId: string, options: { 
    pageNumber?: number;
    pageSize?: number;
    status?: string | string[];
    timeout?: number;
  } = {}) {
    const timeout = options.timeout || 30000; // Default 30 second timeout

    try {
      // Build query parameters
      let queryParams = `user_id=${this.config.userId}`;

      if (options.pageNumber) {
        queryParams += `&page_number=${options.pageNumber}`;
      }

      if (options.pageSize) {
        queryParams += `&page_size=${options.pageSize}`;
      }

      if (options.status) {
        // Handle array of statuses or single status
        const statusValue = Array.isArray(options.status) ? options.status.join(',') : options.status;
        queryParams += `&status=${statusValue}`;
      }

      const response = await this.client.get(`/datasets/${datasetId}/datasources?${queryParams}`, {
        timeout: timeout,
        validateStatus: (status) => status >= 200 && status < 500 // Don't throw on 4xx errors
      });

      // Handle HTTP errors manually
      if (response.status >= 400) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText || 'Unknown error'}`);
      }

      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid API response: missing data');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error(`PowerdrillClient: Request timed out after ${timeout}ms`);
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error(`PowerdrillClient: HTTP error ${error.response.status}`, error.response.data);
        throw new Error(`API error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('PowerdrillClient: No response received', error.request);
        throw new Error('No response received from API');
      }

      console.error('PowerdrillClient: Error listing data sources:', error.message);
      throw error;
    }
  }

  /**
   * List sessions
   * @param options Optional parameters like page number, page size, search keyword and timeout
   * @returns Promise with the list of sessions
   */
  async listSessions(options: { 
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    timeout?: number;
  } = {}) {
    const timeout = options.timeout || 30000; // Default 30 second timeout

    try {
      // Build query parameters
      let queryParams = `user_id=${this.config.userId}`;

      if (options.pageNumber) {
        queryParams += `&page_number=${options.pageNumber}`;
      }

      if (options.pageSize) {
        queryParams += `&page_size=${options.pageSize}`;
      }

      if (options.search) {
        queryParams += `&search=${encodeURIComponent(options.search)}`;
      }

      const response = await this.client.get(`/sessions?${queryParams}`, {
        timeout: timeout,
        validateStatus: (status) => status >= 200 && status < 500 // Don't throw on 4xx errors
      });

      // Handle HTTP errors manually
      if (response.status >= 400) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText || 'Unknown error'}`);
      }

      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid API response: missing data');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error(`PowerdrillClient: Request timed out after ${timeout}ms`);
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error(`PowerdrillClient: HTTP error ${error.response.status}`, error.response.data);
        throw new Error(`API error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('PowerdrillClient: No response received', error.request);
        throw new Error('No response received from API');
      }

      console.error('PowerdrillClient: Error listing sessions:', error.message);
      throw error;
    }
  }

  /**
   * Initiate a multipart upload for a local file
   * @param options Parameters for initiating multipart upload
   * @returns Promise with multipart upload information
   */
  async initiateMultipartUpload(options: { 
    file_name: string;
    file_size: number;
  }) {
    try {
      const requestBody = {
        ...options,
        user_id: this.config.userId
      };

      const response = await this.client.post('/file/init-multipart-upload', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error initiating multipart upload:', error.message);
      throw error;
    }
  }

  /**
   * Complete a multipart upload after all parts are uploaded
   * @param options Parameters for completing multipart upload
   * @returns Promise with the completed file information
   */
  async completeMultipartUpload(options: {
    file_object_key: string;
    upload_id: string;
    part_etags: Array<{number: number, etag: string}>;
  }) {
    try {
      const requestBody = {
        ...options,
        user_id: this.config.userId
      };

      const response = await this.client.post('/file/complete-multipart-upload', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error completing multipart upload:', error.message);
      throw error;
    }
  }

  /**
   * Create a data source from a file
   * @param datasetId The ID of the dataset to create the data source in
   * @param options Parameters for creating a data source
   * @returns Promise with the created data source information
   */
  async createDataSource(datasetId: string, options: {
    name: string;
    type: string;
    file_object_key: string;
  }) {
    try {
      const requestBody = {
        ...options,
        user_id: this.config.userId
      };

      const response = await this.client.post(`/datasets/${datasetId}/datasources`, requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error creating data source:', error.message);
      throw error;
    }
  }

  /**
   * Get data source details
   * @param datasetId The ID of the dataset containing the data source
   * @param dataSourceId The ID of the data source to retrieve
   * @returns Promise with the data source details
   */
  async getDataSource(datasetId: string, dataSourceId: string) {
    try {
      const response = await this.client.get(`/datasets/${datasetId}/datasources/${dataSourceId}?user_id=${this.config.userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error retrieving data source details for ${dataSourceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new dataset
   * @param params Parameters for creating a dataset
   * @returns Promise with the dataset creation result
   */
  async createDataset(params: CreateDatasetParams) {
    try {
      // Include user_id in the request body if not provided
      const requestBody = {
        ...params,
        user_id: params.user_id || this.config.userId
      };

      const response = await this.client.post('/datasets', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error creating dataset:', error.message);
      throw error;
    }
  }
} 