import React, { useState, useEffect } from "react";
import { structuredProductsAPI, buildFileURL, assurancesAPI, buildAPIURL, authAPI } from "../api";
import FavoriteButton from "../components/FavoriteButton";

interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string;
  montant_enveloppe?: number; // Enveloppe spécifique à ce produit
  date_strike?: string; // Date de Strike du produit
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
  const [productReservations, setProductReservations] = useState<Record<number, any[]>>({});
  const [productFiles, setProductFiles] = useState<Record<number, any[]>>({}); // Réservations par produit
  const [loading, setLoading] = useState(true);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [selectedProductAssurance, setSelectedProductAssurance] = useState<string>(''); // Assurance du produit pour la réservation
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationAmount, setReservationAmount] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null); // Utilisateur connecté
  
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
    loadProductReservations();
    loadUserProfile();
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

  // Charger le profil de l'utilisateur connecté
  const loadUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      // L'API retourne { user: {...} }, donc on extrait user
      const user = response.user || response;
      setCurrentUser(user);
    } catch (error) {
      console.error('Erreur chargement profil utilisateur:', error);
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
      
      // Charger les fichiers pour chaque produit
      await loadAllProductFiles(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les fichiers de tous les produits
  const loadAllProductFiles = async (productsList: any[]) => {
    try {
      const filesData: Record<number, any[]> = {};
      
      for (const product of productsList) {
        const files = await loadProductFiles(product.id);
        filesData[product.id] = files;
      }
      
      setProductFiles(filesData);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    }
  };

  // Charger les fichiers d'un produit spécifique
  const loadProductFiles = async (productId: number): Promise<any[]> => {
    try {
      const response = await fetch(buildAPIURL(`/structured-products/${productId}/files`));
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des fichiers');
      }
      return await response.json();
    } catch (error) {
      console.error(`Erreur chargement fichiers produit ${productId}:`, error);
      return [];
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

  // Charger les réservations pour tous les produits
  const loadProductReservations = async () => {
    try {
      const reservations = await structuredProductsAPI.getAllReservations('approved');
      // Grouper les réservations par product_id
      const reservationsByProduct: Record<number, any[]> = {};
      reservations.forEach((reservation: any) => {
        if (!reservationsByProduct[reservation.product_id]) {
          reservationsByProduct[reservation.product_id] = [];
        }
        reservationsByProduct[reservation.product_id].push(reservation);
      });
      setProductReservations(reservationsByProduct);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    }
  };

  // Calculer les montants pour un produit
  const getProductAmounts = (product: StructuredProduct, assuranceName?: string) => {
    // Récupérer le montant développé pour ce produit et cette assurance spécifique
    const assurancesWithMontants = parseAssurancesWithMontants(product.assurance);
    let montantEnveloppe = 0;
    
    // Si le produit a des montants développés stockés
    if (assurancesWithMontants.length > 0) {
      // Si un nom d'assurance est fourni, chercher le montant correspondant
      if (assuranceName) {
        const assuranceData = assurancesWithMontants.find(a => a.name === assuranceName);
        if (assuranceData && assuranceData.montant > 0) {
          montantEnveloppe = assuranceData.montant;
        }
      }
      
      // Si aucun montant trouvé avec le nom, utiliser le premier montant disponible
      if (montantEnveloppe === 0 && assurancesWithMontants[0].montant > 0) {
        montantEnveloppe = assurancesWithMontants[0].montant;
      }
    }
    
    // Fallback 1: utiliser le montant enveloppe du produit (NOUVEAU système: 1 produit = 1 assurance)
    if (montantEnveloppe === 0) {
      montantEnveloppe = parseFloat(product.montant_enveloppe as any) || 0;
    }
    
    // Fallback 2: utiliser le montant enveloppe global de l'assurance (ANCIEN système, à éviter)
    if (montantEnveloppe === 0) {
      const productAssurances = parseAssurances(product.assurance);
      const targetAssurance = assuranceName || (productAssurances.length > 0 ? productAssurances[0] : null);
      if (targetAssurance) {
        const assuranceMontant = getAssuranceMontant(targetAssurance);
        montantEnveloppe = parseFloat(assuranceMontant.montant_enveloppe as any) || 0;
      }
    }
    
    const reservations = productReservations[product.id] || [];
    // Filtrer les réservations pour cette assurance spécifique
    const assuranceReservations = assuranceName 
      ? reservations.filter(res => res.assurance_name === assuranceName)
      : reservations;
    
    // Calculer le montant total réservé par TOUS les utilisateurs
    const montantReserveTotal = assuranceReservations.reduce((sum, res) => sum + (parseFloat(res.montant) || 0), 0);
    
    // Calculer le montant réservé par l'utilisateur connecté UNIQUEMENT
    const userReservations = currentUser 
      ? assuranceReservations.filter(res => res.user_id === currentUser.id)
      : [];
    
    const montantReserveUser = userReservations.reduce((sum, res) => sum + (parseFloat(res.montant) || 0), 0);
    
    const montantDisponible = montantEnveloppe - montantReserveTotal;
    
    return {
      montant: montantEnveloppe,
      reserve: montantReserveUser,        // Montant réservé par l'utilisateur (pour affichage sur la carte)
      reserveTotal: montantReserveTotal,  // Montant total réservé par tous (pour calcul disponible et header)
      disponible: montantDisponible,
      total: montantEnveloppe
    };
  };

  const handleReservation = async () => {
    if (!selectedProduct || !reservationAmount) {
      alert('Veuillez remplir le montant à investir');
      return;
    }

    // Calculer le montant disponible pour ce produit
    const amounts = getProductAmounts(selectedProduct, selectedProductAssurance);
    const montantSaisi = parseFloat(reservationAmount);
    
    // Validation : vérifier que le montant est positif
    if (isNaN(montantSaisi) || montantSaisi <= 0) {
      alert('❌ Erreur : Le montant doit être supérieur à 0');
      return;
    }
    
    // Validation : vérifier que le montant saisi ne dépasse pas le montant disponible
    if (montantSaisi > amounts.disponible) {
      alert(`❌ Erreur : Le montant saisi (${formatCurrency(montantSaisi)}) dépasse le montant disponible.\n\nMontant maximum disponible : ${formatCurrency(amounts.disponible)}`);
      return;
    }

    try {
      await structuredProductsAPI.createReservation(
        selectedProduct.id,
        montantSaisi,
        reservationNotes || null,
        selectedProductAssurance // Passer l'assurance du produit
      );
      alert('Réservation créée avec succès !');
      setShowReservationModal(false);
      setReservationAmount('');
      setReservationNotes('');
      setReservationDate('');
      setSelectedProduct(null);
      setSelectedProductAssurance(''); // Réinitialiser l'assurance
      await loadAssurancesMontants();
      await loadProductReservations();
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      alert(error.message || 'Erreur lors de la création de la réservation');
    }
  };

  // Helper function pour parser les assurances (JSON ou string)
  // Peut être: ["assurance1", "assurance2"] ou [{"name": "assurance1", "montant": 5000}, ...]
  const parseAssurances = (assurance: string | null | undefined): string[] => {
    if (!assurance) return ['Autres'];
    
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(assurance);
      if (Array.isArray(parsed)) {
        // Si c'est un array d'objets avec name, extraire les noms
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name) {
          return parsed.map((a: any) => a.name);
        }
        // Sinon, c'est déjà un array de strings
        return parsed;
      }
      return [parsed];
    } catch (e) {
      // Si ce n'est pas du JSON, traiter comme une string simple
      return [assurance];
    }
  };

  // Helper function pour obtenir les montants développés des assurances
  const parseAssurancesWithMontants = (assurance: string | null | undefined): Array<{name: string, montant: number}> => {
    if (!assurance) return [];
    
    try {
      const parsed = JSON.parse(assurance);
      if (Array.isArray(parsed)) {
        // Si c'est un array d'objets avec name et montant
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          // Vérifier si c'est le nouveau format avec name et montant
          if (parsed[0].name !== undefined) {
            return parsed.map((a: any) => {
              // Gérer les montants qui peuvent être des nombres ou des strings
              let montant = 0;
              if (a.montant !== undefined && a.montant !== null) {
                montant = typeof a.montant === 'number' ? a.montant : parseFloat(a.montant) || 0;
              }
              return {
                name: a.name || '',
                montant: montant
              };
            }).filter(a => a.name); // Filtrer les entrées sans nom
          }
        }
        // Sinon, c'est un array de strings (ancien format)
        return [];
      }
      return [];
    } catch (e) {
      console.warn('Erreur parsing assurances avec montants:', e, assurance);
      return [];
    }
  };

  const getAssuranceMontant = (assuranceName: string) => {
    // Parser les assurances dans assurancesMontants pour faire la correspondance
    const montant = assurancesMontants.find(m => {
      const mAssurances = parseAssurances(m.assurance);
      return mAssurances.includes(assuranceName);
    });
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
  // Les assurances peuvent être stockées comme JSON array ou string simple
  const productsByAssurance = products.reduce((acc, product) => {
    const assurancesArray = parseAssurances(product.assurance);
    
    // Si aucune assurance, mettre dans "Autres"
    if (assurancesArray.length === 0) {
      assurancesArray.push('Autres');
    }
    
    // Ajouter le produit à chaque assurance
    assurancesArray.forEach(assurance => {
    if (!acc[assurance]) {
      acc[assurance] = [];
    }
    acc[assurance].push(product);
    });
    
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
            
            // Calculer le montant cumulé des réservations acceptées pour cette assurance
            // en sommant toutes les réservations acceptées de tous les produits de cette assurance
            let montantReserveCumule = 0;
            let montantEnveloppeTotal = 0;
            
            assuranceProducts.forEach(product => {
              const amounts = getProductAmounts(product, assurance);
              montantEnveloppeTotal += amounts.montant;
              montantReserveCumule += amounts.reserveTotal; // Utiliser le total de tous les utilisateurs
            });
            
            // Utiliser le montant calculé ou celui de la base de données comme fallback
            const montantReserveFinal = montantReserveCumule > 0 ? montantReserveCumule : (montant.montant_reserve || 0);
            const montantEnveloppeFinal = montantEnveloppeTotal > 0 ? montantEnveloppeTotal : (montant.montant_enveloppe || 0);
            
            const progressPercent = montantEnveloppeFinal > 0 
              ? (montantReserveFinal / montantEnveloppeFinal) * 100 
              : 0;
            
            return (
              <div key={assurance} className="bg-gradient-to-br from-white to-slate-100 rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-300">
                {/* Assurance Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 text-white p-6 border-b-4 border-blue-500">
                  <div className="flex flex-col gap-4">
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
                  
                  {/* Progress Bar */}
                    <div className="mt-2">
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
                    
                    {/* Affichage du montant cumulé des réservations acceptées */}
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-200">Montant cumulé des réservations acceptées:</span>
                        <span className="text-white font-bold">{formatCurrency(montantReserveFinal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 text-blue-200">
                        <span>Enveloppe totale:</span>
                        <span>{formatCurrency(montantEnveloppeFinal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 text-blue-200">
                        <span>Enveloppe restante:</span>
                        <span className="font-semibold">{formatCurrency(montantEnveloppeFinal - montantReserveFinal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assuranceProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border-2 border-slate-200 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 overflow-hidden"
                      >
                        {/* Product Header */}
                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-lg mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {product.title}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  // Parser les catégories (peut être JSON array ou string simple)
                                  let categories: string[] = [];
                                  try {
                                    if (product.category && product.category.startsWith('[')) {
                                      categories = JSON.parse(product.category);
                                    } else {
                                      categories = [product.category];
                                    }
                                  } catch {
                                    categories = [product.category];
                                  }
                                  
                                  return categories.map((cat, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                      {cat}
                                    </span>
                                  ));
                                })()}
                              </div>
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
                          
                          {/* Montants du produit */}
                          {(() => {
                            const amounts = getProductAmounts(product, assurance);
                            return (
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Montant
                                  </p>
                                  <p className="text-base font-bold text-slate-800">
                                    {formatCurrency(amounts.montant)}
                                  </p>
                                </div>
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Réservé
                                  </p>
                                  <p className="text-base font-bold text-amber-700">
                                    {formatCurrency(amounts.reserve)}
                                  </p>
                            </div>
                                <div className="col-span-2 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Disponible
                                  </p>
                                  <p className="text-lg font-bold text-emerald-700">
                                    {formatCurrency(amounts.disponible)}
                                  </p>
                            </div>
                          </div>
                            );
                          })()}
                          
                          {/* Date de Strike */}
                          {product.date_strike && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300">
                              <p className="text-xs text-blue-700 font-semibold mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Date de Strike
                              </p>
                              <p className="text-base font-bold text-blue-900">
                                {new Date(product.date_strike).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                          
                          {/* Liste des fichiers */}
                          {productFiles[product.id] && productFiles[product.id].length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Fichiers disponibles ({productFiles[product.id].length})
                              </h4>
                              <div className="space-y-2">
                                {productFiles[product.id].map((file: any) => (
                              <a
                                    key={file.id}
                                    href={buildAPIURL(`/structured-products/${product.id}/files/${file.id}/download`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                    className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all group"
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className="bg-blue-100 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600">
                                          {file.file_name}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">
                                          {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 text-blue-600 group-hover:text-blue-700">
                                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                              </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Bouton Réserver */}
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                              setSelectedProductAssurance(assurance); // Stocker l'assurance du groupe actuel
                                setShowReservationModal(true);
                              }}
                            className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center space-x-2 border-2 border-blue-500"
                            >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Réserver ce produit</span>
                            </button>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-slate-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 text-white px-6 py-5 rounded-t-2xl border-b-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedProductAssurance || 'Produit'}</h2>
                  <p className="text-sm text-blue-200">{selectedProduct.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedProduct(null);
                    setSelectedProductAssurance('');
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
              
              {/* Afficher les informations du produit */}
              {(() => {
                const amounts = getProductAmounts(selectedProduct, selectedProductAssurance);
                return (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Montant total</p>
                        <p className="font-semibold text-gray-800">{formatCurrency(amounts.montant)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Déjà réservé (tous utilisateurs)</p>
                        <p className="font-semibold text-yellow-600">{formatCurrency(amounts.reserveTotal)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 mb-1">Montant disponible</p>
                        <p className="font-bold text-green-600 text-lg">{formatCurrency(amounts.disponible)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
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
                    min="0"
                    step="0.01"
                  />
                  {(() => {
                    if (!reservationAmount) return null;
                    const amounts = getProductAmounts(selectedProduct, selectedProductAssurance);
                    const montantSaisi = parseFloat(reservationAmount);
                    if (isNaN(montantSaisi) || montantSaisi <= 0) {
                      return (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          ⚠️ Le montant doit être supérieur à 0
                        </p>
                      );
                    }
                    if (montantSaisi > amounts.disponible) {
                      return (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          ⚠️ Le montant saisi dépasse le montant disponible. Montant maximum : {formatCurrency(amounts.disponible)}
                        </p>
                      );
                    }
                    return null;
                  })()}
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
                disabled={(() => {
                  if (!reservationAmount) return true;
                  const amounts = getProductAmounts(selectedProduct, selectedProductAssurance);
                  const montantSaisi = parseFloat(reservationAmount);
                  return isNaN(montantSaisi) || montantSaisi <= 0 || montantSaisi > amounts.disponible;
                })()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium"
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
