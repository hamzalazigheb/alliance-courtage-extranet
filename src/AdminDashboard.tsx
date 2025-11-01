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
}

interface UploadForm {
  title: string;
  description: string;
  assurance: string;
  category: string;
  file: File | null;
}

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [assurances, setAssurances] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    title: '',
    description: '',
    assurance: '',
    category: '',
    file: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'upload' | 'settings'>('dashboard');

  useEffect(() => {
    loadProducts();
    loadAssurances();
    loadCategories();
  }, [selectedAssurance, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    setLoading(true);
    try {
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

  const loadAssurances = async () => {
    try {
      const response = await structuredProductsAPI.getAssurances();
      setAssurances(response);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await structuredProductsAPI.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
    } else {
      setUploadForm(prev => ({ ...prev, file: null }));
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title || !uploadForm.assurance || !uploadForm.category) {
      alert('Veuillez remplir tous les champs obligatoires et sélectionner un fichier.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('assurance', uploadForm.assurance);
    formData.append('category', uploadForm.category);

    try {
      const response = await fetch('http://localhost:3001/api/structured-products', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload du produit');
      }

      alert('Produit structuré uploadé avec succès !');
      setUploadForm({ title: '', description: '', assurance: '', category: '', file: null });
      loadProducts();
    } catch (error) {
      console.error('Erreur upload:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload du produit');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
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

  const getAssuranceColor = (assurance: string) => {
    switch (assurance.toLowerCase()) {
      case 'swisslife': return 'bg-blue-600';
      case 'cardif': return 'bg-orange-600';
      case 'abeille assurances': return 'bg-green-600';
      case 'axa': return 'bg-purple-600';
      case 'allianz': return 'bg-red-600';
      case 'generali': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    (acc[product.assurance] = acc[product.assurance] || []).push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Statistiques Générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Produits</p>
              <p className="text-3xl font-bold">{products.length}</p>
            </div>
            <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Assurances</p>
              <p className="text-3xl font-bold">{assurances.length}</p>
            </div>
            <svg className="w-8 h-8 text-green-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Catégories</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
            <svg className="w-8 h-8 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Taille Totale</p>
              <p className="text-3xl font-bold">
                {(products.reduce((acc, p) => acc + p.file_size, 0) / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
            <svg className="w-8 h-8 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Répartition par Assurance */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Répartition par Assurance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedProducts).map(([assurance, assuranceProducts]) => (
            <div key={assurance} className={`${getAssuranceColor(assurance)} rounded-lg p-4 text-white`}>
              <h4 className="font-bold text-lg">{assurance}</h4>
              <p className="text-sm opacity-90">{assuranceProducts.length} produits</p>
              <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${(assuranceProducts.length / products.length) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activité Récente */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Activité Récente</h3>
        <div className="space-y-4">
          {products.slice(0, 5).map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${getAssuranceColor(product.assurance)}`}></div>
                <div>
                  <p className="font-semibold text-gray-800">{product.title}</p>
                  <p className="text-sm text-gray-600">{product.assurance} • {product.category}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(product.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtres et Recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre ou description..."
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assurance</label>
            <select
              value={selectedAssurance}
              onChange={(e) => setSelectedAssurance(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les assurances</option>
              {assurances.map(ass => (
                <option key={ass} value={ass}>{ass}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Produits */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Produits Structurés ({products.length})</h3>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Chargement des produits...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Aucun produit trouvé.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedProducts).map(([assurance, assuranceProducts]) => (
              <div key={assurance} className="border border-gray-200 rounded-lg p-6">
                <h4 className={`text-xl font-bold text-white p-3 rounded-md mb-4 ${getAssuranceColor(assurance)}`}>
                  {assurance} ({assuranceProducts.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assuranceProducts.map(product => (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h5 className="font-semibold text-gray-800 mb-2">{product.title}</h5>
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                      <div className="text-xs text-gray-500 space-y-1 mb-4">
                        <p><strong>Catégorie:</strong> {product.category}</p>
                        <p><strong>Type:</strong> {product.file_type}</p>
                        <p><strong>Taille:</strong> {(product.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Date:</strong> {new Date(product.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`http://localhost:3001/${product.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-3 rounded-md text-sm font-medium transition-colors"
                        >
                          Télécharger
                        </a>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Upload Nouveau Produit Structuré</h3>
      <form onSubmit={handleFileUpload} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Nom du Produit <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={uploadForm.title}
              onChange={handleUploadChange}
              placeholder="Ex: Stratégie Patrimoine S Total Dividende"
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="assurance" className="block text-sm font-medium text-gray-700 mb-1">Assurance <span className="text-red-500">*</span></label>
            <select
              id="assurance"
              name="assurance"
              value={uploadForm.assurance}
              onChange={handleUploadChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Sélectionner une assurance</option>
              {assurances.map(ass => (
                <option key={ass} value={ass}>{ass}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description du Produit</label>
          <textarea
            id="description"
            name="description"
            value={uploadForm.description}
            onChange={handleUploadChange}
            rows={3}
            placeholder="Description détaillée du produit structuré..."
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie <span className="text-red-500">*</span></label>
            <select
              id="category"
              name="category"
              value={uploadForm.category}
              onChange={handleUploadChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">Fichier Produit <span className="text-red-500">*</span></label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-indigo-50 file:text-indigo-700
                         hover:file:bg-indigo-100"
              required
            />
            <p className="mt-2 text-xs text-gray-500">Types supportés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, GIF (Max: 10MB)</p>
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
            uploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
          disabled={uploading}
        >
          {uploading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 01-1-1V6a1 1 0 011-1h5.172a2 2 0 011.414.586l2.828 2.828a2 2 0 001.414.586H17a1 1 0 011 1v6a1 1 0 01-1 1H3zm5-2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {uploading ? 'Téléchargement...' : 'Uploader le Produit'}
        </button>
      </form>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Paramètres Administrateur</h3>
      
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations Système</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Environnement:</strong> Développement</p>
            </div>
            <div>
              <p><strong>Base de données:</strong> MySQL</p>
              <p><strong>API:</strong> Node.js/Express</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Statistiques de Stockage</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Espace utilisé:</span>
              <span className="font-semibold">{(products.reduce((acc, p) => acc + p.file_size, 0) / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Nombre de fichiers:</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Assurances actives:</span>
              <span className="font-semibold">{assurances.length}</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Actions Administrateur</h4>
          <div className="space-y-3">
            <button 
              onClick={loadProducts}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Actualiser les Données
            </button>
            <button 
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Se Déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Administrateur</h1>
                <p className="text-sm text-gray-600">Alliance Courtage - Gestion des Produits Structurés</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">Admin</p>
                <p className="text-xs text-gray-600">Administrateur</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'products', label: 'Produits', icon: '📁' },
              { id: 'upload', label: 'Upload', icon: '⬆️' },
              { id: 'settings', label: 'Paramètres', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default AdminDashboard;









