import React, { useState, useEffect } from 'react';
import { archivesAPI, buildAPIURL } from './api';

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

function FileManagementPage() {
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<{id: number, category: string} | null>(null);
  const [updatingCategory, setUpdatingCategory] = useState<number | null>(null);

  // État du formulaire d'upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    year: new Date().getFullYear(),
    file: null as File | null
  });

  // Charger les fichiers et catégories au montage du composant
  useEffect(() => {
    loadFiles();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categories = await archivesAPI.getCategories();
      // Ajouter des catégories par défaut si elles n'existent pas
      const defaultCategories = ['Bordereaux 2024', 'Protocoles', 'Conventions', 'Général', 'Non classé'];
      const allCategories = [...new Set([...defaultCategories, ...categories])];
      setAvailableCategories(allCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      // Catégories par défaut en cas d'erreur
      setAvailableCategories(['Bordereaux 2024', 'Protocoles', 'Conventions', 'Général', 'Non classé']);
    }
  };

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
      formData.append('category', uploadForm.category);
      formData.append('year', uploadForm.year.toString());

      // Appel à l'API d'upload
      const response = await fetch(buildAPIURL('/archives'), {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur serveur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      // Réinitialiser le formulaire
      setUploadForm({
        title: '',
        description: '',
        category: '',
        year: new Date().getFullYear(),
        file: null
      });
      setShowUploadForm(false);
      
      // Recharger la liste des fichiers
      loadFiles();
      
      alert('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload du fichier';
      alert(`❌ ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      await archivesAPI.delete(id);
      loadFiles();
      alert('Fichier supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du fichier');
    }
  };

  const handleUpdateCategory = async (id: number, category: string) => {
    try {
      setUpdatingCategory(id);
      await archivesAPI.updateCategory(id, category);
      // Mettre à jour localement
      setFiles(files.map(f => f.id === id ? { ...f, category } : f));
      setEditingCategory(null);
      alert('Catégorie mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur mise à jour catégorie:', error);
      alert('Erreur lors de la mise à jour de la catégorie');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const handleDownload = (file: ArchiveFile) => {
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
    } else if (file.file_path) {
      // Fallback pour les anciens fichiers
      const url = file.file_path.startsWith('http') 
        ? file.file_path 
        : buildAPIURL(file.file_path);
      window.open(url, '_blank');
    } else {
      // Utiliser l'endpoint de téléchargement
      const downloadUrl = buildAPIURL(`/archives/${file.id}/download`);
      window.open(downloadUrl, '_blank');
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

  const years = [...new Set(files.map(f => f.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* En-tête de la page */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Gestion des Archives</h1>
            <p className="text-gray-600 text-lg">
              Gérez et organisez vos documents et fichiers
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nouveau fichier</span>
          </button>
        </div>
      </div>

      {/* Formulaire d'upload */}
      {showUploadForm && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploader un nouveau fichier</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre du fichier</label>
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
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fichier</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 disabled:opacity-50"
              >
                {uploading ? 'Upload en cours...' : 'Uploader'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un fichier..."
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
              {availableCategories.map(cat => (
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
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des fichiers */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📁 Fichiers ({filteredFiles.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des fichiers...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun fichier trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-2xl">{getFileIcon(file.file_type)}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{file.title}</h3>
                    <p className="text-sm text-gray-600">{file.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <span>📁</span>
                        {editingCategory?.id === file.id ? (
                          <div className="flex items-center space-x-1">
                            <select
                              value={editingCategory.category}
                              onChange={(e) => setEditingCategory({...editingCategory, category: e.target.value})}
                              className="border rounded px-2 py-1 text-xs"
                              disabled={updatingCategory === file.id}
                            >
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleUpdateCategory(file.id, editingCategory.category)}
                              disabled={updatingCategory === file.id}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              disabled={updatingCategory === file.id}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                              title="Annuler"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span>{file.category || 'Non classé'}</span>
                            <button
                              onClick={() => setEditingCategory({id: file.id, category: file.category || 'Non classé'})}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                              title="Modifier la catégorie"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                      {file.year && <span>📅 {file.year}</span>}
                      <span>💾 {formatFileSize(file.file_size)}</span>
                      <span>👤 {file.uploaded_by_prenom} {file.uploaded_by_nom}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Télécharger
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Supprimer
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

export default FileManagementPage;






