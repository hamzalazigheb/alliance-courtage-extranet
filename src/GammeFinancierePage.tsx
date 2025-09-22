import React, { useState, useEffect } from 'react';
import financialProducts from './financialProducts.json';

const GammeFinancierePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPEAOnly, setShowPEAOnly] = useState(false);
  const [showISROnly, setShowISROnly] = useState(false);

  // Combiner tous les produits
  const allProducts = [
    ...financialProducts.fondsEuro.map(p => ({ ...p, category: 'Fonds en Euro' })),
    ...financialProducts.opciSci.map(p => ({ ...p, category: 'OPCI/SCI' })),
    ...financialProducts.unitesCompte.map(p => ({ ...p, category: 'Unités de Compte' }))
  ];

  // Filtrer les produits
  const getFilteredProducts = () => {
    let filtered = allProducts;

    // Filtre par catégorie
    if (selectedCategory !== 'tous') {
      const categoryMap = {
        'fonds-euro': 'Fonds en Euro',
        'opci-sci': 'OPCI/SCI',
        'unites-compte': 'Unités de Compte'
      };
      filtered = filtered.filter(p => p.category === categoryMap[selectedCategory]);
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.gestionnaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.isin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre PEA
    if (showPEAOnly) {
      filtered = filtered.filter(p => p.pea);
    }

    // Filtre ISR
    if (showISROnly) {
      filtered = filtered.filter(p => p.isr);
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'nom':
          aVal = a.nom;
          bVal = b.nom;
          break;
        case 'performance':
          aVal = parseFloat(a.performances.cumul2017.replace('%', '').replace(',', '.'));
          bVal = parseFloat(b.performances.cumul2017.replace('%', '').replace(',', '.'));
          break;
        case 'frais':
          aVal = parseFloat(a.frais.replace('%', '').replace(',', '.'));
          bVal = parseFloat(b.frais.replace('%', '').replace(',', '.'));
          break;
        case 'volatilite':
          aVal = parseFloat(a.volatilite3ans.replace('%', '').replace(',', '.'));
          bVal = parseFloat(b.volatilite3ans.replace('%', '').replace(',', '.'));
          break;
        default:
          aVal = a.nom;
          bVal = b.nom;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const getPerformanceColor = (performance) => {
    const value = parseFloat(performance.replace('%', '').replace(',', '.'));
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceBgColor = (performance) => {
    const value = parseFloat(performance.replace('%', '').replace(',', '.'));
    if (value > 0) return 'bg-green-50 border-green-200';
    if (value < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Gamme Financière</h1>
        <p className="text-gray-600 text-lg">
          Découvrez notre sélection de supports financiers recommandés pour vos investissements
        </p>
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Nom, ISIN, Gestionnaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="tous">Toutes les catégories</option>
              <option value="fonds-euro">Fonds en Euro</option>
              <option value="opci-sci">OPCI/SCI</option>
              <option value="unites-compte">Unités de Compte</option>
            </select>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="nom">Nom</option>
              <option value="performance">Performance</option>
              <option value="frais">Frais</option>
              <option value="volatilite">Volatilité</option>
            </select>
          </div>

          {/* Ordre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>

        {/* Filtres supplémentaires */}
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showPEAOnly}
              onChange={(e) => setShowPEAOnly(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Éligible PEA uniquement</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showISROnly}
              onChange={(e) => setShowISROnly(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">ISR/ESG uniquement</span>
          </label>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{filteredProducts.length}</div>
            <div className="text-sm text-gray-600">Produits trouvés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredProducts.filter(p => p.category === 'Fonds en Euro').length}
            </div>
            <div className="text-sm text-gray-600">Fonds en Euro</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredProducts.filter(p => p.category === 'OPCI/SCI').length}
            </div>
            <div className="text-sm text-gray-600">OPCI/SCI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredProducts.filter(p => p.category === 'Unités de Compte').length}
            </div>
            <div className="text-sm text-gray-600">Unités de Compte</div>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{product.nom}</h3>
                    {product.pea && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        PEA
                      </span>
                    )}
                    {product.isr && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        ISR
                      </span>
                    )}
                    {product.esg > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        ESG {product.esg}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">{product.gestionnaire}</p>
                  {product.isin && (
                    <p className="text-sm text-gray-500">ISIN: {product.isin}</p>
                  )}
                </div>
                <div className="mt-4 lg:mt-0 lg:ml-6">
                  <div className={`px-4 py-2 rounded-lg border ${getPerformanceBgColor(product.performances.cumul2017)}`}>
                    <div className="text-sm text-gray-600">Performance cumulée depuis 2017</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(product.performances.cumul2017)}`}>
                      {product.performances.cumul2017}
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails des performances */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">2024</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2024'])}`}>
                    {product.performances['2024']}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">2023</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2023'])}`}>
                    {product.performances['2023']}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">2022</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2022'])}`}>
                    {product.performances['2022']}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">2021</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2021'])}`}>
                    {product.performances['2021']}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">2020</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2020'])}`}>
                    {product.performances['2020']}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">2019</div>
                  <div className={`font-semibold ${getPerformanceColor(product.performances['2019'])}`}>
                    {product.performances['2019']}
                  </div>
                </div>
              </div>

              {/* Informations complémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Frais de gestion</div>
                  <div className="font-semibold text-gray-800">{product.frais}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Volatilité 3 ans</div>
                  <div className="font-semibold text-gray-800">{product.volatilite3ans}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Volatilité 5 ans</div>
                  <div className="font-semibold text-gray-800">{product.volatilite5ans}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <div className="text-gray-500 text-lg">Aucun produit trouvé avec ces critères</div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('tous');
              setShowPEAOnly(false);
              setShowISROnly(false);
            }}
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

export default GammeFinancierePage;
