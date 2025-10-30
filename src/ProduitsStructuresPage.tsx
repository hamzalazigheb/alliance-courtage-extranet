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

const ProduitsStructuresPageComponent: React.FC = () => {
  const [products, setProducts] = useState<StructuredProduct[]>([]);
  const [assurances, setAssurances] = useState<string[]>([]);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProducts();
    loadAssurances();
  }, [selectedAssurance]);

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
      const response = await structuredProductsAPI.getAssurances();
      setAssurances(response);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
    }
  };

  const getAssuranceColor = (assurance: string) => {
    switch (assurance.toLowerCase()) {
      case 'swisslife': return 'from-blue-500 to-blue-600';
      case 'cardif': return 'from-orange-500 to-orange-600';
      case 'abeille assurances': return 'from-green-500 to-green-600';
      case 'axa': return 'from-purple-500 to-purple-600';
      case 'allianz': return 'from-red-500 to-red-600';
      case 'generali': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getAssuranceIcon = (assurance: string) => {
    switch (assurance.toLowerCase()) {
      case 'swisslife': return '🏢';
      case 'cardif': return '🛡️';
      case 'abeille assurances': return '🐝';
      case 'axa': return '🔷';
      case 'allianz': return '⚡';
      case 'generali': return '🌟';
      default: return '📄';
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    (acc[product.assurance] = acc[product.assurance] || []).push(product);
    return acc;
  }, {} as Record<string, StructuredProduct[]>);

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
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-slate-800 to-blue-700 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Produits Structurés</h1>
              <p className="text-blue-100">Consultez tous les produits structurés par assurance</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-blue-100">Total Produits</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filtrer par Assurance
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedAssurance('')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedAssurance === ''
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Toutes les Assurances ({products.length})
          </button>
          {assurances.map(assurance => {
            const assuranceProducts = groupedProducts[assurance] || [];
            return (
              <button
                key={assurance}
                onClick={() => setSelectedAssurance(assurance)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                  selectedAssurance === assurance
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="mr-2">{getAssuranceIcon(assurance)}</span>
                {assurance} ({assuranceProducts.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des Produits */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des produits structurés...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
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
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([assurance, assuranceProducts]) => (
            <div key={assurance} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header Assurance */}
              <div className={`bg-gradient-to-r ${getAssuranceColor(assurance)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getAssuranceIcon(assurance)}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{assurance}</h2>
                      <p className="text-white/80">{assuranceProducts.length} produit{assuranceProducts.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-sm text-white/80">Espace utilisé</p>
                      <p className="text-lg font-semibold">
                        {formatFileSize(assuranceProducts.reduce((acc, p) => acc + p.file_size, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des Produits */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assuranceProducts.map(product => (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                      {/* Header Produit */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getFileIcon(product.file_type)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{product.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatFileSize(product.file_size)}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <a
                          href={`http://localhost:3001/${product.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Télécharger
                        </a>
                        <button
                          onClick={() => {
                            // Ouvrir le fichier dans un nouvel onglet
                            window.open(`http://localhost:3001/${product.file_path}`, '_blank');
                          }}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer avec Statistiques */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistiques Globales</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            <p className="text-sm text-gray-600">Total Produits</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{assurances.length}</p>
            <p className="text-sm text-gray-600">Assurances</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {formatFileSize(products.reduce((acc, p) => acc + p.file_size, 0))}
            </p>
            <p className="text-sm text-gray-600">Espace Total</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {products.length > 0 ? Math.round(products.reduce((acc, p) => acc + p.file_size, 0) / products.length / 1024) : 0} KB
            </p>
            <p className="text-sm text-gray-600">Taille Moyenne</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduitsStructuresPageComponent;
