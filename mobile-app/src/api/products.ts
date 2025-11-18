import { apiRequest } from './config';

export interface Assurance {
  id: number;
  nom: string;
  logo?: string;
  produits: ProduitStructure[];
}

export interface ProduitStructure {
  id: number;
  assurance_id: number;
  titre: string;
  description?: string;
  montant_total: number;
  montant_reserve: number;
  montant_restant: number;
  date_debut?: string;
  date_fin?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  produit_id: number;
  montant: number;
  statut: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateReservationData {
  produit_id: number;
  montant: number;
}

export const productsAPI = {
  getAll: async (): Promise<Assurance[]> => {
    return apiRequest('/structured-products/assurances');
  },

  getMontants: async (): Promise<{ [key: number]: { montant_total: number; montant_restant: number } }> => {
    return apiRequest('/structured-products/assurances/montants');
  },

  createReservation: async (data: CreateReservationData): Promise<Reservation> => {
    return apiRequest('/structured-products/reservations', {
      method: 'POST',
      body: data,
    });
  },

  getMyReservations: async (): Promise<Reservation[]> => {
    return apiRequest('/structured-products/reservations/my');
  },
};




