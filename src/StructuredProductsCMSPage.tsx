import React, { useState, useEffect, useMemo } from 'react';
import { structuredProductsAPI, assurancesAPI, buildAPIURL, buildFileURL } from './api';

interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string; // Nom de l'assureur
  montant_enveloppe?: number; // Enveloppe spécifique à ce produit
  date_strike?: string; // Date de Strike du produit
  category: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploaded_by_nom: string;
  uploaded_by_prenom: string;
}

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
  headerImage: string;
  introText: string;
}

interface StructuredProductsCMSPageProps {
  mode?: 'full' | 'content-only' | 'products-only';
}

const StructuredProductsCMSPage: React.FC<StructuredProductsCMSPageProps> = ({ 
  mode = 'full' 
}) => {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [productReservations, setProductReservations] = useState<Record<number, any[]>>({}); // Réservations par produit
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedAssurance, setSelectedAssurance] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Déterminer les sections disponibles selon le mode
  const availableSections = useMemo(() => {
    if (mode === 'content-only') return ['content'];
    if (mode === 'products-only') return ['products', 'assurances'];
    return ['content', 'products', 'assurances']; // full
  }, [mode]);

  // Gestion du contenu CMS
  const [activeSection, setActiveSection] = useState<'content' | 'products' | 'assurances'>(() => {
    if (mode === 'content-only') return 'content';
    if (mode === 'products-only') return 'products';
    return 'content';
  });
  const [contentLoading, setContentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pageContent, setPageContent] = useState<PageContent>({
    title: 'Produits Structurés',
    subtitle: 'Consultez tous les produits structurés par assurance',
    description: 'Découvrez notre gamme complète de produits structurés adaptés à vos besoins d\'investissement et de protection.',
    headerImage: '',
    introText: ''
  });

  // Définir la section par défaut selon le mode
  useEffect(() => {
    if (mode === 'content-only') {
      setActiveSection('content');
    } else if (mode === 'products-only') {
      setActiveSection('products');
    }
  }, [mode]);

  // État du formulaire d'upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    assurances: [] as Array<{name: string, montant: string}>, // Assurances avec leurs montants
    montant_enveloppe_total: '', // Montant total enveloppe global (saisie manuelle)
    date_strike: '', // Date de Strike du produit
    category: [] as string[], // Catégories multiples
    files: [] as File[] // Modifier pour accepter plusieurs fichiers
  });

  // État pour la modification de fichier
  const [editingProductFile, setEditingProductFile] = useState<number | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  
  // État pour stocker les fichiers de chaque produit
  const [productFiles, setProductFiles] = useState<Record<number, any[]>>({});
  
  // État pour la modification de produit (date de strike + catégories)
  const [editingProduct, setEditingProduct] = useState<StructuredProduct | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    date_strike: '',
    category: [] as string[]
  });
  
  // État pour gérer la modification d'un fichier spécifique
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  // Gestion des assurances
  const [assurances, setAssurances] = useState<any[]>([]);
  const [showAssuranceModal, setShowAssuranceModal] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState<any | null>(null);
  const [assuranceForm, setAssuranceForm] = useState({
    name: '',
    color: 'blue',
    icon: '🛡️',
    description: '',
    is_active: true
  });

  const availableCategories = [
    'Épargne',
    'Retraite',
    'Prévoyance',
    'Santé',
    'CIF',
    'Investissements'
  ];

  // Charger les produits, assurances et contenu CMS au montage du composant
  useEffect(() => {
    loadProducts();
    loadAssurances();
    loadContent();
    loadProductReservations();
  }, []);

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
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/produits-structures'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ 
          content: JSON.stringify(pageContent)
        })
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Contenu sauvegardé avec succès!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Erreur sauvegarde contenu:', error);
      alert('Erreur lors de la sauvegarde du contenu');
    } finally {
      setSaving(false);
    }
  };

  const loadAssurances = async () => {
    try {
      const response = await assurancesAPI.getAll(true); // Inclure les inactives pour l'admin
      setAssurances(response);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedAssurance) params.assurance = selectedAssurance;
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await structuredProductsAPI.getAll(params);
      setProducts(response);
      
      // Charger les fichiers pour chaque produit
      await loadAllProductFiles(response);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      alert('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour ajouter un délai
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Charger les fichiers de tous les produits (avec délai pour éviter rate limiting)
  const loadAllProductFiles = async (productsList: any[]) => {
    try {
      const filesData: Record<number, any[]> = {};
      
      // Charger par batch de 5 avec délai
      const batchSize = 5;
      for (let i = 0; i < productsList.length; i += batchSize) {
        const batch = productsList.slice(i, i + batchSize);
        
        // Charger le batch en parallèle
        const batchPromises = batch.map(product => loadProductFiles(product.id));
        const batchResults = await Promise.all(batchPromises);
        
        // Stocker les résultats
        batch.forEach((product, index) => {
          filesData[product.id] = batchResults[index];
        });
        
        // Petit délai entre les batchs (100ms)
        if (i + batchSize < productsList.length) {
          await delay(100);
        }
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

  // Supprimer un fichier
  const handleFileDelete = async (productId: number, fileId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/structured-products/${productId}/files/${fileId}`), {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || ''
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du fichier');
      }

      alert('Fichier supprimé avec succès !');
      // Recharger les fichiers du produit
      const files = await loadProductFiles(productId);
      setProductFiles(prev => ({
        ...prev,
        [productId]: files
      }));
    } catch (error: any) {
      console.error('Erreur suppression fichier:', error);
      alert(error.message || 'Erreur lors de la suppression du fichier');
    }
  };

  // Remplacer un fichier
  const handleFileReplace = async (productId: number, fileId: number, newFile: File) => {
    if (!confirm('Êtes-vous sûr de vouloir remplacer ce fichier ?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', newFile);

      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/structured-products/${productId}/files/${fileId}`), {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du remplacement du fichier');
      }

      alert('Fichier remplacé avec succès !');
      setEditingFileId(null);
      setReplacementFile(null);
      
      // Recharger les fichiers du produit
      const files = await loadProductFiles(productId);
      setProductFiles(prev => ({
        ...prev,
        [productId]: files
      }));
    } catch (error: any) {
      console.error('Erreur remplacement fichier:', error);
      alert(error.message || 'Erreur lors du remplacement du fichier');
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
    
    // Fallback: utiliser le montant enveloppe du produit
    if (montantEnveloppe === 0) {
      montantEnveloppe = parseFloat(product.montant_enveloppe as any) || 0;
    }
    
    const reservations = productReservations[product.id] || [];
    // Filtrer les réservations pour cette assurance spécifique
    const assuranceReservations = assuranceName 
      ? reservations.filter(res => res.assurance_name === assuranceName)
      : reservations;
    const montantReserve = assuranceReservations.reduce((sum, res) => sum + (parseFloat(res.montant) || 0), 0);
    const montantDisponible = montantEnveloppe - montantReserve;
    
    return {
      montant: montantEnveloppe,
      reserve: montantReserve,
      disponible: montantDisponible,
      total: montantEnveloppe
    };
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = isNaN(amount) || amount == null ? 0 : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.files || uploadForm.files.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    if (!uploadForm.title || uploadForm.assurances.length === 0 || uploadForm.category.length === 0 || !uploadForm.montant_enveloppe_total || !uploadForm.date_strike) {
      alert('Veuillez remplir tous les champs obligatoires : nom, au moins une assurance avec montant, montant enveloppe total, date de strike et au moins une catégorie');
      return;
    }

    // Vérifier que tous les montants sont remplis et valides
    const missingMontants = uploadForm.assurances.filter(a => !a.montant || parseFloat(a.montant) <= 0);
    if (missingMontants.length > 0) {
      alert('Veuillez remplir le montant enveloppe pour toutes les assurances sélectionnées');
      return;
    }

    // Utiliser le montant total saisi manuellement
    const montantTotalFinal = parseFloat(uploadForm.montant_enveloppe_total);
    
    if (isNaN(montantTotalFinal) || montantTotalFinal <= 0) {
      alert('Le montant total enveloppe doit être un nombre positif');
      return;
    }

    try {
      setUploading(true);
      
      // Créer UN SEUL produit avec plusieurs assurances, leurs montants et plusieurs fichiers
      const formData = new FormData();
      
      // Ajouter tous les fichiers
      uploadForm.files.forEach((file) => {
        formData.append('files', file);
      });
      
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description || '');
      formData.append('assurances', JSON.stringify(uploadForm.assurances)); // Envoyer les assurances avec leurs montants
      formData.append('date_strike', uploadForm.date_strike); // Date de Strike
      formData.append('category', JSON.stringify(uploadForm.category)); // Envoyer les catégories en JSON
      formData.append('montant_enveloppe', montantTotalFinal.toString()); // Montant total calculé automatiquement

      const response = await fetch(buildAPIURL('/structured-products'), {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      alert(`✅ Produit créé avec succès pour ${uploadForm.assurances.length} assurance(s) !`);
      
      // Réinitialiser le formulaire
      setUploadForm({
        title: '',
        description: '',
        assurances: [],
        montant_enveloppe_total: '',
        date_strike: '',
        category: [],
        files: []
      });
      
      // Recharger la liste des produits
      await loadProducts();
      await loadProductReservations();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      alert(error.message || 'Erreur lors de l\'upload du produit');
    } finally {
      setUploading(false);
    }
  };

  const handleProductDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await structuredProductsAPI.delete(id);
      await loadProducts();
      await loadProductReservations();
      alert('Produit supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  // Fonction pour modifier la date de strike et les catégories d'un produit
  const handleProductEdit = async () => {
    if (!editingProduct) return;

    try {
      await structuredProductsAPI.update(editingProduct.id, {
        date_strike: editProductForm.date_strike || null,
        category: JSON.stringify(editProductForm.category)
      });

      alert('✅ Produit modifié avec succès!');
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('❌ Erreur lors de la modification du produit');
    }
  };

  const handleFileChange = async (productId: number, file: File) => {
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir remplacer le fichier de ce produit ?')) {
      setEditingProductFile(null);
      setNewFile(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/structured-products/${productId}/file`), {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du fichier');
      }

      alert('Fichier mis à jour avec succès !');
      setEditingProductFile(null);
      setNewFile(null);
      await loadProducts();
    } catch (error: any) {
      console.error('Erreur mise à jour fichier:', error);
      alert(error.message || 'Erreur lors de la mise à jour du fichier');
    }
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return '📁';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  const getAssuranceColor = (assurance: string) => {
    const colors: { [key: string]: string } = {
      'SwissLife': 'bg-blue-500',
      'CARDIF': 'bg-orange-500',
      'Abeille Assurances': 'bg-green-500',
      'AXA': 'bg-purple-500',
      'Allianz': 'bg-red-500',
      'Generali': 'bg-yellow-500'
    };
    return colors[assurance] || 'bg-gray-500';
  };

  // Helper function pour parser les assurances (JSON ou string)
  const parseAssurances = (assurance: string | null | undefined): string[] => {
    if (!assurance) return ['Autres'];
    
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(assurance);
      if (Array.isArray(parsed)) {
        // Si c'est un array d'objets avec name, extraire les noms
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && parsed[0].name) {
          return parsed.map((a: any) => a.name || String(a)).filter(Boolean);
        }
        // Sinon, c'est un array de strings
        return parsed.map((a: any) => typeof a === 'string' ? a : String(a));
      }
      // Si c'est un objet unique avec name
      if (typeof parsed === 'object' && parsed !== null && parsed.name) {
        return [parsed.name];
      }
      return [String(parsed)];
    } catch (e) {
      // Si ce n'est pas du JSON, traiter comme une string simple
      return [assurance];
    }
  };

  // Helper function pour obtenir les montants développés des assurances
  const parseAssurancesWithMontants = (assurance: string | null | undefined): Array<{name: string, montant: number}> => {
    if (!assurance) return [];
    
    // Si c'est une simple string (ancien format), retourner vide
    if (!assurance.startsWith('[') && !assurance.startsWith('{')) {
      return [];
    }
    
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
      // Silencieux pour les anciens formats
      return [];
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Gestion des Produits Structurés</h1>
        <p className="text-white/80">
          {mode === 'content-only' 
            ? 'Gérez le contenu de la page' 
            : mode === 'products-only'
            ? 'Gérez les produits et les assurances'
            : 'Gérez le contenu, les produits et les assurances'}
        </p>
      </div>

      {/* Navigation Sections - Afficher seulement si plusieurs sections disponibles */}
      {availableSections.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {availableSections.includes('content') && (
              <button
                onClick={() => setActiveSection('content')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center space-x-2 ${
                  activeSection === 'content'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>📝</span>
                <span>Contenu de la Page</span>
              </button>
            )}
            {availableSections.includes('products') && (
              <button
                onClick={() => setActiveSection('products')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center space-x-2 ${
                  activeSection === 'products'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>📦</span>
                <span>Produits</span>
              </button>
            )}
            {availableSections.includes('assurances') && (
              <button
                onClick={() => setActiveSection('assurances')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center space-x-2 ${
                  activeSection === 'assurances'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>🛡️</span>
                <span>Assurances</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      {activeSection === 'content' && availableSections.includes('content') && (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Gestion du Contenu</h2>
            <button
              onClick={saveContent}
              disabled={saving}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder le contenu'}
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
              {successMessage}
            </div>
          )}

          {contentLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-slate-300 mt-4">Chargement du contenu...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Titre Principal</label>
                <input
                  type="text"
                  value={pageContent.title}
                  onChange={(e) => setPageContent({ ...pageContent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Produits Structurés"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={pageContent.subtitle}
                  onChange={(e) => setPageContent({ ...pageContent, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Consultez tous les produits structurés par assurance"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                <textarea
                  value={pageContent.description}
                  onChange={(e) => setPageContent({ ...pageContent, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Description de la page..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Image d'en-tête (URL)</label>
                <input
                  type="text"
                  value={pageContent.headerImage}
                  onChange={(e) => setPageContent({ ...pageContent, headerImage: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="https://exemple.com/image.jpg"
                />
                {pageContent.headerImage && (
                  <div className="mt-2">
                    <img 
                      src={pageContent.headerImage} 
                      alt="Preview" 
                      className="max-w-md h-32 object-cover rounded-lg border border-slate-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Texte d'introduction</label>
                <textarea
                  value={pageContent.introText}
                  onChange={(e) => setPageContent({ ...pageContent, introText: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Texte d'introduction affiché en haut de la page..."
                />
              </div>

              {/* Live Preview */}
              <div className="mt-6 bg-slate-700/40 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">👁️ Aperçu en temps réel</h3>
                <div className="bg-white rounded-lg p-6">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{pageContent.title || 'Titre'}</h1>
                  <p className="text-gray-600 mb-4">{pageContent.subtitle || 'Sous-titre'}</p>
                  {pageContent.description && (
                    <p className="text-gray-700 mb-4">{pageContent.description}</p>
                  )}
                  {pageContent.introText && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 italic">{pageContent.introText}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Section */}
      {activeSection === 'products' && availableSections.includes('products') && (
        <div className="space-y-6">
      {/* Formulaire d'upload */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 text-blue-600 rounded-lg p-2 mr-3">📤</span>
          Upload Nouveau Produit Structuré
        </h2>
        
        <form onSubmit={handleFileUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Produit *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Stratégie Patrimoine S Total Dividende"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assurance(s) *
                <button
                  type="button"
                  onClick={() => {
                    setEditingAssurance(null);
                    setAssuranceForm({
                      name: '',
                      color: 'blue',
                      icon: '🛡️',
                      description: '',
                      is_active: true
                    });
                    setShowAssuranceModal(true);
                  }}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline font-semibold"
                  title="Créer une nouvelle assurance"
                >
                  + Créer une nouvelle assurance
                </button>
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {assurances.filter(a => a.is_active).length === 0 ? (
                  <div className="text-sm text-yellow-600 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    ⚠️ Aucune assurance active. Créez-en une d'abord.
                  </div>
                ) : (
                  assurances.filter(a => a.is_active).map(assurance => {
                    const isSelected = uploadForm.assurances.some(a => a.name === assurance.name);
                    const selectedItem = uploadForm.assurances.find(a => a.name === assurance.name);
                    
                    return (
                      <div key={assurance.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUploadForm({
                                  ...uploadForm,
                                  assurances: [...uploadForm.assurances, { name: assurance.name, montant: '' }]
                                });
                              } else {
                                setUploadForm({
                                  ...uploadForm,
                                  assurances: uploadForm.assurances.filter(a => a.name !== assurance.name)
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 flex-1">
                            {assurance.icon} {assurance.name}
                          </span>
                        </label>
                        {isSelected && (
                          <div className="mt-2 ml-7">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Montant enveloppe (€) pour cette assurance *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedItem?.montant || ''}
                              onChange={(e) => {
                                setUploadForm({
                                  ...uploadForm,
                                  assurances: uploadForm.assurances.map(a => 
                                    a.name === assurance.name 
                                      ? { ...a, montant: e.target.value }
                                      : a
                                  )
                                });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ex: 1000000"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Montant spécifique à cette assurance pour ce produit
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {uploadForm.assurances.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {uploadForm.assurances.length} assurance(s) sélectionnée(s)
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant enveloppe total (€) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={uploadForm.montant_enveloppe_total}
              onChange={(e) => setUploadForm({...uploadForm, montant_enveloppe_total: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 1000000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Montant total global pour ce produit (saisie manuelle)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de Strike *
            </label>
            <input
              type="date"
              value={uploadForm.date_strike}
              onChange={(e) => setUploadForm({...uploadForm, date_strike: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Date d'échéance du produit structuré
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description du Produit
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Description détaillée du produit structuré..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie(s) * (cochez une ou plusieurs)
              </label>
              <div className="grid grid-cols-2 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={uploadForm.category.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUploadForm({...uploadForm, category: [...uploadForm.category, category]});
                        } else {
                          setUploadForm({...uploadForm, category: uploadForm.category.filter(c => c !== category)});
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
              {uploadForm.category.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ✓ {uploadForm.category.length} catégorie(s) sélectionnée(s): {uploadForm.category.join(', ')}
                </p>
              )}
              {uploadForm.category.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Veuillez sélectionner au moins une catégorie
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichiers Produit * (plusieurs fichiers possibles)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={(e) => {
                  const filesArray = Array.from(e.target.files || []);
                  setUploadForm({...uploadForm, files: filesArray});
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Types supportés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max: 50MB par fichier)
              </p>
              {uploadForm.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {uploadForm.files.length} fichier(s) sélectionné(s):
                  </p>
                  <div className="space-y-1">
                    {uploadForm.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600 truncate flex-1">
                          📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = uploadForm.files.filter((_, i) => i !== index);
                            setUploadForm({...uploadForm, files: newFiles});
                          }}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ✗
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Uploader le Produit</span>
                </>
              )}
            </button>
          </div>
        </form>
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
                <option key={assurance.id} value={assurance.name}>{assurance.icon} {assurance.name}</option>
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
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
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
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">Chargement des produits...</p>
          </div>
        ) : Object.keys(productsByAssurance).length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="text-8xl mb-4">📊</div>
            <p className="text-gray-600 text-xl">Aucun produit structuré trouvé</p>
            <p className="text-gray-500 mt-2">Commencez par uploader votre premier produit</p>
          </div>
        ) : (
          Object.entries(productsByAssurance).map(([assurance, assuranceProducts]) => {
            return (
            <div key={assurance} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
              {/* En-tête Assurance */}
              <div className={`${getAssuranceColor(assurance)} text-white p-6`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold">{assurance.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{assurance}</h2>
                      <p className="text-white/80">{assuranceProducts.length} produit{assuranceProducts.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des Produits */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assuranceProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="text-2xl flex-shrink-0">{getFileIcon(product.file_type)}</div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg mb-1 truncate">{product.title}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                                  <span key={idx} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                    {cat}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                      )}
                      
                      {/* Montants du produit */}
                      {(() => {
                        const amounts = getProductAmounts(product, assurance);
                        return (
                          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Montant</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {formatCurrency(amounts.montant)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Réservé</p>
                              <p className="text-sm font-semibold text-yellow-600">
                                {formatCurrency(amounts.reserve)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Disponible</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(amounts.disponible)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Date de Strike */}
                      {product.date_strike && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium mb-1">📅 Date de Strike</p>
                          <p className="text-sm font-bold text-blue-800">
                            {new Date(product.date_strike).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      
                      {/* Liste des fichiers */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          📎 Fichiers ({productFiles[product.id]?.length || 0})
                        </h4>
                        {productFiles[product.id] && productFiles[product.id].length > 0 ? (
                          <div className="space-y-2">
                            {productFiles[product.id].map((file: any) => (
                              <div key={file.id} className="bg-white p-2 rounded border border-gray-200">
                                {editingFileId === file.id ? (
                                  // Mode édition
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{getFileIcon(file.file_type)}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{file.file_name}</p>
                                        <p className="text-xs text-gray-500">Remplacer ce fichier</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                        onChange={(e) => {
                                          const selectedFile = e.target.files?.[0];
                                          if (selectedFile) {
                                            setReplacementFile(selectedFile);
                                          }
                                        }}
                                        className="flex-1 text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                      />
                                      <button
                                        onClick={() => {
                                          if (replacementFile) {
                                            handleFileReplace(product.id, file.id, replacementFile);
                                          } else {
                                            alert('Veuillez sélectionner un fichier');
                                          }
                                        }}
                                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        title="Confirmer"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingFileId(null);
                                          setReplacementFile(null);
                                        }}
                                        className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                        title="Annuler"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // Mode normal
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <span className="text-lg">{getFileIcon(file.file_type)}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{file.file_name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                      <a
                                        href={buildAPIURL(`/structured-products/${product.id}/files/${file.id}/download`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        title="Télécharger"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </a>
                                      <button
                                        onClick={() => setEditingFileId(file.id)}
                                        className="p-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                                        title="Modifier"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleFileDelete(product.id, file.id)}
                                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        title="Supprimer"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Aucun fichier</p>
                        )}
                      </div>

                      {/* Boutons actions produit */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            // Parser les catégories
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
                            setEditProductForm({
                              date_strike: product.date_strike || '',
                              category: categories
                            });
                          }}
                          className="bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleProductDelete(product.id)}
                          className="bg-red-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Supprimer</span>
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

      {/* Tableau Récapitulatif par Produit */}
      {!loading && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
            <h3 className="text-xl font-bold">📊 Récapitulatif par Produit</h3>
            <p className="text-sm text-indigo-100">Vue d'ensemble des montants développés et réservations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assurances
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Développé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Réservé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponible
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Grouper les produits par titre
                  const productsByTitle = products.reduce((acc, product) => {
                    const title = product.title;
                    if (!acc[title]) {
                      acc[title] = {
                        title: title,
                        category: product.category,
                        products: [],
                        assurances: new Set<string>(),
                        montantTotal: 0,
                        reserveTotal: 0
                      };
                    }
                    
                    acc[title].products.push(product);
                    const assuranceNames = parseAssurances(product.assurance);
                    assuranceNames.forEach((a: string) => acc[title].assurances.add(a));
                    acc[title].montantTotal += parseFloat(product.montant_enveloppe as any) || 0;
                    
                    // Ajouter les réservations
                    const reservations = productReservations[product.id] || [];
                    acc[title].reserveTotal += reservations.reduce((sum, res) => sum + (parseFloat(res.montant) || 0), 0);
                    
                    return acc;
                  }, {} as Record<string, any>);
                  
                  const groupedProducts = Object.values(productsByTitle);
                  
                  return groupedProducts.map((group: any) => {
                    const disponible = group.montantTotal - group.reserveTotal;
                    const assurancesList = Array.from(group.assurances).join(', ');
                    
                    return (
                      <tr key={group.title} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{group.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {group.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{assurancesList}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(group.montantTotal)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-yellow-600">
                            {formatCurrency(group.reserveTotal)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(disponible)}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
                {/* Ligne de totaux */}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                    TOTAL GÉNÉRAL
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-blue-600">
                    {formatCurrency(
                      products.reduce((sum, p) => {
                        return sum + (parseFloat(p.montant_enveloppe as any) || 0);
                      }, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-yellow-600">
                    {formatCurrency(Object.values(productReservations).flat().reduce((sum, res) => {
                      return sum + (parseFloat(res.montant) || 0);
                    }, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">
                    {formatCurrency(
                      products.reduce((sum, p) => {
                        return sum + (parseFloat(p.montant_enveloppe as any) || 0);
                      }, 0) -
                      Object.values(productReservations).flat().reduce((sum, res) => {
                        return sum + (parseFloat(res.montant) || 0);
                      }, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Assurances Section */}
      {activeSection === 'assurances' && availableSections.includes('assurances') && (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Gestion des Assurances</h2>
            <button
              onClick={() => {
                setEditingAssurance(null);
                setAssuranceForm({
                  name: '',
                  color: 'blue',
                  icon: '🛡️',
                  description: '',
                  is_active: true
                });
                setShowAssuranceModal(true);
              }}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
            >
              + Ajouter une assurance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assurances.map(assurance => (
              <div
                key={assurance.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{assurance.icon}</span>
                    <h3 className="text-lg font-bold text-white">{assurance.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      assurance.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {assurance.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {assurance.description && (
                  <p className="text-slate-300 text-sm mb-2">{assurance.description}</p>
                )}
                
                <div className="text-slate-300 text-sm mb-3">
                  <strong>Enveloppe:</strong>{' '}
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(assurance.montant_enveloppe || 0)}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingAssurance(assurance);
                      setAssuranceForm({
                        name: assurance.name,
                        color: assurance.color,
                        icon: assurance.icon,
                        description: assurance.description || '',
                        is_active: assurance.is_active
                      });
                      setShowAssuranceModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Êtes-vous sûr de vouloir supprimer ${assurance.name}?`)) {
                        try {
                          await assurancesAPI.delete(assurance.id);
                          await loadAssurances();
                          alert('✅ Assurance supprimée avec succès');
                        } catch (error: any) {
                          // Extraire le message d'erreur
                          const errorMessage = error?.message || error?.error || 'Erreur lors de la suppression';
                          
                          // Message plus visible avec détails si des produits utilisent l'assurance
                          if (errorMessage.includes('produit(s) l\'utilise(nt) encore')) {
                            alert(`⚠️ Suppression impossible\n\n${errorMessage}\n\nVeuillez d'abord supprimer ou modifier les produits associés à cette assurance.`);
                          } else {
                            alert(`❌ ${errorMessage}`);
                          }
                          
                          console.error('Erreur suppression assurance:', error);
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de gestion des assurances */}
      {showAssuranceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingAssurance ? 'Modifier l\'assurance' : 'Nouvelle assurance'}
                </h2>
                <button
                  onClick={() => {
                    setShowAssuranceModal(false);
                    setEditingAssurance(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  let createdAssurance = null;
                  
                  if (editingAssurance) {
                    await assurancesAPI.update(editingAssurance.id, {
                      ...assuranceForm,
                      montant_enveloppe: 0 // Le montant n'est plus géré au niveau de l'assurance
                    });
                    alert('Assurance modifiée avec succès !');
                  } else {
                    // Créer la nouvelle assurance
                    createdAssurance = await assurancesAPI.create({
                      ...assuranceForm,
                      montant_enveloppe: 0 // Le montant n'est plus géré au niveau de l'assurance
                    });
                  }
                  
                  // Recharger la liste des assurances
                  await loadAssurances();
                  
                  // Si c'est une nouvelle assurance créée depuis le formulaire d'upload,
                  // informer l'utilisateur qu'il peut maintenant la cocher
                  if (createdAssurance && !editingAssurance) {
                    alert(`✅ Assurance "${assuranceForm.name}" créée avec succès ! Vous pouvez maintenant la sélectionner dans la liste ci-dessous.`);
                  } else if (!editingAssurance) {
                    alert(`✅ Assurance "${assuranceForm.name}" créée avec succès !`);
                  }
                  
                  setShowAssuranceModal(false);
                  setEditingAssurance(null);
                } catch (error: any) {
                  alert(error.message || 'Erreur lors de la sauvegarde');
                }
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={assuranceForm.name}
                      onChange={(e) => setAssuranceForm({...assuranceForm, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>
                    <input
                      type="text"
                      value={assuranceForm.icon}
                      onChange={(e) => setAssuranceForm({...assuranceForm, icon: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="🛡️"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Utilisez un emoji pour représenter l'assurance (ex: 🛡️, 🏢, 💼, etc.)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <select
                    value={assuranceForm.color}
                    onChange={(e) => setAssuranceForm({...assuranceForm, color: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blue">Bleu</option>
                    <option value="orange">Orange</option>
                    <option value="green">Vert</option>
                    <option value="purple">Violet</option>
                    <option value="red">Rouge</option>
                    <option value="yellow">Jaune</option>
                    <option value="gray">Gris</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={assuranceForm.description}
                    onChange={(e) => setAssuranceForm({...assuranceForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={assuranceForm.is_active}
                    onChange={(e) => setAssuranceForm({...assuranceForm, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Assurance active (visible pour les utilisateurs)
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssuranceModal(false);
                      setEditingAssurance(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700"
                  >
                    {editingAssurance ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>

              {/* Liste des assurances pour modification/suppression */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Gérer les assurances</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {assurances.map(assurance => (
                    <div key={assurance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{assurance.icon}</span>
                        <div>
                          <p className="font-medium">{assurance.name}</p>
                          <p className="text-sm text-gray-500 italic">
                            Montant géré au niveau du produit
                          </p>
                        </div>
                        {!assurance.is_active && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                      setEditingAssurance(assurance);
                      setAssuranceForm({
                        name: assurance.name,
                        color: assurance.color || 'blue',
                        icon: assurance.icon || '🛡️',
                        description: assurance.description || '',
                        is_active: assurance.is_active
                      });
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Supprimer ${assurance.name} ?`)) {
                              try {
                                await assurancesAPI.delete(assurance.id);
                                await loadAssurances();
                                alert('✅ Assurance supprimée avec succès');
                              } catch (error: any) {
                                // Extraire le message d'erreur
                                const errorMessage = error?.message || error?.error || 'Erreur lors de la suppression';
                                
                                // Message plus visible avec détails si des produits utilisent l'assurance
                                if (errorMessage.includes('produit(s) l\'utilise(nt) encore')) {
                                  alert(`⚠️ Suppression impossible\n\n${errorMessage}\n\nVeuillez d'abord supprimer ou modifier les produits associés à cette assurance.`);
                                } else {
                                  alert(`❌ ${errorMessage}`);
                                }
                                
                                console.error('Erreur suppression assurance:', error);
                              }
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de produit */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">✏️ Modifier le produit</h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2">{editingProduct.title}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date de Strike */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date de Strike
                </label>
                <input
                  type="date"
                  value={editProductForm.date_strike}
                  onChange={(e) => setEditProductForm({...editProductForm, date_strike: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Date d'échéance du produit structuré
                </p>
              </div>

              {/* Catégories (checkboxes) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Catégorie(s) * (cochez une ou plusieurs)
                </label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editProductForm.category.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditProductForm({...editProductForm, category: [...editProductForm.category, category]});
                          } else {
                            setEditProductForm({...editProductForm, category: editProductForm.category.filter(c => c !== category)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
                {editProductForm.category.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ {editProductForm.category.length} catégorie(s) sélectionnée(s): {editProductForm.category.join(', ')}
                  </p>
                )}
                {editProductForm.category.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Veuillez sélectionner au moins une catégorie
                  </p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleProductEdit}
                  disabled={editProductForm.category.length === 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  💾 Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredProductsCMSPage;

