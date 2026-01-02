import React, { useState, useEffect } from "react";
import { structuredProductsAPI, buildFileURL, assurancesAPI, buildAPIURL } from "../api";
import FavoriteButton from "../components/FavoriteButton";

interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string;
  montant_enveloppe?: number; // Enveloppe spécifique à ce produit
  category: string;
  file_path?: string;
  fileUrl?: string;
  created_at: string;
  uploaded_by_nom?: string;
  uploaded_by_prenom?: string;
}

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
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
  
  // Contenu CMS
  const [pageContent, setPageContent] = useState<PageContent>({
    title: 'Produits Structurés',
    subtitle: '',
    description: 'Découvrez notre gamme de produits structurés adaptés à vos besoins d\'investissement'
  });

  useEffect(() => {
    loadProducts();
    loadAssurances();
    loadAssurancesMontants();
    loadCMSContent();
  }, [selectedAssurance, selectedCategory, searchTerm]);

  // Charger le contenu CMS
  const loadCMSContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/produits-structures'), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          try {
            let parsedContent = JSON.parse(data.content);
            // Si c'est un double JSON stringifié (legacy), on parse une seconde fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            setPageContent({
              title: parsedContent.title || 'Produits Structurés',
              subtitle: parsedContent.subtitle || '',
              description: parsedContent.description || 'Découvrez notre gamme de produits structurés adaptés à vos besoins d\'investissement'
            });
          } catch (e) {
            console.error('Erreur parsing CMS content:', e);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement contenu CMS:', error);
    }
  };

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
      await loadAssurancesMontants();
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      alert(error.message || 'Erreur lors de la création de la réservation');
    }
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
    // Gérer les cas NaN, null, undefined
    const safeAmount = isNaN(amount) || amount == null ? 0 : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount);
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
      {/* Page Header - Contenu géré depuis le CMS */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{pageContent.title}</h1>
        {pageContent.subtitle && (
          <h2 className="text-xl text-gray-700 mb-2">{pageContent.subtitle}</h2>
        )}
        <p className="text-gray-600 text-lg">
          {pageContent.description}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assurance</label>
            <select
              value={selectedAssurance}
              onChange={(e) => setSelectedAssurance(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les assurances</option>
              {assurances.filter(a => a.is_active).map(assurance => (
                <option key={assurance.id} value={assurance.name}>
                  {assurance.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Products by Assurance */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : Object.keys(productsByAssurance).length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">Aucun produit structuré trouvé</p>
          </div>
        ) : (
          Object.entries(productsByAssurance).map(([assurance, assuranceProducts]) => {
            const montant = getAssuranceMontant(assurance);
            const progressPercent = montant.montant_enveloppe > 0 
              ? (montant.montant_reserve / montant.montant_enveloppe) * 100 
              : 0;
            
            return (
              <div key={assurance} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Assurance Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Assurance Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold">{assurance.charAt(0)}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{assurance}</h2>
                        <p className="text-blue-200">{assuranceProducts.length} produit{assuranceProducts.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    {/* Financial Stats */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                        <p className="text-xs text-blue-200 font-medium">Enveloppe globale assureur</p>
                        <p className="text-lg font-bold">{formatCurrency(montant.montant_enveloppe)}</p>
                        <p className="text-xs text-blue-300 mt-1">(Total disponible pour tous les produits)</p>
                      </div>
                      {/* Calculer la somme des enveloppes des produits */}
                      <div className="bg-purple-500/20 rounded-lg px-4 py-2 border border-purple-300/30">
                        <p className="text-xs text-purple-200 font-medium">Enveloppes produits</p>
                        <p className="text-lg font-bold text-purple-300">
                          {formatCurrency(assuranceProducts.reduce((sum, p) => {
                            // Gérer tous les cas : null, undefined, string, number
                            let montant = 0;
                            if (p.montant_enveloppe != null && p.montant_enveloppe !== '') {
                              const parsed = typeof p.montant_enveloppe === 'string' 
                                ? parseFloat(p.montant_enveloppe) 
                                : Number(p.montant_enveloppe);
                              montant = isNaN(parsed) || parsed < 0 ? 0 : parsed;
                            }
                            return sum + montant;
                          }, 0))}
                        </p>
                        <p className="text-xs text-purple-300 mt-1">(Somme des enveloppes de chaque produit)</p>
                      </div>
                      <div className="bg-yellow-500/20 rounded-lg px-4 py-2 border border-yellow-300/30">
                        <p className="text-xs text-yellow-200 font-medium">Réservé</p>
                        <p className="text-lg font-bold text-yellow-300">{formatCurrency(montant.montant_reserve)}</p>
                      </div>
                      <div className="bg-green-500/20 rounded-lg px-4 py-2 border border-green-300/30">
                        <p className="text-xs text-green-200 font-medium">Disponible</p>
                        <p className="text-lg font-bold text-green-300">{formatCurrency(montant.montant_restant)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-200">Progression des réservations</span>
                      <span>{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assuranceProducts.map((product) => (
                      <div 
                        key={product.id} 
                        className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
                      >
                        {/* Product Header */}
                        <div className="p-5 border-b border-gray-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 text-lg mb-2">
                                {product.title}
                              </h3>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {product.category}
                              </span>
                            </div>
                            <FavoriteButton 
                              itemType="structured-product" 
                              itemId={product.id} 
                              title={product.title}
                              description={product.description}
                            />
                          </div>
                        </div>
                        
                        {/* Product Body */}
                        <div className="p-5">
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                          )}
                          
                          {/* Enveloppe spécifique du produit - Section mise en évidence */}
                          {product.montant_enveloppe && product.montant_enveloppe > 0 ? (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                                    💰 Enveloppe de ce produit
                                  </p>
                                  <p className="text-2xl font-bold text-green-700">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.montant_enveloppe)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    Spécifique à ce produit
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-500 italic">
                                ⚠️ Aucune enveloppe spécifique définie pour ce produit
                              </p>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{product.uploaded_by_prenom || 'Admin'} {product.uploaded_by_nom || ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {product.fileUrl && (
                              <a
                                href={product.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors font-medium text-sm text-center"
                              >
                                📥 Télécharger
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowReservationModal(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
                            >
                              ✅ Réserver
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedProduct.assurance || 'Produit'}</h2>
                  <p className="text-sm text-blue-200">{selectedProduct.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedProduct(null);
                    setReservationAmount('');
                    setReservationNotes('');
                    setReservationDate('');
                  }}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📝 Formulaire de réservation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant à investir *</label>
                  <input 
                    type="number" 
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
                  <textarea 
                    rows={3} 
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 rounded-b-xl">
              <button 
                onClick={() => {
                  setShowReservationModal(false);
                  setSelectedProduct(null);
                  setReservationAmount('');
                  setReservationNotes('');
                  setReservationDate('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={handleReservation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Confirmer la réservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
