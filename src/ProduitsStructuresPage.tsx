import React, { useState, useEffect } from 'react';
import { structuredProductsAPI, assurancesAPI, buildFileURL, buildAPIURL } from './api';

interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string;
  category: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface Assurance {
  id: number;
  name: string;
  montant_enveloppe: number;
  color: string;
  icon: string;
  is_active: boolean;
}

interface AssuranceMontant {
  assurance: string;
  montant_enveloppe: number;
  montant_reserve: number;
  montant_restant: number;
}

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
  headerImage: string;
  introText: string;
}

const ProduitsStructuresPageComponent: React.FC = () => {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [assurancesMontants, setAssurancesMontants] = useState<AssuranceMontant[]>([]);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // État pour le contenu CMS
  const [pageContent, setPageContent] = useState<PageContent>({
    title: 'Produits Structurés',
    subtitle: 'Consultez tous les produits structurés par assurance',
    description: 'Découvrez notre gamme complète de produits structurés adaptés à vos besoins d\'investissement et de protection.',
    headerImage: '',
    introText: ''
  });
  const [contentLoading, setContentLoading] = useState<boolean>(true);
  
  // État pour le modal de réservation
  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [reservationMontant, setReservationMontant] = useState<string>('');
  const [reservationNotes, setReservationNotes] = useState<string>('');
  const [reservationLoading, setReservationLoading] = useState<boolean>(false);

  useEffect(() => {
    loadContent();
    loadProducts();
    loadAssurances();
    loadAssurancesMontants();
  }, [selectedAssurance]);

  const loadContent = async () => {
    try {
      setContentLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/produits-structures'), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          const parsedContent = JSON.parse(data.content);
          // Si c'est un double JSON stringifié (legacy), on parse une seconde fois
          if (typeof parsedContent === 'string') {
            setPageContent(JSON.parse(parsedContent));
          } else {
            setPageContent(parsedContent);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu CMS:', error);
      // On garde les valeurs par défaut en cas d'erreur
    } finally {
      setContentLoading(false);
    }
  };

  const loadAssurancesMontants = async () => {
    try {
      const response = await structuredProductsAPI.getAssurancesMontants();
      setAssurancesMontants(response);
    } catch (error) {
      console.error('Erreur lors du chargement des montants:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedAssurance) params.assurance = selectedAssurance;

      const response = await structuredProductsAPI.getAll(params);
      setProducts(response);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssurances = async () => {
    try {
      const response = await assurancesAPI.getAll();
      setAssurances(response);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
      // Fallback : essayer l'ancienne API
      try {
        const fallbackResponse = await structuredProductsAPI.getAssurances();
        // Si c'est un tableau de strings (ancien format)
        if (typeof fallbackResponse[0] === 'string') {
          setAssurances(fallbackResponse.map((name: string) => ({ 
            id: 0, 
            name, 
            montant_enveloppe: 0, 
            color: 'gray', 
            icon: '📄', 
            is_active: true 
          })));
        } else {
          setAssurances(fallbackResponse);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback assurances:', fallbackError);
      }
    }
  };

  const getAssuranceInfo = (assuranceName: string) => {
    const assurance = assurances.find(a => a.name === assuranceName);
    const montantData = assurancesMontants.find(m => m.assurance === assuranceName);
    
    if (assurance) {
      const colorMap: { [key: string]: string } = {
        'blue': 'from-blue-500 to-blue-600',
        'orange': 'from-orange-500 to-orange-600',
        'green': 'from-green-500 to-green-600',
        'purple': 'from-purple-500 to-purple-600',
        'red': 'from-red-500 to-red-600',
        'yellow': 'from-yellow-500 to-yellow-600',
        'gray': 'from-gray-500 to-gray-600'
      };
      return {
        color: colorMap[assurance.color] || 'from-gray-500 to-gray-600',
        icon: assurance.icon || '📄',
        montant: assurance.montant_enveloppe || 0,
        montantRestant: montantData?.montant_restant || assurance.montant_enveloppe || 0,
        montantReserve: montantData?.montant_reserve || 0
      };
    }
    // Fallback pour les anciennes données
    const nameLower = assuranceName.toLowerCase();
    if (nameLower.includes('swisslife')) return { color: 'from-blue-500 to-blue-600', icon: '🏢', montant: 0, montantRestant: 0, montantReserve: 0 };
    if (nameLower.includes('cardif')) return { color: 'from-orange-500 to-orange-600', icon: '🛡️', montant: 0, montantRestant: 0, montantReserve: 0 };
    if (nameLower.includes('abeille')) return { color: 'from-green-500 to-green-600', icon: '🐝', montant: 0, montantRestant: 0, montantReserve: 0 };
    if (nameLower.includes('axa')) return { color: 'from-purple-500 to-purple-600', icon: '🔷', montant: 0, montantRestant: 0, montantReserve: 0 };
    if (nameLower.includes('allianz')) return { color: 'from-red-500 to-red-600', icon: '⚡', montant: 0, montantRestant: 0, montantReserve: 0 };
    if (nameLower.includes('generali')) return { color: 'from-yellow-500 to-yellow-600', icon: '🌟', montant: 0, montantRestant: 0, montantReserve: 0 };
    return { color: 'from-gray-500 to-gray-600', icon: '📄', montant: 0, montantRestant: 0, montantReserve: 0 };
  };

  const groupedProducts = products.reduce((acc, product) => {
    (acc[product.assurance] = acc[product.assurance] || []).push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  // Fonctions pour gérer le modal de réservation
  const openReservationModal = (product: StructuredProduct) => {
    setSelectedProduct(product);
    setReservationMontant('');
    setReservationNotes('');
    setIsReservationModalOpen(true);
  };

  const closeReservationModal = () => {
    setIsReservationModalOpen(false);
    setSelectedProduct(null);
    setReservationMontant('');
    setReservationNotes('');
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;
    
    const montant = parseFloat(reservationMontant);
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    try {
      setReservationLoading(true);
      await structuredProductsAPI.createReservation(
        selectedProduct.id,
        montant,
        reservationNotes || null
      );
      
      alert('Réservation créée avec succès ! L\'administrateur sera notifié.');
      // Recharger les montants après réservation
      await loadAssurancesMontants();
      closeReservationModal();
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      alert(error.message || 'Erreur lors de la création de la réservation');
    } finally {
      setReservationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div 
            className={`p-6 sm:p-8 text-white ${pageContent.headerImage ? '' : 'bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]'}`}
            style={pageContent.headerImage ? {
              backgroundImage: `url(${pageContent.headerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            } : {}}
          >
            {pageContent.headerImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{pageContent.title || 'Produits Structurés'}</h1>
                  <p className="text-white/80">{pageContent.subtitle || 'Consultez tous les produits structurés par assurance'}</p>
                  {pageContent.description && (
                    <p className="text-white/90 mt-2 max-w-2xl">{pageContent.description}</p>
                  )}
                </div>
              </div>
              {pageContent.introText && (
                <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <p className="text-white italic">{pageContent.introText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 mb-8 border border-white/20">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#1D4ED8]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filtrer par Assurance
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedAssurance('')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedAssurance === ''
                ? 'bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes les Assurances ({products.length})
          </button>
          {assurances.filter(a => a.is_active).map(assurance => {
            const assuranceProducts = groupedProducts[assurance.name] || [];
            const assuranceInfo = getAssuranceInfo(assurance.name);
            const montantData = assurancesMontants.find(m => m.assurance === assurance.name);
            return (
              <button
                key={assurance.id}
                onClick={() => setSelectedAssurance(assurance.name)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                  selectedAssurance === assurance.name
                    ? 'bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={montantData ? `Enveloppe: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montantData.montant_enveloppe)} | Réservé: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montantData.montant_reserve)} | Restant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montantData.montant_restant)}` : ''}
              >
                <span className="mr-2">{assuranceInfo.icon}</span>
                {assurance.name} ({assuranceProducts.length})
                {montantData && montantData.montant_enveloppe > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    - {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montantData.montant_restant)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des Produits */}
      {loading ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D4ED8] mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des produits structurés...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center py-10">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">
              {selectedAssurance 
                ? `Aucun produit structuré trouvé pour ${selectedAssurance}`
                : 'Aucun produit structuré disponible pour le moment'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedProducts).map(([assuranceName, assuranceProducts]) => {
            const assuranceInfo = getAssuranceInfo(assuranceName);
            const assuranceData = assurances.find(a => a.name === assuranceName);
            const montantData = assurancesMontants.find(m => m.assurance === assuranceName);
            return (
            <div key={assuranceName} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
              {/* Header Assurance */}
              <div className={`bg-gradient-to-r ${assuranceInfo.color} p-4 sm:p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{assuranceInfo.icon}</span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">{assuranceName}</h2>
                      <p className="text-white/80 text-sm">{assuranceProducts.length} produit{assuranceProducts.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {montantData && montantData.montant_enveloppe > 0 && (
                    <div className="flex gap-3">
                      <div className="text-right bg-white/20 rounded-lg p-3">
                        <p className="text-xs text-white/80 mb-1">Montant Total</p>
                        <p className="text-sm font-semibold">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(montantData.montant_enveloppe)}
                        </p>
                      </div>
                      <div className="text-right bg-white/20 rounded-lg p-3">
                        <p className="text-xs text-white/80 mb-1">Réservé</p>
                        <p className="text-sm font-semibold">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(montantData.montant_reserve)}
                        </p>
                      </div>
                      <div className="text-right bg-white/30 rounded-lg p-3 border-2 border-white/40">
                        <p className="text-xs text-white/90 mb-1 font-semibold">Montant Restant</p>
                        <p className="text-lg font-bold">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(montantData.montant_restant)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des Produits */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {assuranceProducts.map(product => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                      {/* Header Produit */}
                      <div className="flex items-start mb-4">
                        <span className="text-2xl mr-3 flex-shrink-0">{getFileIcon(product.file_type)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight mb-1">{product.title}</h3>
                          <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(product.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <a
                            href={buildFileURL(product.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Télécharger
                          </a>
                          <button
                            onClick={() => {
                              window.open(buildFileURL(product.file_path), '_blank');
                            }}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={() => openReservationModal(product)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Réserver un montant
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal de Réservation */}
      {isReservationModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Réserver un montant</h2>
                <button
                  onClick={closeReservationModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Produit sélectionné */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Produit :</p>
                <p className="font-semibold text-gray-800">{selectedProduct.title}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedProduct.assurance}</p>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <div>
                  <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-2">
                    Montant à réserver (€) *
                  </label>
                  <input
                    type="number"
                    id="montant"
                    min="0"
                    step="0.01"
                    value={reservationMontant}
                    onChange={(e) => setReservationMontant(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 5000.00"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ajoutez des informations complémentaires..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeReservationModal}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    disabled={reservationLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50"
                    disabled={reservationLoading}
                  >
                    {reservationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        En cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Confirmer la réservation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProduitsStructuresPageComponent;
