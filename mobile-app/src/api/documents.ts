import { apiRequest } from './config';

export interface FinancialDocument {
  id: number;
  user_id: number;
  category: string;
  subcategory?: string;
  title: string;
  year?: number;
  file_path: string;
  fileUrl?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  category: string;
  subcategory?: string;
  title: string;
  year?: number;
  file: any;
}

export const documentsAPI = {
  getAll: async (category?: string, subcategory?: string, year?: number): Promise<FinancialDocument[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (subcategory) params.append('subcategory', subcategory);
    if (year) params.append('year', year.toString());
    const query = params.toString();
    return apiRequest(`/financial-documents${query ? `?${query}` : ''}`);
  },

  create: async (data: CreateDocumentData): Promise<FinancialDocument> => {
    const formData = new FormData();
    formData.append('category', data.category);
    if (data.subcategory) formData.append('subcategory', data.subcategory);
    formData.append('title', data.title);
    if (data.year) formData.append('year', data.year.toString());
    if (data.file) {
      formData.append('file', {
        uri: data.file.uri,
        type: data.file.type || 'application/pdf',
        name: data.file.name || 'document.pdf',
      } as any);
    }

    return apiRequest('/financial-documents', {
      method: 'POST',
      body: formData,
    });
  },

  download: async (documentId: number): Promise<string> => {
    return `${API_BASE_URL}/financial-documents/${documentId}/download`;
  },
};

// Import API_BASE_URL
import { API_BASE_URL } from './config';




