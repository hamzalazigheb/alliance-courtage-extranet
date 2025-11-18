// Import AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
// L'URL de base peut être définie via une variable d'environnement
// Par défaut, utiliser localhost en développement
const getApiBaseUrl = (): string => {
  // En production, utiliser l'URL du serveur
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  
  if (!isDev) {
    // TODO: Remplacer par l'URL de production
    return 'https://votre-domaine.com/api';
  }
  
  // En développement :
  // Trouver l'IP de votre PC Windows : ipconfig (chercher IPv4 Address)
  // Exemple : 192.168.1.100
  // ⚠️ REMPLACER PAR L'IP DE VOTRE PC
  const PC_IP = '192.168.1.XXX'; // ⚠️ REMPLACER PAR VOTRE IP
  
  // Pour appareil physique, utiliser l'IP de votre PC
  // Pour simulateur/émulateur, utiliser localhost
  return `http://${PC_IP}:3001/api`;
  
  // Si vous testez sur simulateur/émulateur, décommentez :
  // return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Fonction utilitaire pour les requêtes API
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

export const apiRequest = async (
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getStoredToken();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['x-auth-token'] = token;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body) {
    if (options.body instanceof FormData) {
      // Pour FormData, ne pas définir Content-Type (le navigateur le fera)
      delete config.headers!['Content-Type'];
      config.body = options.body;
    } else {
      config.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    return data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Fonction pour obtenir le token stocké
const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

