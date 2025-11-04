import React, { useState, useEffect } from 'react';
import { buildAPIURL } from './api';

interface Folder {
  id: number;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface Document {
  id: number;
  folder_id: number;
  name: string;
  document_date: string | null;
  document_type: string | null;
  fileUrl?: string | null;
  has_file_content?: boolean;
  folder_title?: string;
  display_order: number;
}

const ReglementaireCMSPage: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [folderForm, setFolderForm] = useState({ title: '', display_order: 0 });
  const [documentForm, setDocumentForm] = useState({
    folder_id: '',
    name: '',
    document_date: '',
    document_type: '',
    display_order: 0,
    file: null as File | null
  });

  useEffect(() => {
    loadFolders();
    loadDocuments();
  }, []);

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/reglementaire/folders'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedFolder
        ? buildAPIURL(`/reglementaire/documents?folder_id=${selectedFolder}`)
        : buildAPIURL('/reglementaire/documents');
      const response = await fetch(url, {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedFolder]);

  const handleCreateFolder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/reglementaire/folders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(folderForm)
      });
      if (response.ok) {
        alert('✅ Dossier créé avec succès');
        loadFolders();
        setShowFolderModal(false);
        setFolderForm({ title: '', display_order: 0 });
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la création'));
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('❌ Erreur lors de la création du dossier');
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/reglementaire/folders/${editingFolder.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(folderForm)
      });
      if (response.ok) {
        alert('✅ Dossier mis à jour avec succès');
        loadFolders();
        setShowFolderModal(false);
        setEditingFolder(null);
        setFolderForm({ title: '', display_order: 0 });
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la mise à jour'));
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('❌ Erreur lors de la mise à jour du dossier');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Supprimer ce dossier ? (Les documents seront également désactivés)')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/reglementaire/folders/${id}`), {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        alert('✅ Dossier supprimé avec succès');
        loadFolders();
        loadDocuments();
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la suppression'));
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('❌ Erreur lors de la suppression du dossier');
    }
  };

  const handleCreateDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('folder_id', documentForm.folder_id);
      formData.append('name', documentForm.name);
      formData.append('document_date', documentForm.document_date);
      formData.append('document_type', documentForm.document_type);
      formData.append('display_order', documentForm.display_order.toString());
      if (documentForm.file) {
        formData.append('file', documentForm.file);
      }

      const response = await fetch(buildAPIURL('/reglementaire/documents'), {
        method: 'POST',
        headers: { 'x-auth-token': token || '' },
        body: formData
      });
      if (response.ok) {
        alert('✅ Document créé avec succès');
        loadDocuments();
        setShowDocumentModal(false);
        setDocumentForm({
          folder_id: '',
          name: '',
          document_date: '',
          document_type: '',
          display_order: 0,
          file: null
        });
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la création'));
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('❌ Erreur lors de la création du document');
    }
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument) return;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('folder_id', documentForm.folder_id);
      formData.append('name', documentForm.name);
      formData.append('document_date', documentForm.document_date);
      formData.append('document_type', documentForm.document_type);
      formData.append('display_order', documentForm.display_order.toString());
      if (documentForm.file) {
        formData.append('file', documentForm.file);
      }

      const response = await fetch(buildAPIURL(`/reglementaire/documents/${editingDocument.id}`), {
        method: 'PUT',
        headers: { 'x-auth-token': token || '' },
        body: formData
      });
      if (response.ok) {
        alert('✅ Document mis à jour avec succès');
        loadDocuments();
        setShowDocumentModal(false);
        setEditingDocument(null);
        setDocumentForm({
          folder_id: '',
          name: '',
          document_date: '',
          document_type: '',
          display_order: 0,
          file: null
        });
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la mise à jour'));
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('❌ Erreur lors de la mise à jour du document');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/reglementaire/documents/${id}`), {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        alert('✅ Document supprimé avec succès');
        loadDocuments();
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la suppression'));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('❌ Erreur lors de la suppression du document');
    }
  };

  const openFolderModal = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderForm({ title: folder.title, display_order: folder.display_order });
    } else {
      setEditingFolder(null);
      setFolderForm({ title: '', display_order: folders.length });
    }
    setShowFolderModal(true);
  };

  const openDocumentModal = (doc?: Document) => {
    if (doc) {
      setEditingDocument(doc);
      setDocumentForm({
        folder_id: doc.folder_id.toString(),
        name: doc.name,
        document_date: doc.document_date || '',
        document_type: doc.document_type || '',
        display_order: doc.display_order,
        file: null
      });
    } else {
      setEditingDocument(null);
      setDocumentForm({
        folder_id: selectedFolder?.toString() || '',
        name: '',
        document_date: '',
        document_type: '',
        display_order: 0,
        file: null
      });
    }
    setShowDocumentModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion Réglementaire</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => openFolderModal()}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            + Ajouter un dossier
          </button>
          <button
            onClick={() => openDocumentModal()}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            + Ajouter un document
          </button>
        </div>
      </div>

      {/* Filtre par dossier */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrer par dossier
        </label>
        <select
          value={selectedFolder || ''}
          onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Tous les dossiers</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.title}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des dossiers */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Dossiers ({folders.length})</h3>
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-800">{folder.title}</span>
                <span className="ml-2 text-sm text-gray-500">
                  (Ordre: {folder.display_order})
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openFolderModal(folder)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des documents */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Documents ({documents.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-sm font-medium text-gray-700">Dossier</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Nom</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Fichier</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-600">{doc.folder_title || 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-800 font-medium">{doc.name}</td>
                  <td className="p-3 text-sm text-gray-600">{doc.document_date || 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-600">{doc.document_type || 'N/A'}</td>
                  <td className="p-3 text-sm">
                    {doc.fileUrl ? (
                      <span className="text-green-600">✓ Fichier disponible</span>
                    ) : (
                      <span className="text-gray-400">Aucun fichier</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDocumentModal(doc)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun document trouvé
            </div>
          )}
        </div>
      </div>

      {/* Modal Dossier */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingFolder ? 'Modifier le dossier' : 'Nouveau dossier'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={folderForm.title}
                  onChange={(e) => setFolderForm({ ...folderForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: 0. CLIENTS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                <input
                  type="number"
                  value={folderForm.display_order}
                  onChange={(e) => setFolderForm({ ...folderForm, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => editingFolder ? handleUpdateFolder() : handleCreateFolder()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  {editingFolder ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setShowFolderModal(false);
                    setEditingFolder(null);
                    setFolderForm({ title: '', display_order: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Document */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingDocument ? 'Modifier le document' : 'Nouveau document'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dossier</label>
                <select
                  value={documentForm.folder_id}
                  onChange={(e) => setDocumentForm({ ...documentForm, folder_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un dossier</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du document</label>
                <input
                  type="text"
                  value={documentForm.name}
                  onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Procédure de traitement"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="text"
                    value={documentForm.document_date}
                    onChange={(e) => setDocumentForm({ ...documentForm, document_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <input
                    type="text"
                    value={documentForm.document_type}
                    onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Procédure, Guide, Modèle"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                <input
                  type="number"
                  value={documentForm.display_order}
                  onChange={(e) => setDocumentForm({ ...documentForm, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier {editingDocument ? '(laisser vide pour conserver le fichier actuel)' : ''}
                </label>
                <input
                  type="file"
                  onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => editingDocument ? handleUpdateDocument() : handleCreateDocument()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  {editingDocument ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setEditingDocument(null);
                    setDocumentForm({
                      folder_id: '',
                      name: '',
                      document_date: '',
                      document_type: '',
                      display_order: 0,
                      file: null
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReglementaireCMSPage;

