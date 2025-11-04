import React, { useState, useEffect } from 'react';
import { archivesAPI, buildAPIURL } from './api';
import FavoriteButton from './components/FavoriteButton';

interface ArchiveFile {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  year: number;
  created_at: string;
  uploaded_by_nom: string;
  uploaded_by_prenom: string;
  fileUrl?: string;
  hasFileContent?: boolean;
}

function NosArchivesPage() {
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les fichiers au montage du composant
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedYear) params.year = selectedYear;
      if (searchTerm) params.search = searchTerm;

      const response = await archivesAPI.getAll(params);
      setFiles(response);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      alert('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || file.category === selectedCategory;
    const matchesYear = !selectedYear || file.year.toString() === selectedYear;
    
    return matchesSearch && matchesCategory && matchesYear;
  });

  const categories = [...new Set(files.map(f => f.category).filter(Boolean))];
  const years = [...new Set(files.map(f => f.year).filter(Boolean))].sort((a, b) => b - a);

  // Grouper les fichiers par catégorie
  const filesByCategory = filteredFiles.reduce((acc, file) => {
    const category = file.category || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, ArchiveFile[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* En-tête de la page */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Nos Archives</h1>
        <p className="text-gray-600 text-lg">
          Consultez nos archives et documents historiques
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Rechercher dans les archives</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadFiles}
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

      {/* Archives organisées par catégorie */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📁 Archives et Documents ({filteredFiles.length} fichiers)
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des archives...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-600 text-lg">Aucun document trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Les documents apparaîtront ici une fois uploadés</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filesByCategory).map(([category, categoryFiles]) => (
              <div key={category} className="space-y-3">
                {/* En-tête de catégorie */}
                <div className="flex items-center space-x-2 text-gray-700 bg-gray-100 rounded-lg p-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="font-medium text-lg">📂 {category}</span>
                  <span className="text-sm text-gray-500 ml-auto">{categoryFiles.length} fichier{categoryFiles.length > 1 ? 's' : ''}</span>
                </div>
                
                {/* Fichiers de la catégorie */}
                <div className="ml-6 space-y-2">
                  {categoryFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{getFileIcon(file.file_type)}</div>
                        <div>
                          <h3 className="font-medium text-gray-800">{file.title}</h3>
                          {file.description && (
                            <p className="text-sm text-gray-600">{file.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>📅 {file.year}</span>
                            <span>💾 {formatFileSize(file.file_size)}</span>
                            <span>👤 {file.uploaded_by_prenom} {file.uploaded_by_nom}</span>
                            <span>🕒 {new Date(file.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FavoriteButton
                          itemType="archive"
                          itemId={file.id}
                          title={file.title}
                          description={file.description || ''}
                          url={`#nos-archives`}
                          metadata={{ category: file.category, year: file.year }}
                          className="flex-shrink-0"
                        />
                        <button
                          onClick={async () => {
                            // Si fileUrl existe et pointe vers /download, utiliser l'API
                            if (file.fileUrl && file.fileUrl.includes('/api/archives/') && file.fileUrl.includes('/download')) {
                              try {
                                const token = localStorage.getItem('token');
                                let apiPath: string;
                                
                                // Extraire le chemin de l'URL complète
                                if (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://')) {
                                  const urlObj = new URL(file.fileUrl);
                                  apiPath = urlObj.pathname; // Ex: /api/archives/1/download
                                  // Retirer /api si présent pour que buildAPIURL puisse l'ajouter
                                  if (apiPath.startsWith('/api/')) {
                                    apiPath = apiPath.replace('/api', ''); // Ex: /archives/1/download
                                  }
                                } else {
                                  apiPath = file.fileUrl.startsWith('/') ? file.fileUrl : `/${file.fileUrl}`;
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
                                  a.download = file.title || 'archive.pdf';
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
                            } else if (file.file_path && file.file_path.trim() !== '') {
                              // Fallback pour les anciens fichiers (file_path)
                              const downloadUrl = file.file_path.startsWith('http') 
                                ? file.file_path 
                                : `http://localhost:3001${file.file_path}`;
                              window.open(downloadUrl, '_blank');
                            } else {
                              alert('Erreur: Aucune URL de fichier disponible');
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white text-sm rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Télécharger</span>
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

      {/* Bouton de téléchargement global */}
      {filteredFiles.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="text-center">
            <button className="w-full bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white py-3 px-6 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Télécharger tous les documents ({filteredFiles.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NosArchivesPage;






