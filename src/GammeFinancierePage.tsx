import React, { useState, useEffect } from 'react';
import { financialDocumentsAPI, buildAPIURL } from './api';
import FavoriteButton from './components/FavoriteButton';

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
  headerImage: string;
}

const GammeFinancierePage = () => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState('');
  const [pageContent, setPageContent] = useState<PageContent>({
    title: 'Gamme Financière',
    subtitle: 'Documents et supports financiers recommandés',
    description: '',
    headerImage: ''
  });

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
    loadContent();
  }, []);

  // Load CMS content
  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/gamme-financiere'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          try {
            let parsedContent = data.content;
            
            // Si c'est une string, parser une première fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // Si le résultat est encore une string, parser une deuxième fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // S'assurer que les propriétés existent
            setPageContent({
              title: parsedContent.title || 'Gamme Financière',
              subtitle: parsedContent.subtitle || 'Découvrez notre sélection de produits financiers',
              description: parsedContent.description || '',
              headerImage: parsedContent.headerImage || ''
            });
          } catch (parseError) {
            // Silencieusement utiliser les valeurs par défaut si le JSON est corrompu
            // Ne pas logger l'erreur pour éviter le spam dans la console
            setPageContent({
              title: 'Gamme Financière',
              subtitle: 'Découvrez notre sélection de produits financiers',
              description: '',
              headerImage: ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
      // En cas d'erreur, utiliser les valeurs par défaut
      setPageContent({
        title: 'Gamme Financière',
        subtitle: 'Découvrez notre sélection de produits financiers',
        description: '',
        headerImage: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header - Following project's graphic charter */}
        <div className="mb-8">
          <div 
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20 relative"
            style={pageContent.headerImage ? {
              backgroundImage: `url(${pageContent.headerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '300px'
            } : {}}
          >
            {/* Overlay très léger seulement pour améliorer la lisibilité du texte */}
            {pageContent.headerImage && (
              <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
            )}
            
            {/* Contenu */}
            <div className={`relative z-10 p-6 sm:p-8 ${pageContent.headerImage ? '' : 'bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]'}`}>
              <div className={pageContent.headerImage ? 'bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg' : ''}>
                <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${pageContent.headerImage ? 'text-white drop-shadow-lg' : 'text-white'}`}>
                  {pageContent.title}
                </h1>
                <p className={`${pageContent.headerImage ? 'text-white drop-shadow-md' : 'text-white/80'}`}>
                  {pageContent.subtitle}
                </p>
                {pageContent.description && (
                  <p className={`mt-2 text-sm ${pageContent.headerImage ? 'text-white drop-shadow-md' : 'text-white/70'}`}>
                    {pageContent.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section - Following project's graphic charter */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                  Documents Financiers
                </h2>
                <p className="text-sm text-gray-600">
                  Accédez à tous nos documents et supports
                </p>
              </div>
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedDocCategory}
                onChange={(e) => setSelectedDocCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 focus:outline-none transition-all shadow-sm hover:shadow-md cursor-pointer min-w-[180px]"
              >
                <option value="">Toutes catégories</option>
                <option value="Fonds Euro">Fonds Euro</option>
                <option value="OPCI/SCI">OPCI/SCI</option>
                <option value="Unités de Compte">Unités de Compte</option>
                <option value="Produits Structurés">Produits Structurés</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {loadingDocuments ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-[#1D4ED8] mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">📄</span>
        </div>
      </div>
              <p className="text-gray-600 mt-6 text-base font-medium">Chargement des documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <p className="text-gray-600 text-base font-medium">Aucun document disponible</p>
              <p className="text-gray-500 text-sm mt-2">Veuillez réessayer plus tard</p>
                    </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents
                .filter((doc: any) => !selectedDocCategory || doc.category === selectedDocCategory)
                .map((doc: any) => (
                <div 
                  key={doc.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/30 hover:border-[#1D4ED8]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-xl">📄</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 hover:text-[#1D4ED8] transition-colors">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {doc.category && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {doc.category}
                        </span>
                      )}
                        {doc.year && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {doc.year}
                        </span>
                      )}
      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <FavoriteButton
                          itemType="financial_document"
                          itemId={doc.id}
                          title={doc.title}
                          description={doc.description || ''}
                          url={`#gamme-financiere`}
                          metadata={{ category: doc.category, year: doc.year }}
                          className="flex-shrink-0"
                        />
                        <button
                          onClick={async () => {
                          // Si fileUrl existe et pointe vers /download, utiliser l'API
                          if (doc.fileUrl && doc.fileUrl.includes('/api/financial-documents/') && doc.fileUrl.includes('/download')) {
                            try {
                              const token = localStorage.getItem('token');
                              let apiPath: string;
                              
                              // Extraire le chemin de l'URL complète
                              if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
                                const urlObj = new URL(doc.fileUrl);
                                apiPath = urlObj.pathname;
                                if (apiPath.startsWith('/api/')) {
                                  apiPath = apiPath.replace('/api', '');
                                }
                              } else {
                                apiPath = doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`;
                                if (apiPath.startsWith('/api/')) {
                                  apiPath = apiPath.replace('/api', '');
                                }
                              }
                              
                              const apiUrl = buildAPIURL(apiPath);
                              const response = await fetch(apiUrl, {
                                headers: { 'x-auth-token': token || '' }
                              });
                              
                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.title || 'document.pdf';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              } else {
                                const errorText = await response.text();
                                alert('Erreur lors du téléchargement: ' + errorText);
                              }
                            } catch (error) {
                              console.error('Error downloading:', error);
                              alert('Erreur lors du téléchargement: ' + (error as Error).message);
                            }
                          } else if (doc.file_path && doc.file_path.trim() !== '') {
                            // Fallback pour les anciens fichiers (file_path)
                            const downloadUrl = doc.file_path.startsWith('http') 
                              ? doc.file_path 
                              : `http://localhost:3001${doc.file_path}`;
                            window.open(downloadUrl, '_blank');
                          } else {
                            alert('Erreur: Aucune URL de fichier disponible');
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Télécharger
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default GammeFinancierePage;
