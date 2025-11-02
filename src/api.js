// Configuration de l'API
// Use relative URL in production (nginx will proxy), or full URL in development
// Force relative URL by default - only use localhost for actual localhost
let API_BASE_URL = '/api'; // Default: use relative URL (production)

// Only use localhost in development (when running on actual localhost or local IPs)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  // Only use localhost if it's REALLY localhost or private IP range
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIP = hostname.startsWith('192.168.') || 
                      hostname.startsWith('10.') ||
                      (hostname.startsWith('172.') && 
                       parseInt(hostname.split('.')[1]) >= 16 && 
                       parseInt(hostname.split('.')[1]) <= 31);
  
  if (isLocalhost || (isPrivateIP && window.location.port === '5173')) {
    // Only in true development mode (localhost or private IP with dev port)
    API_BASE_URL = 'http://localhost:3001/api';
  }
  // Otherwise use /api (production mode)
}

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

// API des formations
export const formationsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/formations?${queryParams}`);
  },

  getPending: async () => {
    return apiRequest('/formations/pending');
  },

  create: async (formationData) => {
    const formData = new FormData();
    Object.keys(formationData).forEach(key => {
      if (formationData[key] !== undefined && formationData[key] !== null) {
        if (key === 'categories' && Array.isArray(formationData[key])) {
          formData.append(key, JSON.stringify(formationData[key]));
        } else {
          formData.append(key, formationData[key]);
        }
      }
    });
    
    const url = `${API_BASE_URL}/formations`;
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

  approve: async (id) => {
    return apiRequest(`/formations/${id}/approve`, {
      method: 'PUT',
    });
  },

  reject: async (id, rejectedReason = null) => {
    return apiRequest(`/formations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejected_reason: rejectedReason }),
    });
  },

  delete: async (id) => {
    return apiRequest(`/formations/${id}`, {
      method: 'DELETE',
    });
  },
};

// API des notifications
export const notificationsAPI = {
  getAll: async (unreadOnly = false) => {
    const params = unreadOnly ? { unread_only: 'true' } : {};
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/notifications?${queryParams}`);
  },

  getUnreadCount: async () => {
    return apiRequest('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
};

// Helper function to get the API base URL (for direct fetch calls)
export function getAPIBaseURL() {
  return API_BASE_URL;
}

// Helper function to build full API URLs
export function buildAPIURL(endpoint: string) {
  return `${API_BASE_URL}${endpoint}`;
}

// Helper function to build file URLs (for uploads, images, etc.)
export function buildFileURL(filePath: string) {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  if (API_BASE_URL === '/api') {
    // Production: use relative URL
    return `/${cleanPath}`;
  } else {
    // Development: use localhost
    return `http://localhost:3001/${cleanPath}`;
  }
}

// Export API_BASE_URL for use in other files
export { API_BASE_URL };

export default apiRequest;
