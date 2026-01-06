import { apiRequest } from '../api';

export interface GammeProduct {
  id: number;
  product_key: string;
  client_type: 'particulier' | 'professionnel' | 'entreprise';
  family: 'epargne' | 'retraite' | 'prevoyance' | 'sante' | 'cif';
  product_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GammeProductFile {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  display_order: number;
  created_at: string;
}

export const gammeProductsAPI = {
  // Récupérer tous les produits (avec filtres optionnels)
  async getAll(clientType?: string, family?: string): Promise<GammeProduct[]> {
    const params = new URLSearchParams();
    if (clientType) params.append('client_type', clientType);
    if (family) params.append('family', family);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/gamme-products${query}`, { method: 'GET' });
  },

  // Créer un nouveau produit
  async create(productData: {
    client_type: string;
    family: string;
    product_name: string;
    description?: string;
  }): Promise<{ message: string; product: GammeProduct }> {
    return apiRequest('/gamme-products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  // Mettre à jour un produit
  async update(id: number, productData: {
    product_name?: string;
    description?: string;
  }): Promise<{ message: string; product: GammeProduct }> {
    return apiRequest(`/gamme-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  // Supprimer un produit
  async delete(id: number): Promise<{ message: string }> {
    return apiRequest(`/gamme-products/${id}`, {
      method: 'DELETE'
    });
  },

  // Récupérer les fichiers d'un produit
  async getFiles(productId: number): Promise<GammeProductFile[]> {
    return apiRequest(`/gamme-products/${productId}/files`, { method: 'GET' });
  },

  // Ajouter des fichiers à un produit
  async uploadFiles(productId: number, files: File[]): Promise<{ message: string; files: GammeProductFile[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return apiRequest(`/gamme-products/${productId}/files`, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  // Télécharger un fichier
  getFileDownloadUrl(productId: number, fileId: number): string {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${baseURL}/gamme-products/${productId}/files/${fileId}/download`;
  },

  // Supprimer un fichier
  async deleteFile(productId: number, fileId: number): Promise<{ message: string }> {
    return apiRequest(`/gamme-products/${productId}/files/${fileId}`, {
      method: 'DELETE'
    });
  }
};

