import React, { useState, useEffect } from 'react';
import { structuredProductsAPI } from './api';

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

function StructuredProductsDashboard() {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedAssurance, setSelectedAssurance] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // État du formulaire d'upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    assurance: '',
    category: '',
    file: null as File | null
  });

  // Charger les produits au montage du composant
  useEffect(() => {
    loadProducts();
  }, []);

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

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('assurance', uploadForm.assurance);
      formData.append('category', uploadForm.category);

      // Appel à l'API d'upload
      const response = await fetch('http://localhost:3001/api/structured-products', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
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
      loadProducts();
      
      alert('Produit structuré uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du produit');
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
      loadProducts();
      alert('Produit supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssurance = !selectedAssurance || product.assurance === selectedAssurance;
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesAssurance && matchesCategory;
  });

  const assurances = [...new Set(products.map(p => p.assurance).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Grouper les produits par assurance
  const productsByAssurance = filteredProducts.reduce((acc, product) => {
    const assurance = product.assurance || 'Autres';
    if (!acc[assurance]) {
      acc[assurance] = [];
    }
    acc[assurance].push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Dashboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                📊 Dashboard Produits Structurés
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez et organisez vos produits structurés par assurance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm text-gray-500">Total produits</span>
                <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm text-gray-500">Assurances</span>
                <div className="text-2xl font-bold text-green-600">{assurances.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire d'upload */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
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
                </label>
                <select
                  value={uploadForm.assurance}
                  onChange={(e) => setUploadForm({...uploadForm, assurance: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une assurance</option>
                  <option value="SwissLife">SwissLife</option>
                  <option value="CARDIF">CARDIF</option>
                  <option value="Abeille Assurances">Abeille Assurances</option>
                  <option value="AXA">AXA</option>
                  <option value="Allianz">Allianz</option>
                  <option value="Generali">Generali</option>
                </select>
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
                  <option value="Épargne">Épargne</option>
                  <option value="Retraite">Retraite</option>
                  <option value="Prévoyance">Prévoyance</option>
                  <option value="Santé">Santé</option>
                  <option value="CIF">CIF</option>
                  <option value="Investissements">Investissements</option>
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
                  Types supportés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max: 10MB)
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
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
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
                {assurances.map(assurance => (
                  <option key={assurance} value={assurance}>{assurance}</option>
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
                {categories.map(category => (
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
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-lg">Chargement des produits...</p>
            </div>
          ) : Object.keys(productsByAssurance).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">📊</div>
              <p className="text-gray-600 text-xl">Aucun produit structuré trouvé</p>
              <p className="text-gray-500 mt-2">Commencez par uploader votre premier produit</p>
            </div>
          ) : (
            Object.entries(productsByAssurance).map(([assurance, assuranceProducts]) => (
              <div key={assurance} className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                      <div className="text-3xl font-bold">{assuranceProducts.length}</div>
                      <div className="text-white/80 text-sm">Produits</div>
                    </div>
                  </div>
                </div>

                {/* Liste des Produits */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assuranceProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getFileIcon(product.file_type)}</div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">{product.title}</h3>
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
                            <span>💾 Taille:</span>
                            <span>{formatFileSize(product.file_size)}</span>
                          </div>
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
                          <button
                            onClick={() => window.open(`http://localhost:3001/${product.file_path}`, '_blank')}
                            className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Télécharger</span>
                          </button>
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
    </div>
  );
}

export default StructuredProductsDashboard;
