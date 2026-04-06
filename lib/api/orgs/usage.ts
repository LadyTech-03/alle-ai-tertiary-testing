import api from "../axios";

export interface ModelInstance {
  id: number;
  name: string;
  type: string;
  uid: string;
  photo_url?: string;
}

export interface ModelUsage {
  ApiCalls: number;
  modelInstance: ModelInstance;
  precentage: string; 
}

export interface MetricWithPercentage {
  count: number;
  percentage: string;
}

export interface AveragePromptsMetric {
  average: string;
  percentage: string;
}

export interface UsageActivityResponse {
  action?: string;
  status?: boolean;
  date: string;
  new_joiners: MetricWithPercentage;
  total_queries: MetricWithPercentage;
  average_prompts_per_user: AveragePromptsMetric;
  active_users: MetricWithPercentage;
  model_usage: ModelUsage[];
  api_calls: Record<string, number>; // { "2025-11-12": 34, ... }
  last_update_today: string;
}

// ========== API METHODS ==========

export const orgUsageApi = {
  getUsageActivity: async (orgId: number): Promise<UsageActivityResponse> => {
    const response = await api.get(`/organisations/${orgId}/usage-activity`);
    return response.data;
  },

  getApiCalls: async (
    orgId: number,
    startDate: string,
    endDate: string
  ): Promise<any> => {
    const response = await api.get(`/organisations/${orgId}/api-calls`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
};
