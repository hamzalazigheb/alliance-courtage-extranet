import React, { useState, useEffect } from "react";
import { structuredProductsAPI, buildFileURL, assurancesAPI } from "../api";
import FavoriteButton from "../components/FavoriteButton";

interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string;
  category: string;
  file_path?: string;
  fileUrl?: string;
  created_at: string;
  uploaded_by_nom?: string;
  uploaded_by_prenom?: string;
}

export default function ProduitsStructuresPage() {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [assurances, setAssurances] = useState<any[]>([]);
  const [assurancesMontants, setAssurancesMontants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationAmount, setReservationAmount] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationDate, setReservationDate] = useState('');

  useEffect(() => {
    loadProducts();
    loadAssurances();
    loadAssurancesMontants();
  }, [selectedAssurance, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedAssurance) params.assurance = selectedAssurance;
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const data = await structuredProductsAPI.getAll(params);
      setProducts(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssurances = async () => {
    try {
      const response = await assurancesAPI.getAll(true);
      setAssurances(response);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
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

  const handleReservation = async () => {
    if (!selectedProduct || !reservationAmount) {
      alert('Veuillez remplir le montant à investir');
      return;
    }

    try {
      await structuredProductsAPI.createReservation(
        selectedProduct.id,
        parseFloat(reservationAmount),
        reservationNotes || null
      );
      alert('Réservation créée avec succès !');
      setShowReservationModal(false);
      setReservationAmount('');
      setReservationNotes('');
      setReservationDate('');
      setSelectedProduct(null);
      // Recharger les montants pour mettre à jour l'affichage
      await loadAssurancesMontants();
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      alert(error.message || 'Erreur lors de la création de la réservation');
    }
  };

  const getAssuranceColor = (assuranceName: string) => {
    // Utiliser le dégradé bleu de la charte graphique pour toutes les assurances
    return 'bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]';
  };

  const getAssuranceMontant = (assuranceName: string) => {
    const montant = assurancesMontants.find(m => m.assurance === assuranceName);
    return montant || {
      montant_enveloppe: 0,
      montant_reserve: 0,
      montant_restant: 0
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('doc')) return '📘';
    if (fileType.includes('excel') || fileType.includes('xls')) return '📗';
    if (fileType.includes('powerpoint') || fileType.includes('ppt')) return '📙';
    return '📄';
  };

  // Grouper les produits par assurance
  const productsByAssurance = products.reduce((acc, product) => {
    const assurance = product.assurance || 'Autres';
    if (!acc[assurance]) {
      acc[assurance] = [];
    }
    acc[assurance].push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

  const availableCategories = [
    'Épargne',
    'Retraite',
    'Prévoyance',
    'Santé',
    'CIF',
    'Investissements'
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">PRODUITS STRUCTURÉS</h1>
        <p className="text-gray-600 text-lg">
          Découvrez notre gamme de produits structurés adaptés à vos besoins d'investissement
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtres et Recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assurance</label>
            <select
              value={selectedAssurance}
              onChange={(e) => setSelectedAssurance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les assurances</option>
              {assurances.filter(a => a.is_active).map(assurance => (
                <option key={assurance.id} value={assurance.name}>
                  {assurance.icon} {assurance.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadProducts}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Produits par Assurance */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : Object.keys(productsByAssurance).length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="text-8xl mb-4">📊</div>
            <p className="text-gray-600 text-xl">Aucun produit structuré trouvé</p>
            <p className="text-gray-500 mt-2">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          Object.entries(productsByAssurance).map(([assurance, assuranceProducts]) => (
            <div key={assurance} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
              {/* En-tête Assurance */}
              <div className={`${getAssuranceColor(assurance)} text-white p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold">{assurance.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{assurance}</h2>
                      <p className="text-white/80">{assuranceProducts.length} produit{assuranceProducts.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const montant = getAssuranceMontant(assurance);
                      return (
                        <div className="space-y-1">
                          <div className="text-sm text-white/90">
                            <span className="font-semibold">Enveloppe:</span> {formatCurrency(montant.montant_enveloppe)}
                          </div>
                          <div className="text-sm text-white/80">
                            <span className="font-semibold">Réservé:</span> {formatCurrency(montant.montant_reserve)}
                          </div>
                          <div className="text-sm text-white font-bold bg-white/20 px-3 py-1 rounded-lg">
                            <span>Restant:</span> {formatCurrency(montant.montant_restant)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Liste des Produits */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assuranceProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="text-2xl flex-shrink-0">{getFileIcon(product.file_path)}</div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">{product.title}</h3>
                            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mt-1">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <FavoriteButton productId={product.id} type="structured-product" />
                      </div>
                      
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{product.description}</p>
                      )}
                      
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        {product.uploaded_by_prenom && product.uploaded_by_nom && (
                          <div className="flex justify-between">
                            <span>👤 Uploadé par:</span>
                            <span>{product.uploaded_by_prenom} {product.uploaded_by_nom}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>🕒 Date:</span>
                          <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {product.fileUrl && (
                          <a
                            href={product.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Télécharger</span>
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowReservationModal(true);
                          }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm py-2 px-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Réserver</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Réservation */}
      {showReservationModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-3xl">📄</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedProduct.assurance || 'Produit'}</h2>
                <p className="text-sm text-gray-600">{selectedProduct.title}</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Formulaire de Réservation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant à investir *</label>
                  <input 
                    type="number" 
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    placeholder="Montant en €" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de souscription souhaitée</label>
                  <input 
                    type="date" 
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
                  <textarea 
                    rows={3} 
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    placeholder="Commentaires additionnels..."
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex space-x-4">
                <button 
                  onClick={handleReservation}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-all font-medium"
                >
                  Confirmer la réservation
                </button>
                <button 
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedProduct(null);
                    setReservationAmount('');
                    setReservationNotes('');
                    setReservationDate('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
