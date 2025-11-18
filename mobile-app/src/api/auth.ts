import { apiRequest } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'user';
  denomination_sociale?: string;
  telephone?: string;
  code_postal?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest('/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  },
};




