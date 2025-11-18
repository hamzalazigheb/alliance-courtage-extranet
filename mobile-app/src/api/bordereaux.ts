import { apiRequest } from './config';

export interface Bordereau {
  id: number;
  user_id: number;
  titre: string;
  period_month?: number;
  period_year?: number;
  file_path: string;
  fileUrl?: string;
  created_at: string;
  updated_at: string;
}

export const bordereauxAPI = {
  getAll: async (): Promise<Bordereau[]> => {
    return apiRequest('/bordereaux');
  },

  download: async (bordereauId: number): Promise<string> => {
    return `${API_BASE_URL}/bordereaux/${bordereauId}/download`;
  },
};

// Import API_BASE_URL
import { API_BASE_URL } from './config';




