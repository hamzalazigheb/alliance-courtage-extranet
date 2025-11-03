import React, { useState, useEffect } from 'react';
import { structuredProductsAPI, assurancesAPI, buildAPIURL, buildFileURL } from './api';

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

const StructuredProductsCMSPage: React.FC = () => {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedAssurance, setSelectedAssurance] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Gestion du contenu CMS
  const [activeSection, setActiveSection] = useState<'content' | 'products' | 'assurances'>('content');
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

  // État du formulaire d'upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    assurance: '',
    category: '',
    file: null as File | null
  });

  // Gestion des assurances
  const [assurances, setAssurances] = useState<any[]>([]);
  const [showAssuranceModal, setShowAssuranceModal] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState<any | null>(null);
  const [assuranceForm, setAssuranceForm] = useState({
    name: '',
    montant_enveloppe: '',
    color: 'gray',
    icon: '📄',
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
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      alert('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!uploadForm.title || !uploadForm.assurance || !uploadForm.category) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description || '');
      formData.append('assurance', uploadForm.assurance);
      formData.append('category', uploadForm.category);

      // Appel à l'API d'upload
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

      // Réinitialiser le formulaire
      setUploadForm({
        title: '',
        description: '',
        assurance: '',
        category: '',
        file: null
      });
      
      // Recharger la liste des produits
      await loadProducts();
      
      alert('Produit structuré uploadé avec succès !');
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
      alert('Produit supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
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

  // Grouper les produits par assurance
  const productsByAssurance = products.reduce((acc, product) => {
    const assurance = product.assurance || 'Autres';
    if (!acc[assurance]) {
      acc[assurance] = [];
    }
    acc[assurance].push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Gestion des Produits Structurés</h1>
        <p className="text-white/80">Gérez le contenu, les produits et les assurances</p>
      </div>

      {/* Navigation Sections */}
      <div className="bg-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSection('content')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 'content'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📝 Contenu de la Page
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 'products'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📦 Produits
          </button>
          <button
            onClick={() => setActiveSection('assurances')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 'assurances'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🛡️ Assurances
          </button>
        </div>
      </div>

      {/* Content Section */}
      {activeSection === 'content' && (
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
      {activeSection === 'products' && (
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
                Assurance *
                <button
                  type="button"
                  onClick={() => {
                    setEditingAssurance(null);
                    setAssuranceForm({
                      name: '',
                      montant_enveloppe: '',
                      color: 'gray',
                      icon: '📄',
                      description: '',
                      is_active: true
                    });
                    setShowAssuranceModal(true);
                  }}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  + Ajouter assurance
                </button>
              </label>
              <div className="flex gap-2">
                <select
                  value={uploadForm.assurance}
                  onChange={(e) => setUploadForm({...uploadForm, assurance: e.target.value})}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une assurance</option>
                  {assurances.filter(a => a.is_active).map(assurance => (
                    <option key={assurance.id} value={assurance.name}>
                      {assurance.icon} {assurance.name} {assurance.montant_enveloppe > 0 && `(${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(assurance.montant_enveloppe)})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                Catégorie *
              </label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier Produit *
              </label>
              <input
                type="file"
                onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Types supportés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max: 50MB)
              </p>
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
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mt-1">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                      )}
                      
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        <div className="flex justify-between">
                          <span>👤 Uploadé par:</span>
                          <span>{product.uploaded_by_prenom} {product.uploaded_by_nom}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🕒 Date:</span>
                          <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={buildFileURL(product.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Télécharger</span>
                        </a>
                        <button
                          onClick={() => handleProductDelete(product.id)}
                          className="bg-red-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
        </div>
      )}

      {/* Assurances Section */}
      {activeSection === 'assurances' && (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Gestion des Assurances</h2>
            <button
              onClick={() => {
                setEditingAssurance(null);
                setAssuranceForm({
                  name: '',
                  montant_enveloppe: '',
                  color: 'gray',
                  icon: '📄',
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
                        montant_enveloppe: assurance.montant_enveloppe.toString(),
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
                          alert('Assurance supprimée avec succès');
                        } catch (error) {
                          alert('Erreur lors de la suppression');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  if (editingAssurance) {
                    await assurancesAPI.update(editingAssurance.id, {
                      ...assuranceForm,
                      montant_enveloppe: parseFloat(assuranceForm.montant_enveloppe) || 0
                    });
                    alert('Assurance modifiée avec succès !');
                  } else {
                    await assurancesAPI.create({
                      ...assuranceForm,
                      montant_enveloppe: parseFloat(assuranceForm.montant_enveloppe) || 0
                    });
                    alert('Assurance créée avec succès !');
                  }
                  await loadAssurances();
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
                      placeholder="📄"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant Enveloppe (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={assuranceForm.montant_enveloppe}
                    onChange={(e) => setAssuranceForm({...assuranceForm, montant_enveloppe: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Montant total disponible que les utilisateurs peuvent voir
                  </p>
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
                          <p className="text-sm text-gray-600">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(assurance.montant_enveloppe)}
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
                              montant_enveloppe: assurance.montant_enveloppe.toString(),
                              color: assurance.color || 'gray',
                              icon: assurance.icon || '📄',
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
                                alert('Assurance supprimée');
                              } catch (error: any) {
                                alert(error.message || 'Erreur lors de la suppression');
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
    </div>
  );
};

export default StructuredProductsCMSPage;

