import React, { useState, useEffect } from 'react';
import financialProducts from './financialProducts.json';
import { financialDocumentsAPI } from './api';

const GammeFinancierePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPEAOnly, setShowPEAOnly] = useState(false);
  const [showISROnly, setShowISROnly] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState('');

  // Combiner tous les produits
  const allProducts = [
    ...financialProducts.fondsEuro.map(p => ({ ...p, category: 'Fonds en Euro' })),
    ...financialProducts.opciSci.map(p => ({ ...p, category: 'OPCI/SCI' })),
    ...financialProducts.unitesCompte.map(p => ({ ...p, category: 'UnitÃ©s de Compte' }))
  ];

  // Filtrer les produits
  const getFilteredProducts = () => {
    let filtered = allProducts;

    // Filtre par catÃ©gorie
    if (selectedCategory !== 'tous') {
      const categoryMap = {
        'fonds-euro': 'Fonds en Euro',
        'opci-sci': 'OPCI/SCI',
        'unites-compte': 'UnitÃ©s de Compte'
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

  // Load documents from database
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const params: any = {};
        const data = await financialDocumentsAPI.getAll(params);
        setDocuments(data);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, []);

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Gamme Financière</h1>
        <p className="text-gray-600">
          Tableau synthÃ©tique de nos supports financiers recommandÃ©s
        </p>
      </div>

      {/* Filtres compacts */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* CatÃ©gorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="tous">Toutes catÃ©gories</option>
            <option value="fonds-euro">Fonds Euro</option>
            <option value="opci-sci">OPCI/SCI</option>
            <option value="unites-compte">UnitÃ©s de Compte</option>
          </select>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="nom">Nom</option>
            <option value="performance">Performance</option>
            <option value="frais">Frais</option>
            <option value="volatilite">VolatilitÃ©</option>
          </select>

          {/* Ordre */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="asc">â†‘</option>
            <option value="desc">â†“</option>
          </select>

          {/* Filtres rapides */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showPEAOnly}
                onChange={(e) => setShowPEAOnly(e.target.checked)}
                className="mr-1"
              />
              <span className="text-gray-700">PEA</span>
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showISROnly}
                onChange={(e) => setShowISROnly(e.target.checked)}
                className="mr-1"
              />
              <span className="text-gray-700">ISR</span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistiques compactes */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">{filteredProducts.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {filteredProducts.filter(p => p.category === 'Fonds en Euro').length}
              </div>
              <div className="text-xs text-gray-600">Fonds Euro</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {filteredProducts.filter(p => p.category === 'OPCI/SCI').length}
              </div>
              <div className="text-xs text-gray-600">OPCI/SCI</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {filteredProducts.filter(p => p.category === 'UnitÃ©s de Compte').length}
              </div>
              <div className="text-xs text-gray-600">UC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau synthÃ©tique */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestionnaire</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CatÃ©gorie</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performance 2024</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performance CumulÃ©e</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Frais</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">VolatilitÃ© 3 ans</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Labels</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.nom}</div>
                    {product.isin && (
                      <div className="text-xs text-gray-500">ISIN: {product.isin}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.gestionnaire}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.category === 'Fonds en Euro' ? 'bg-green-100 text-green-800' :
                      product.category === 'OPCI/SCI' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {product.category === 'Fonds en Euro' ? 'Fonds Euro' :
                       product.category === 'OPCI/SCI' ? 'OPCI/SCI' : 'UC'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-medium ${getPerformanceColor(product.performances['2024'])}`}>
                      {product.performances['2024']}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-medium ${getPerformanceColor(product.performances.cumul2017)}`}>
                      {product.performances.cumul2017}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{product.frais}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{product.volatilite3ans}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-1">
                      {product.pea && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          PEA
                        </span>
                      )}
                      {product.isr && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          ISR
                        </span>
                      )}
                      {product.esg > 0 && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          ESG {product.esg}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <div className="text-gray-500 text-lg">Aucun produit trouvÃ© avec ces critÃ¨res</div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('tous');
              setShowPEAOnly(false);
              setShowISROnly(false);
            }}
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            RÃ©initialiser les filtres
          </button>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">ðŸ“„</span>
          Documents Financiers
        </h2>
        
        <div className="mb-4">
          <select
            value={selectedDocCategory}
            onChange={(e) => setSelectedDocCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Toutes catÃ©gories</option>
            <option value="Fonds Euro">Fonds Euro</option>
            <option value="OPCI/SCI">OPCI/SCI</option>
            <option value="UnitÃ©s de Compte">UnitÃ©s de Compte</option>
            <option value="Produits StructurÃ©s">Produits StructurÃ©s</option>
          </select>
        </div>

        {loadingDocuments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            Aucun document disponible
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(doc => !selectedDocCategory || doc.category === selectedDocCategory)
              .map((doc) => (
              <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">ðŸ“„</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{doc.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <span>ðŸ“ {doc.category}</span>
                      <span>ðŸ“… {doc.year}</span>
                    </div>
                    <a
                      href={`http://localhost:3001${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 transition-colors"
                    >
                      TÃ©lÃ©charger
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GammeFinancierePage;
