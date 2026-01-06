import apiRequest, { buildAPIURL } from '../api';

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

  // Créer plusieurs produits avec fichiers en une seule requête (OPTIMISÉ)
  async createWithFiles(data: {
    client_types: string[];
    families: string[];
    product_name: string;
    description?: string;
    files: File[];
  }): Promise<{ message: string; products: any[]; files_uploaded: number }> {
    const formData = new FormData();
    
    // Ajouter les fichiers
    data.files.forEach(file => {
      formData.append('files', file);
    });
    
    // Ajouter les données du produit
    formData.append('client_types', JSON.stringify(data.client_types));
    formData.append('families', JSON.stringify(data.families));
    formData.append('product_name', data.product_name);
    if (data.description) {
      formData.append('description', data.description);
    }

    const token = localStorage.getItem('token');
    
    const response = await fetch(buildAPIURL('/gamme-products/create-with-files'), {
      method: 'POST',
      headers: {
        'x-auth-token': token || ''
      },
      body: formData
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la création des produits');
    }
    return result;
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
    try {
      return await apiRequest(`/gamme-products/${id}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      // Si le produit n'existe pas (404), on retourne un succès silencieux
      if (error.status === 404 || (error.message && error.message.includes('non trouvé'))) {
        console.log(`✓ Produit ${id} déjà supprimé ou inexistant`);
        return { message: 'Produit déjà supprimé ou inexistant' };
      }
      // Pour les autres erreurs, on les re-lance
      throw error;
    }
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

    const token = localStorage.getItem('token');
    
    const response = await fetch(buildAPIURL(`/gamme-products/${productId}/files`), {
      method: 'POST',
      headers: {
        'x-auth-token': token || ''
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'upload des fichiers');
    }
    return data;
  },

  // Télécharger un fichier
  getFileDownloadUrl(productId: number, fileId: number): string {
    return buildAPIURL(`/gamme-products/${productId}/files/${fileId}/download`);
  },

  // Supprimer un fichier
  async deleteFile(productId: number, fileId: number, deleteFromAllFamilies: boolean = false): Promise<{ message: string }> {
    const queryParam = deleteFromAllFamilies ? '?deleteFromAllFamilies=true' : '';
    return apiRequest(`/gamme-products/${productId}/files/${fileId}${queryParam}`, {
      method: 'DELETE'
    });
  }
};

