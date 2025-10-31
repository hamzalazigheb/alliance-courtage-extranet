import React, { useState, useEffect } from 'react';
import { archivesAPI } from './api';

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
}

function FileManagePage() {
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // État du formulaire d'upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    year: new Date().getFullYear(),
    file: null as File | null
  });

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
      const response = await fetch('http://localhost:3001/api/archives', {
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
        category: '',
        year: new Date().getFullYear(),
        file: null
      });
      
      // Recharger la liste des fichiers
      loadFiles();
      
      alert('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* En-tête de la page */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Gestion des Fichiers</h1>
        <p className="text-gray-600 text-lg">
          Upload et gérez vos documents et fichiers
        </p>
      </div>

      {/* Formulaire d'upload */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📤 Uploader un nouveau fichier</h2>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre du fichier *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Rapport mensuel Janvier 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="Actualités">Actualités</option>
                <option value="Produits">Produits</option>
                <option value="Rapports">Rapports</option>
                <option value="Formation">Formation</option>
                <option value="Réglementaire">Réglementaire</option>
                <option value="Marketing">Marketing</option>
                <option value="Administratif">Administratif</option>
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
              placeholder="Description détaillée du fichier..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année *</label>
              <input
                type="number"
                value={uploadForm.year}
                onChange={(e) => setUploadForm({...uploadForm, year: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="2020"
                max={new Date().getFullYear()}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fichier *</label>
              <input
                type="file"
                onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Types supportés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF (Max: 10MB)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-gradient-to-r from-slate-800 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-slate-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Uploader le fichier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtres et recherche</h2>
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

      {/* Liste des fichiers uploadés */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📁 Fichiers uploadés ({filteredFiles.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des fichiers...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-600 text-lg">Aucun fichier trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Commencez par uploader votre premier fichier</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(file.file_type)}</div>
                  <div>
                    <h3 className="font-medium text-gray-800">{file.title}</h3>
                    <p className="text-sm text-gray-600">{file.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>📁 {file.category}</span>
                      <span>📅 {file.year}</span>
                      <span>💾 {formatFileSize(file.file_size)}</span>
                      <span>👤 {file.uploaded_by_prenom} {file.uploaded_by_nom}</span>
                      <span>🕒 {new Date(file.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`http://localhost:3001/${file.file_path}`, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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

export default FileManagePage;








