import { apiRequest } from './config';

export interface CMSContent {
  page: string;
  content: string;
}

export const cmsAPI = {
  getGammeProduits: async (): Promise<CMSContent> => {
    return apiRequest('/cms/gamme-produits');
  },

  getPartenaires: async (): Promise<CMSContent> => {
    return apiRequest('/cms/partenaires');
  },

  getRencontres: async (): Promise<CMSContent> => {
    return apiRequest('/cms/rencontres');
  },

  getReglementaire: async (): Promise<CMSContent> => {
    return apiRequest('/cms/reglementaire');
  },
};




