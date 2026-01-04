import React, { useState, useEffect } from 'react';
import { structuredProductsAPI } from './api';

interface Reservation {
  id: number;
  product_id: number;
  user_id: number;
  montant: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  nom: string;
  prenom: string;
  email: string;
  product_title: string;
  assurance: string;
  category: string;
}

const ProductReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, [filterStatus]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const status = filterStatus === 'all' ? null : filterStatus;
      const data = await structuredProductsAPI.getAllReservations(status);
      setReservations(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des réservations:', error);
      alert(error.message || 'Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette réservation ? Le montant sera soustrait de l\'enveloppe de l\'assurance.')) {
      return;
    }

    try {
      await structuredProductsAPI.approveReservation(reservationId);
      alert('Réservation approuvée avec succès ! Le montant a été soustrait de l\'enveloppe. L\'utilisateur sera notifié.');
      await loadReservations();
      // Recharger la page pour mettre à jour les montants d'enveloppe
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur lors de l\'approbation:', error);
      alert(error.message || 'Erreur lors de l\'approbation de la réservation');
    }
  };

  const handleReject = async (reservationId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette réservation ?')) {
      return;
    }

    try {
      await structuredProductsAPI.rejectReservation(reservationId, rejectReason || null);
      alert('Réservation rejetée avec succès ! L\'utilisateur sera notifié.');
      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedReservation(null);
      await loadReservations();
    } catch (error: any) {
      console.error('Erreur lors du rejet:', error);
      alert(error.message || 'Erreur lors du rejet de la réservation');
    }
  };

  const openRejectModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setRejectModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Parse assurance field to extract the name
  const parseAssuranceName = (assuranceField: string): string => {
    if (!assuranceField) return 'N/A';
    
    try {
      // Si c'est déjà un nom simple
      if (!assuranceField.startsWith('[') && !assuranceField.startsWith('{')) {
        return assuranceField;
      }
      
      // Si c'est un tableau JSON
      const parsed = JSON.parse(assuranceField);
      if (Array.isArray(parsed)) {
        // Retourner le premier nom ou tous les noms séparés par des virgules
        return parsed.map(item => typeof item === 'string' ? item : item.name).filter(Boolean).join(', ');
      }
      
      // Si c'est un objet JSON
      if (typeof parsed === 'object' && parsed.name) {
        return parsed.name;
      }
      
      return assuranceField;
    } catch (e) {
      // Si le parsing échoue, retourner tel quel
      return assuranceField;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    const labels = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredReservations = reservations;

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header - Compact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Produits Réservés</h2>
            <p className="text-gray-500 text-xs mt-1">Gérer les réservations de produits structurés</p>
          </div>
          <button
            onClick={loadReservations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Filtres - Compact */}
      <div className="bg-white rounded-lg shadow p-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approuvées
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejetées
          </button>
        </div>
      </div>

      {/* Liste des réservations - Full height with internal scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="text-center py-12 flex-1 flex items-center justify-center">
            <div>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Chargement des réservations...</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 flex-1 flex items-center justify-center">
            <p className="text-gray-600">Aucune réservation trouvée.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assurance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.prenom} {reservation.nom}
                        </div>
                        <div className="text-sm text-gray-500">{reservation.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{reservation.product_title}</div>
                      {reservation.notes && (
                        <div className="text-xs text-gray-500 mt-1">{reservation.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{parseAssuranceName(reservation.assurance)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(parseFloat(reservation.montant.toString()))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(reservation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {reservation.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            ✓ Approuver
                          </button>
                          <button
                            onClick={() => openRejectModal(reservation)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            ✗ Rejeter
                          </button>
                        </div>
                      )}
                      {reservation.status !== 'pending' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de rejet */}
      {rejectModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[95vh] min-h-0 min-w-0 overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejeter la réservation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Souhaitez-vous ajouter une raison pour le rejet de cette réservation ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet (optionnel)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Ex: Montant trop élevé, produit non disponible..."
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason('');
                  setSelectedReservation(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(selectedReservation.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReservationsPage;

