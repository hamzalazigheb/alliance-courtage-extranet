import React, { useState, useEffect } from 'react';
import { favorisAPI, buildAPIURL, buildFileURL } from './api';

interface Favori {
  id: number;
  item_type: string;
  item_id: number;
  title: string;
  description: string;
  url: string;
  metadata: string | null;
  created_at: string;
}

const FavorisPage: React.FC = () => {
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'document' | 'product' | 'archive'>('all');

  useEffect(() => {
    loadFavoris();
  }, [filter]);

  const loadFavoris = async () => {
    try {
      setLoading(true);
      const type = filter === 'all' ? null : filter;
      const data = await favorisAPI.getAll(type);
      setFavoris(data);
    } catch (error) {
      console.error('Error loading favoris:', error);
      alert('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet élément de vos favoris ?')) {
      return;
    }

    try {
      await favorisAPI.remove(id);
      loadFavoris();
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Erreur lors de la suppression du favori');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'financial_document':
        return '📄';
      case 'product':
      case 'structured_product':
        return '📦';
      case 'archive':
        return '📁';
      case 'meeting':
        return '🤝';
      default:
        return '⭐';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document':
      case 'financial_document':
        return 'Document';
      case 'product':
      case 'structured_product':
        return 'Produit';
      case 'archive':
        return 'Archive';
      case 'meeting':
        return 'Rencontre';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document':
      case 'financial_document':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'product':
      case 'structured_product':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'archive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenFavorite = (favori: Favori) => {
    if (favori.url) {
      if (favori.url.startsWith('http')) {
        window.open(favori.url, '_blank');
      } else {
        window.location.hash = favori.url;
      }
    }
  };

  const groupedFavoris = favoris.reduce((acc, favori) => {
    const type = favori.item_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(favori);
    return acc;
  }, {} as Record<string, Favori[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="p-6 sm:p-8 text-white bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mes Favoris</h1>
                  <p className="text-white/80">
                    Accédez rapidement à vos contenus favoris
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({favoris.length})
            </button>
            <button
              onClick={() => setFilter('document')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'document'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 Documents ({favoris.filter(f => f.item_type.includes('document')).length})
            </button>
            <button
              onClick={() => setFilter('product')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'product'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Produits ({favoris.filter(f => f.item_type.includes('product')).length})
            </button>
            <button
              onClick={() => setFilter('archive')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'archive'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📁 Archives ({favoris.filter(f => f.item_type === 'archive').length})
            </button>
          </div>
        </div>

        {/* Favoris List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-[#1D4ED8] mx-auto"></div>
            <p className="text-gray-600 mt-6 text-base font-medium">Chargement des favoris...</p>
          </div>
        ) : favoris.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-gray-600 text-base font-medium">
              Aucun favori pour le moment
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Ajoutez des éléments à vos favoris en cliquant sur l'icône ⭐
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFavoris).map(([type, items]) => (
              <div key={type} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">{getTypeIcon(type)}</span>
                  {getTypeLabel(type)} ({items.length})
                </h2>
                <div className="space-y-3">
                  {items.map((favori) => (
                    <div
                      key={favori.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getTypeColor(type)}`}>
                          {getTypeIcon(type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{favori.title}</h3>
                          {favori.description && (
                            <p className="text-sm text-gray-600 mb-1">{favori.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded ${getTypeColor(type)}`}>
                              {getTypeLabel(type)}
                            </span>
                            <span>Ajouté le {formatDate(favori.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {favori.url && (
                          <button
                            onClick={() => handleOpenFavorite(favori)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium"
                          >
                            Ouvrir
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFavorite(favori.id)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Retirer des favoris"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
};

export default FavorisPage;

