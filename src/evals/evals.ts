//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const mcp_powerdrill_list_datasetsEval: EvalFunction = {
    name: 'MCP Powerdrill List Datasets Evaluation',
    description: 'Evaluates the functionality of listing datasets with optional parameters',
    run: async () => {
        const result = await grade(openai("gpt-4"), "List up to 2 datasets with the term 'sales' in their name. Use page 1 and a page size of 10 and return the result in JSON.");
        return JSON.parse(result);
    }
};

const mcp_powerdrill_get_dataset_overview: EvalFunction = {
    name: 'mcp_powerdrill_get_dataset_overview',
    description: 'Evaluates the dataset overview retrieval functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Can you retrieve the overview for dataset with ID: 42?");
        return JSON.parse(result);
    }
};

const mcp_powerdrill_create_jobEval: EvalFunction = {
    name: 'mcp_powerdrill_create_job Evaluation',
    description: 'Evaluates job creation for data analysis using the Powerdrill client',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Create a job to analyze dataset '12345' about user activity trends. Include optional datasource_ids like 'ds1' and 'ds2', and use session_id 'test-session'. Please provide the job details.");
        return JSON.parse(result);
    }
};

const mcp_powerdrill_create_session: EvalFunction = {
    name: 'mcp_powerdrill_create_session',
    description: 'Evaluates the creation of a session with the mcp_powerdrill_create_session tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please create a data analytics session named 'AnalyticsSessionTest' with the output language set to 'EN' and a max contextual job history of 5.");
        return JSON.parse(result);
    }
};

const mcp_powerdrill_list_data_sourcesEval: EvalFunction = {
    name: 'mcp_powerdrill_list_data_sources Evaluation',
    description: 'Evaluates the functionality of listing data sources via mcp_powerdrill_list_data_sources tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please list the data sources for dataset 123 on page 2 with a page size of 5 and only include synched data sources.");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [mcp_powerdrill_list_datasetsEval, mcp_powerdrill_get_dataset_overview, mcp_powerdrill_create_jobEval, mcp_powerdrill_create_session, mcp_powerdrill_list_data_sourcesEval]
};
  
export default config;
  
export const evals = [mcp_powerdrill_list_datasetsEval, mcp_powerdrill_get_dataset_overview, mcp_powerdrill_create_jobEval, mcp_powerdrill_create_session, mcp_powerdrill_list_data_sourcesEval];