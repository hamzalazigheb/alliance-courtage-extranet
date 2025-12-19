import React, { useState, useEffect } from 'react';
import { financialDocumentsAPI, buildAPIURL } from './api';
import { DocumentIcon, UploadIcon, EditIcon } from './components/NavIcons';
import { useAlert } from './contexts/AlertContext';

// Additional icons
const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

interface FinancialDocument {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  subcategory: string;
  year: number;
  uploaded_by_nom: string;
  uploaded_by_prenom: string;
  fileUrl?: string;
  hasFileContent?: boolean;
}

function FinancialDocumentsPage() {
  const { showSuccess, showError, showWarning } = useAlert();
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    year: new Date().getFullYear(),
    file: null as File | null
  });

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, selectedSubcategory, selectedYear]);

  // Recharger les documents quand la recherche change
  useEffect(() => {
    // Le filtrage se fait côté client pour searchTerm, pas besoin de recharger
  }, [searchTerm]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (selectedYear) params.year = selectedYear;

      const response = await financialDocumentsAPI.getAll(params);
      setDocuments(response);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      showWarning('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('subcategory', uploadForm.subcategory);
      formData.append('year', uploadForm.year.toString());

      const response = await fetch(buildAPIURL('/financial-documents'), {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors de l\'upload' }));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      setUploadForm({
        title: '',
        description: '',
        category: '',
        subcategory: '',
        year: new Date().getFullYear(),
        file: null
      });
      setShowUploadForm(false);
      loadDocuments();
      showSuccess('Document uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      showError('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await financialDocumentsAPI.delete(id);
      loadDocuments();
      showSuccess('Document supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showError('Erreur lors de la suppression du document');
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
    const iconClass = 'w-8 h-8';
    if (fileType.includes('pdf')) {
      return (
        <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className={`${iconClass} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];
  const subcategories = [...new Set(documents.map(d => d.subcategory).filter(Boolean))];
  const years = [...new Set(documents.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Documents Financiers</h1>
            <p className="text-gray-600 text-sm">
              Gérez les documents pour la gamme financière
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
          >
            <UploadIcon className="w-5 h-5" />
            <span>Nouveau document</span>
          </button>
        </div>
      </div>

      {/* Formulaire d'upload - Premium Style */}
      {showUploadForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UploadIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Uploader un nouveau document</h2>
          </div>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Fonds Euro">Fonds Euro</option>
                  <option value="OPCI/SCI">OPCI/SCI</option>
                  <option value="Unités de Compte">Unités de Compte</option>
                  <option value="Produits Structurés">Produits Structurés</option>
                  <option value="Documents Réglementaires">Documents Réglementaires</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
                <input
                  type="text"
                  value={uploadForm.subcategory}
                  onChange={(e) => setUploadForm({...uploadForm, subcategory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: FICP, FCP, SICAV..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                <input
                  type="number"
                  value={uploadForm.year}
                  onChange={(e) => setUploadForm({...uploadForm, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2020"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fichier</label>
              <input
                type="file"
                onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium border border-gray-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Upload en cours...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    <span>Uploader</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs - Premium Style */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide py-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`
                  relative flex items-center space-x-2 px-4 py-2.5 
                  font-medium text-sm transition-all duration-200 ease-in-out
                  whitespace-nowrap rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${!selectedCategory
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {/* Left indicator bar */}
                {!selectedCategory && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                    aria-hidden="true"
                  />
                )}
                <span className="font-medium">Toutes</span>
              </button>
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      relative flex items-center space-x-2 px-4 py-2.5 
                      font-medium text-sm transition-all duration-200 ease-in-out
                      whitespace-nowrap rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* Left indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-medium">{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDocuments}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium border border-gray-300"
            >
              <RefreshIcon className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des documents - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <DocumentIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">Aucun document trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Commencez par ajouter votre premier document</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">{doc.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 flex-wrap gap-y-1">
                      <div className="flex items-center space-x-1.5">
                        <FolderIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{doc.category}</span>
                      </div>
                      {doc.subcategory && (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-400">•</span>
                          <span>Type: {doc.subcategory}</span>
                        </div>
                      )}
                      {doc.year && (
                        <div className="flex items-center space-x-1.5">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span>{doc.year}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
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
                            apiPath = urlObj.pathname; // Ex: /api/financial-documents/1/download
                            // Retirer /api si présent pour que buildAPIURL puisse l'ajouter
                            if (apiPath.startsWith('/api/')) {
                              apiPath = apiPath.replace('/api', ''); // Ex: /financial-documents/1/download
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
                            showError('Erreur lors du téléchargement: ' + errorText);
                          }
                        } catch (error) {
                          console.error('Error downloading:', error);
                          showError('Erreur lors du téléchargement: ' + (error as Error).message);
                        }
                      } else if (doc.file_path && doc.file_path.trim() !== '') {
                        // Fallback pour les anciens fichiers (file_path)
                        const downloadUrl = doc.file_path.startsWith('http') 
                          ? doc.file_path 
                          : `http://localhost:3001${doc.file_path}`;
                        window.open(downloadUrl, '_blank');
                      } else {
                        showError('Erreur: Aucune URL de fichier disponible');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 font-medium shadow-sm hover:shadow"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => handleFileDelete(doc.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 font-medium shadow-sm hover:shadow"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialDocumentsPage;



