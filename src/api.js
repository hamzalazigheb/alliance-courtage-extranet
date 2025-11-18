// Configuration de l'API
// Use relative URL in production (nginx will proxy), or full URL in development
// STRICT: Only use localhost if it's EXACTLY localhost or 127.0.0.1
let API_BASE_URL = '/api'; // Default: use relative URL (production)

// Only use localhost in development (VERY strict check)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // ONLY use localhost if:
  // 1. hostname is exactly 'localhost' or '127.0.0.1'
  // 2. AND we're on a development port (5173 for Vite, or no port specified)
  const isStrictLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
  const isDevPort = port === '5173' || port === '' || port === '0';
  
  if (isStrictLocalhost && isDevPort) {
    // Only in true development mode
    API_BASE_URL = 'http://localhost:3001/api';
  }
  // Otherwise ALWAYS use /api (production mode - no exceptions)
}

// Fonction utilitaire pour les requêtes
async function apiRequest(endpoint, options = {}) {
  // S'assurer que l'endpoint commence par /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Headers pour éviter le cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    // Désactiver le cache pour les requêtes
    cache: 'no-store',
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
    // Surcharger le cache si spécifié dans options
    cache: options.cache || defaultOptions.cache,
  };

  try {
    const response = await fetch(url, config);
    
    // Gérer les réponses 304 (Not Modified) - les traiter comme des succès
    if (response.status === 304) {
      // Pour une réponse 304, essayer de récupérer les données depuis le cache
      // ou faire une nouvelle requête sans cache
      const noCacheConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Cache-Control': 'no-cache',
          'If-None-Match': '',
          'If-Modified-Since': '',
        },
        cache: 'no-store',
      };
      const retryResponse = await fetch(url, noCacheConfig);
      
      if (!retryResponse.ok) {
        let errorData;
        try {
          errorData = await retryResponse.json();
        } catch (e) {
          errorData = { error: `Erreur HTTP ${retryResponse.status}: ${retryResponse.statusText}` };
        }
        throw new Error(errorData.error || 'Erreur de serveur');
      }
      
      const retryData = await retryResponse.json();
      return retryData;
    }
    
    // Vérifier si la réponse est OK avant de parser JSON
    let data;
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Réponse texte:', await response.text());
      throw new Error(`Erreur de format de réponse (${response.status}): ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Erreur HTTP ${response.status}: ${response.statusText}`;
      console.error('Erreur API:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: errorMessage,
        data: data
      });
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Améliorer les messages d'erreur
    const errorDetails = {
      name: error.name,
      message: error.message,
      url: url,
      stack: error.stack
    };
    
    console.error('API Error:', errorDetails);
    console.error('URL complète:', url);
    console.error('Config:', {
      method: config.method || 'GET',
      headers: config.headers,
      cache: config.cache
    });
    
    // Si c'est une erreur de réseau, essayer une fois de plus
    if (error.name === 'TypeError' && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      console.warn('Retry after network error...');
      try {
        const retryResponse = await fetch(url, {
          ...config,
          cache: 'no-store',
          headers: {
            ...config.headers,
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!retryResponse.ok) {
          let errorData;
          try {
            errorData = await retryResponse.json();
          } catch (e) {
            errorData = { error: `Erreur HTTP ${retryResponse.status}: ${retryResponse.statusText}` };
          }
          throw new Error(errorData.error || `Erreur HTTP ${retryResponse.status}`);
        }
        
        const retryData = await retryResponse.json();
        return retryData;
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        const finalError = new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet et réessayez.');
        finalError.originalError = retryError;
        throw finalError;
      }
    }
    
    // Améliorer le message d'erreur
    if (!error.message || error.message === '') {
      error.message = 'Erreur inconnue lors de la communication avec le serveur';
    }
    
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

  updateCategory: async (id, category) => {
    return apiRequest(`/archives/${id}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  getCategories: async () => {
    return apiRequest('/archives/categories/list');
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

  // Réservations
  createReservation: async (productId, montant, notes = null) => {
    return apiRequest(`/structured-products/${productId}/reservations`, {
      method: 'POST',
      body: JSON.stringify({ montant, notes }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  getProductReservations: async (productId) => {
    return apiRequest(`/structured-products/${productId}/reservations`);
  },

  getMyReservations: async () => {
    return apiRequest('/structured-products/reservations/my');
  },

  getAllReservations: async (status = null) => {
    const url = status 
      ? `/structured-products/reservations/all?status=${status}`
      : '/structured-products/reservations/all';
    return apiRequest(url);
  },

  approveReservation: async (reservationId) => {
    return apiRequest(`/structured-products/reservations/${reservationId}/approve`, {
      method: 'PUT',
    });
  },

  rejectReservation: async (reservationId, reason = null) => {
    return apiRequest(`/structured-products/reservations/${reservationId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  getAssurancesMontants: async () => {
    return apiRequest('/structured-products/assurances/montants');
  },
};

// API des assurances
export const assurancesAPI = {
  getAll: async (includeInactive = false) => {
    const params = includeInactive ? { include_inactive: 'true' } : {};
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/assurances?${queryParams}`);
  },

  getById: async (id) => {
    return apiRequest(`/assurances/${id}`);
  },

  create: async (assuranceData) => {
    return apiRequest('/assurances', {
      method: 'POST',
      body: JSON.stringify(assuranceData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, assuranceData) => {
    return apiRequest(`/assurances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assuranceData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/assurances/${id}`, {
      method: 'DELETE',
    });
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

  getAllAdmin: async (statut = null) => {
    const url = statut ? `/formations/all?statut=${statut}` : '/formations/all';
    return apiRequest(url);
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

  broadcast: async (type, title, message, link = null) => {
    return apiRequest('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ type, title, message, link }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  send: async (userId, type, title, message, link = null) => {
    return apiRequest('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ userId, type, title, message, link }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};

// Helper function to get the API base URL (for direct fetch calls)
export function getAPIBaseURL() {
  return API_BASE_URL;
}

// API des favoris
export const favorisAPI = {
  getAll: async (type = null) => {
    const params = type ? { type } : {};
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/favoris?${queryParams}`);
  },

  check: async (type, itemId) => {
    return apiRequest(`/favoris/check?type=${type}&item_id=${itemId}`);
  },

  add: async (itemType, itemId, title, description = '', url = '', metadata = null) => {
    return apiRequest('/favoris', {
      method: 'POST',
      body: JSON.stringify({
        item_type: itemType,
        item_id: itemId,
        title,
        description,
        url,
        metadata
      })
    });
  },

  remove: async (id) => {
    return apiRequest(`/favoris/${id}`, {
      method: 'DELETE'
    });
  },

  removeByItem: async (type, itemId) => {
    return apiRequest('/favoris/remove', {
      method: 'DELETE',
      body: JSON.stringify({
        type,
        item_id: itemId
      })
    });
  }
};

export const simulatorsAPI = {
  logUsage: async (simulatorType, parameters = null, resultSummary = null) => {
    return apiRequest('/simulators/usage', {
      method: 'POST',
      body: JSON.stringify({
        simulator_type: simulatorType,
        parameters,
        result_summary: resultSummary
      })
    });
  },

  getUsage: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.simulator_type) params.append('simulator_type', filters.simulator_type);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    return apiRequest(`/simulators/usage${queryString ? `?${queryString}` : ''}`);
  },

  getStats: async () => {
    return apiRequest('/simulators/usage/stats');
  }
};

// Helper function to build full API URLs
export function buildAPIURL(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Helper function to build file URLs (for uploads, images, etc.)
export function buildFileURL(filePath) {
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
