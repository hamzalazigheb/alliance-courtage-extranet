import { apiRequest } from './config';

export interface SimulatorUsage {
  id: number;
  user_id: number;
  simulator_type: 'ir' | 'ifi' | 'succession' | 'placement';
  parameters?: any;
  result_summary?: string;
  created_at: string;
}

export const simulatorsAPI = {
  logUsage: async (
    simulatorType: string,
    parameters?: any,
    resultSummary?: string
  ): Promise<void> => {
    return apiRequest('/simulators/usage', {
      method: 'POST',
      body: {
        simulator_type: simulatorType,
        parameters,
        result_summary: resultSummary,
      },
    });
  },
};




