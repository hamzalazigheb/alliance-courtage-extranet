import { apiRequest } from './config';

export interface Formation {
  id: number;
  user_id: number;
  nom_document: string;
  date_formation: string;
  heures: string;
  heuresDecimal?: number;
  categories: string[];
  delivre_par: string;
  year: number;
  statut: 'pending' | 'approved' | 'rejected';
  file_path?: string;
  fileUrl?: string;
  hasFileContent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFormationData {
  nom_document: string;
  date_formation: string;
  heures: string;
  categories: string[];
  delivre_par: string;
  year: number;
  file: any; // File object
}

export const formationsAPI = {
  getAll: async (year?: number, statut?: string): Promise<Formation[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (statut) params.append('statut', statut);
    const query = params.toString();
    return apiRequest(`/formations${query ? `?${query}` : ''}`);
  },

  create: async (data: CreateFormationData): Promise<Formation> => {
    const formData = new FormData();
    formData.append('nom_document', data.nom_document);
    formData.append('date_formation', data.date_formation);
    formData.append('heures', data.heures);
    formData.append('categories', JSON.stringify(data.categories));
    formData.append('delivre_par', data.delivre_par);
    formData.append('year', data.year.toString());
    if (data.file) {
      formData.append('file', {
        uri: data.file.uri,
        type: data.file.type || 'application/pdf',
        name: data.file.name || 'document.pdf',
      } as any);
    }

    return apiRequest('/formations', {
      method: 'POST',
      body: formData,
    });
  },

  download: async (formationId: number): Promise<string> => {
    // Retourner l'URL de téléchargement
    return `${API_BASE_URL}/formations/${formationId}/download`;
  },
};

// Import API_BASE_URL
import { API_BASE_URL } from './config';




