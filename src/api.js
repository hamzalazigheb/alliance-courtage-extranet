// Configuration de l'API
const API_BASE_URL = 'http://localhost:3001/api';

// Fonction utilitaire pour les requêtes
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Ajouter le token si disponible
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['x-auth-token'] = token;
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur de serveur');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API d'authentification
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },
};

// API des produits financiers
export const productsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/products?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },
};

// API des actualités
export const newsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/news?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/news/${id}`);
  },
};

// API des partenaires
export const partnersAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/partners?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/partners/${id}`);
  },

  create: async (partnerData) => {
    const formData = new FormData();
    Object.keys(partnerData).forEach(key => {
      if (partnerData[key] !== undefined && partnerData[key] !== null) {
        formData.append(key, partnerData[key]);
      }
    });
    
    const url = `${API_BASE_URL}/partners`;
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-auth-token': token || ''
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur de serveur');
    }
    return data;
  },

  update: async (id, partnerData) => {
    const formData = new FormData();
    Object.keys(partnerData).forEach(key => {
      if (partnerData[key] !== undefined && partnerData[key] !== null) {
        formData.append(key, partnerData[key]);
      }
    });
    
    const url = `${API_BASE_URL}/partners/${id}`;
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'x-auth-token': token || ''
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur de serveur');
    }
    return data;
  },

  delete: async (id) => {
    return apiRequest(`/partners/${id}`, {
      method: 'DELETE',
    });
  },

  getCategories: async () => {
    return apiRequest('/partners/categories/list');
  },
};

// API des archives
export const archivesAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/archives?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/archives/${id}`);
  },

  delete: async (id) => {
    return apiRequest(`/archives/${id}`, {
      method: 'DELETE',
    });
  },
};

// API des produits structurés
export const structuredProductsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/structured-products?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/structured-products/${id}`);
  },

  delete: async (id) => {
    return apiRequest(`/structured-products/${id}`, {
      method: 'DELETE',
    });
  },

  getAssurances: async () => {
    return apiRequest('/structured-products/assurances');
  },

  getCategories: async () => {
    return apiRequest('/structured-products/categories');
  },
};

// API des documents financiers
export const financialDocumentsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/financial-documents?${queryParams}`);
  },

  delete: async (id) => {
    return apiRequest(`/financial-documents/${id}`, {
      method: 'DELETE',
    });
  },
};

export default apiRequest;
