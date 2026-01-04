import React, { useState, useEffect } from 'react';
import { archivesAPI, buildAPIURL } from './api';
import { ArchiveIcon, EditIcon, UploadIcon } from './components/NavIcons';
import { useAlert } from './contexts/AlertContext';

// File type icons
const FileIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const PdfIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
  const { showSuccess, showError, showWarning } = useAlert();
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
  
  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false);
  
  // Preview state
  const [previewFile, setPreviewFile] = useState<{url: string; title: string; type: string} | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  // Recharger les fichiers quand les filtres changent
  useEffect(() => {
    loadFiles();
  }, [selectedCategory, selectedYear, searchTerm]);

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
    } catch (error: any) {
      console.error('Erreur lors du chargement des fichiers:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      console.error('Détails de l\'erreur:', {
        message: errorMessage,
        name: error?.name,
        stack: error?.stack,
        originalError: error?.originalError
      });
      showError(`Erreur lors du chargement des fichiers: ${errorMessage}`);
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
      
      showSuccess('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload du fichier';
      showError(errorMessage);
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
      showSuccess('Fichier supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showError('Erreur lors de la suppression du fichier');
    }
  };

  const handleUpdateCategory = async (id: number, category: string) => {
    try {
      setUpdatingCategory(id);
      await archivesAPI.updateCategory(id, category);
      // Mettre à jour localement
      setFiles(files.map(f => f.id === id ? { ...f, category } : f));
      setEditingCategory(null);
      showSuccess('Catégorie mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur mise à jour catégorie:', error);
      showError('Erreur lors de la mise à jour de la catégorie');
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

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      setUploadForm(prev => ({ ...prev, file, title: file.name.replace(/\.[^/.]+$/, '') }));
      setShowUploadForm(true);
    }
  };

  // Preview handler
  const handlePreview = async (file: ArchiveFile) => {
    const fileType = file.file_type?.toLowerCase() || '';
    const isPdf = fileType.includes('pdf');
    const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.file_path || '');
    
    if (!isPdf && !isImage) {
      showWarning('Aperçu disponible uniquement pour les PDF et images');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/archives/${file.id}/download`), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewFile({ url, title: file.title, type: isPdf ? 'pdf' : 'image' });
      }
    } catch (error) {
      showError('Erreur lors du chargement de l\'aperçu');
    }
  };

  // Bulk selection handlers
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} fichier(s) ?`)) {
      return;
    }

    setBulkDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await archivesAPI.delete(id);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setBulkDeleting(false);
    setSelectedIds(new Set());
    loadFiles();

    if (errorCount === 0) {
      showSuccess(`${successCount} fichier(s) supprimé(s) avec succès`);
    } else {
      showWarning(`${successCount} supprimé(s), ${errorCount} erreur(s)`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    const iconClass = 'w-8 h-8';
    if (!fileType) {
      return <FileIcon className={`${iconClass} text-gray-600`} />;
    }
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <PdfIcon className={`${iconClass} text-red-600`} />;
    }
    if (type.includes('word') || type.includes('document')) {
      return <FileIcon className={`${iconClass} text-blue-600`} />;
    }
    if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileIcon className={`${iconClass} text-green-600`} />;
    }
    if (type.includes('image')) {
      return <FileIcon className={`${iconClass} text-purple-600`} />;
    }
    return <FileIcon className={`${iconClass} text-gray-600`} />;
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
    <div 
      className="max-w-6xl mx-auto space-y-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UploadIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Déposez votre fichier ici</h3>
            <p className="text-gray-500">Relâchez pour uploader</p>
          </div>
        </div>
      )}

      {/* En-tête de la page - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Archives</h1>
            <p className="text-gray-600 text-sm">
              Gérez et organisez vos documents et fichiers • Glissez-déposez vos fichiers
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
              >
                <TrashIcon className="w-5 h-5" />
                <span>{bulkDeleting ? 'Suppression...' : `Supprimer (${selectedIds.size})`}</span>
              </button>
            )}
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
            >
              <UploadIcon className="w-5 h-5" />
              <span>Nouveau fichier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'upload - Premium Style */}
      {showUploadForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UploadIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Uploader un nouveau fichier</h2>
          </div>
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
      {availableCategories.length > 0 && (
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
              {availableCategories.map((category) => {
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
                placeholder="Rechercher un fichier..."
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
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadFiles}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium border border-gray-300"
            >
              <RefreshIcon className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des fichiers - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ArchiveIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Fichiers ({filteredFiles.length})
            </h2>
          </div>
          {filteredFiles.length > 0 && (
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Tout sélectionner</span>
            </label>
          )}
        </div>

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
              <div key={file.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${selectedIds.has(file.id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(file.id)}
                    onChange={() => toggleSelection(file.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex-shrink-0">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{file.title}</h3>
                    {file.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">{file.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 flex-wrap gap-y-1">
                      <div className="flex items-center space-x-1.5">
                        <FolderIcon className="w-4 h-4 text-gray-400" />
                        {editingCategory?.id === file.id ? (
                          <div className="flex items-center space-x-1">
                            <select
                              value={editingCategory.category}
                              onChange={(e) => setEditingCategory({...editingCategory, category: e.target.value})}
                              className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              disabled={updatingCategory === file.id}
                            >
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleUpdateCategory(file.id, editingCategory.category)}
                              disabled={updatingCategory === file.id}
                              className="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              disabled={updatingCategory === file.id}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 transition-colors"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">{file.category || 'Non classé'}</span>
                            <button
                              onClick={() => setEditingCategory({id: file.id, category: file.category || 'Non classé'})}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="Modifier la catégorie"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {file.year && (
                        <div className="flex items-center space-x-1.5">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span>{file.year}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>{file.uploaded_by_prenom} {file.uploaded_by_nom}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => handlePreview(file)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 font-medium"
                    title="Aperçu"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 font-medium shadow-sm hover:shadow"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.id)}
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

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800 truncate">{previewFile.title}</h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewFile.url);
                  setPreviewFile(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {previewFile.type === 'pdf' ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[70vh] rounded-lg border"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt={previewFile.title}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManagementPage;






