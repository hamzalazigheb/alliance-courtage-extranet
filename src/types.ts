// Types partagés pour l'application

export interface AuthUserRecord {
  id: number | string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user' | string;
}

export interface LoginResponse {
  token: string;
  user: AuthUserRecord;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  nom?: string;
  prenom?: string;
}

export interface BordereauFile {
  id: string;
  fileName: string;
  uploadDate: string;
  month: string;
  year: string;
  userId: string;
  uploadedBy: string;
}

export interface Partner {
  id: number;
  nom: string;
  description?: string;
  website?: string;
  site?: string;
  logoUrl?: string;
  logo_url?: string;
  logo_content?: string;
  category?: string;
  is_active?: boolean;
  documents?: Array<{
    nom: string;
    type: string;
    date: string;
  }>;
}

