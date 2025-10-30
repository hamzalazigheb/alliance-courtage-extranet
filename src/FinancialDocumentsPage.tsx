import React, { useState, useEffect } from 'react';
import { financialDocumentsAPI } from './api';

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
}

function FinancialDocumentsPage() {
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
      formData.append('subcategory', uploadForm.subcategory);
      formData.append('year', uploadForm.year.toString());

      const response = await fetch('http://localhost:3001/api/financial-documents', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
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
      alert('Document uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du document');
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
      alert('Document supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => (
    <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" />
    </svg>
  );

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];
  const subcategories = [...new Set(documents.map(d => d.subcategory).filter(Boolean))];
  const years = [...new Set(documents.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Documents Financiers</h1>
            <p className="text-gray-600 text-lg">
              Gérez les documents pour la gamme financière
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nouveau document</span>
          </button>
        </div>
      </div>

      {showUploadForm && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploader un nouveau document</h2>
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

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
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
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDocuments}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Documents ({filteredDocuments.length})</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun document trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                  <div>
                    <h3 className="font-medium text-gray-800">{doc.title}</h3>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>Catégorie: {doc.category}</span>
                      {doc.subcategory && <span>Type: {doc.subcategory}</span>}
                      <span>Année: {doc.year}</span>
                      <span>Taille: {formatFileSize(doc.file_size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`http://localhost:3001${doc.file_path}`, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Télécharger
                  </button>
                  <button
                    onClick={() => handleFileDelete(doc.id)}
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

export default FinancialDocumentsPage;



