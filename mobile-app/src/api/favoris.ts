import { apiRequest } from './config';

export interface Favori {
  id: number;
  user_id: number;
  document_id?: number;
  document_type: 'financial_document' | 'formation' | 'bordereau';
  created_at: string;
}

export const favorisAPI = {
  getAll: async (): Promise<Favori[]> => {
    return apiRequest('/favoris');
  },

  add: async (documentId: number, documentType: string): Promise<Favori> => {
    return apiRequest('/favoris', {
      method: 'POST',
      body: { document_id: documentId, document_type: documentType },
    });
  },

  remove: async (favoriId: number): Promise<void> => {
    return apiRequest(`/favoris/${favoriId}`, {
      method: 'DELETE',
    });
  },
};




