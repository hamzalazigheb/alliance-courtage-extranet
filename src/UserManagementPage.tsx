import React, { useState, useEffect } from 'react';
import { authAPI, buildAPIURL } from './api';
import { usePagination, PaginationControls } from './utils/pagination';

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  denomination_sociale?: string | null;
  telephone?: string | null;
  code_postal?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PasswordResetRequest {
  id: number;
  user_id: number;
  user_email: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  nom: string;
  prenom: string;
  user_is_active: boolean;
}

function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const { paginatedData: paginatedUsers, pagination, goToPage, setItemsPerPage } = usePagination(users, 10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUserForUpload, setSelectedUserForUpload] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUserMapping, setFileUserMapping] = useState<{fileIndex: number, userId: number}[]>([]);
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    nom: '',
    prenom: '',
    denomination_sociale: '',
    telephone: '',
    code_postal: ''
  });

  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    denomination_sociale: '',
    password: '',
    role: 'user',
    telephone: '',
    code_postal: ''
  });

  useEffect(() => {
    loadUsers();
    loadResetRequests();
  }, []);

  const loadResetRequests = async () => {
    try {
      const response = await fetch(buildAPIURL('/password-reset/requests'), {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResetRequests(data);
      } else if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Accès refusé' }));
        console.error('Access denied:', errorData);
        alert('Vous devez être administrateur pour accéder à cette fonctionnalité.');
      }
    } catch (error) {
      console.error('Error loading reset requests:', error);
    }
  };

  const handleResetPassword = async (requestId: number) => {
    if (!newPassword) {
      alert('Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const response = await fetch(buildAPIURL(`/password-reset/requests/${requestId}/complete`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          new_password: newPassword,
          notes: resetNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ ' + (data.message || 'Mot de passe réinitialisé avec succès !\n\n📧 Un email a été envoyé à l\'utilisateur avec le nouveau mot de passe.'));
        setSelectedRequest(null);
        setNewPassword('');
        setResetNotes('');
        loadResetRequests();
        loadUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erreur lors de la réinitialisation'));
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildAPIURL('/users'), {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Utilisateurs chargés:', data.length);
        if (data.length > 0) {
          console.log('📝 Premier utilisateur (exemple):', {
            id: data[0].id,
            nom: data[0].nom,
            prenom: data[0].prenom,
            denomination_sociale: data[0].denomination_sociale,
            telephone: data[0].telephone,
            code_postal: data[0].code_postal
          });
        }
        setUsers(data);
      } else if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Accès refusé' }));
        console.error('Access denied:', errorData);
        alert('Vous devez être administrateur pour accéder à cette fonctionnalité.');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.nom || !formData.prenom || !formData.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(buildAPIURL('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          denomination_sociale: formData.denomination_sociale && formData.denomination_sociale.trim() !== '' ? formData.denomination_sociale.trim() : null,
          password: formData.password,
          role: formData.role,
          telephone: formData.telephone && formData.telephone.trim() !== '' ? formData.telephone.trim() : null,
          code_postal: formData.code_postal && formData.code_postal.trim() !== '' ? formData.code_postal.trim() : null
        })
      });

      if (response.ok) {
        const newUser = await response.json();
        alert('Utilisateur créé avec succès !');
        setFormData({ email: '', nom: '', prenom: '', denomination_sociale: '', password: '', role: 'user', telephone: '', code_postal: '' });
        setShowAddForm(false);
        loadUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(buildAPIURL(`/users/${id}`), {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (response.ok) {
        alert('Utilisateur supprimé avec succès');
        loadUsers();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(buildAPIURL(`/users/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        loadUsers();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editFormData.nom.trim() || !editFormData.prenom.trim()) {
      alert('Le nom et le prénom sont obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(buildAPIURL(`/users/${editingUser.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          nom: editFormData.nom.trim(),
          prenom: editFormData.prenom.trim(),
          denomination_sociale: editFormData.denomination_sociale.trim() || null,
          telephone: editFormData.telephone.trim() || null,
          code_postal: editFormData.code_postal.trim() || null
        })
      });

      if (response.ok) {
        alert('✅ Utilisateur mis à jour avec succès !');
        setEditingUser(null);
        setEditFormData({
          nom: '',
          prenom: '',
          denomination_sociale: '',
          telephone: '',
          code_postal: ''
        });
        loadUsers();
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erreur lors de la mise à jour'));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Erreur lors de la mise à jour de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedUserForUpload) {
      alert('Veuillez sélectionner un fichier et un utilisateur');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('user_id', selectedUserForUpload.toString());

      const response = await fetch(buildAPIURL('/archives'), {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: formData
      });

      if (response.ok) {
        alert('Fichier uploadé avec succès pour l\'utilisateur!');
        setUploadFile(null);
        setSelectedUserForUpload(null);
        setShowUploadForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  // Smart file matching function
  const matchFileToUser = (fileName: string): number | null => {
    const fileNameLower = fileName.toLowerCase();
    
    // Try to match by name patterns
    for (const user of users) {
      const nomLower = user.nom.toLowerCase();
      const prenomLower = user.prenom.toLowerCase();
      
      // Check if filename contains first 2-3 characters of nom or prenom
      if (fileNameLower.includes(nomLower.substring(0, 3)) || 
          fileNameLower.includes(prenomLower.substring(0, 3))) {
        return user.id;
      }
      
      // Check if filename contains initials
      const initials = (prenomLower.charAt(0) + nomLower.charAt(0)).toLowerCase();
      if (fileNameLower.includes(initials)) {
        return user.id;
      }
    }
    
    return null;
  };

  // Handle bulk file selection
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    
    // Try to automatically match files to users
    const mapping: {fileIndex: number, userId: number}[] = [];
    files.forEach((file, index) => {
      const matchedUserId = matchFileToUser(file.name);
      if (matchedUserId) {
        mapping.push({ fileIndex: index, userId: matchedUserId });
      }
    });
    
    setFileUserMapping(mapping);
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    
    try {
      // Upload each file with its matched user
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mapping = fileUserMapping.find(m => m.fileIndex === i);
        
        if (!mapping) {
          console.warn(`No user mapping found for file ${file.name}, skipping...`);
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', mapping.userId.toString());
        
        const response = await fetch(buildAPIURL('/archives'), {
          method: 'POST',
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: formData
        });
        
        if (!response.ok) {
          console.error(`Failed to upload file ${file.name}`);
        }
      }
      
      alert(`✅ ${selectedFiles.length} fichier(s) uploadé(s) avec succès!`);
      setSelectedFiles([]);
      setFileUserMapping([]);
      setShowBulkUpload(false);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Erreur lors de l\'upload en masse');
    } finally {
      setUploading(false);
    }
  };

  // Get pending requests count
  const pendingRequests = resetRequests.filter(r => r.status === 'pending');
  const pendingCount = pendingRequests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Gestion des Utilisateurs</h2>
            <p className="text-slate-300">Créer et gérer les comptes utilisateurs</p>
          </div>
          <div className="flex items-center space-x-3">
            {pendingCount > 0 && (
              <div className="relative">
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {pendingCount}
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  🔔 Demandes de réinitialisation
                </button>
              </div>
            )}
            <button
              onClick={() => setShowBulkUpload(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              📤 Upload en masse
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              + Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Password Reset Requests Section */}
      {pendingRequests.length > 0 && !selectedRequest && (
        <div className="bg-amber-900/20 border-2 border-amber-500 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-pulse">🔔</div>
              <div>
                <h3 className="text-xl font-bold text-amber-400">
                  {pendingCount} demande{pendingCount > 1 ? 's' : ''} de réinitialisation en attente
                </h3>
                <p className="text-amber-300 text-sm">Cliquez sur une demande pour réinitialiser le mot de passe</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="bg-slate-800 p-4 rounded-lg border border-slate-700 cursor-pointer hover:border-amber-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {request.nom.charAt(0)}{request.prenom.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{request.nom} {request.prenom}</div>
                      <div className="text-slate-400 text-sm">{request.user_email}</div>
                      <div className="text-slate-500 text-xs">{new Date(request.requested_at).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
                    Réinitialiser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Réinitialiser le mot de passe</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setNewPassword('');
                  setResetNotes('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-slate-700 rounded-lg">
              <div className="text-white font-semibold">{selectedRequest.nom} {selectedRequest.prenom}</div>
              <div className="text-slate-400 text-sm">{selectedRequest.user_email}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Min. 6 caractères"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Notes (optionnel)</label>
                <textarea
                  value={resetNotes}
                  onChange={(e) => setResetNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  rows={3}
                  placeholder="Notes pour l'administrateur..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleResetPassword(selectedRequest.id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setNewPassword('');
                    setResetNotes('');
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">Créer un nouvel utilisateur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Dupont"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Jean"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Dénomination sociale</label>
              <input
                type="text"
                value={formData.denomination_sociale}
                onChange={(e) => setFormData({ ...formData, denomination_sociale: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex: Alliance Courtage SARL"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Mot de passe *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Min. 6 caractères"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Code postal</label>
                <input
                  type="text"
                  value={formData.code_postal}
                  onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="75001"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer utilisateur'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">Liste des utilisateurs ({users.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <div className="text-4xl mb-4">👥</div>
            <p>Aucun utilisateur enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Dénomination sociale</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Code postal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-white">{user.nom} {user.prenom}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-300">
                        {user.denomination_sociale && user.denomination_sociale.trim() !== '' 
                          ? user.denomination_sociale 
                          : <span className="text-slate-500 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-300">{user.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-300">
                        {user.telephone && user.telephone.trim() !== '' 
                          ? user.telephone 
                          : <span className="text-slate-500 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-300">
                        {user.code_postal && user.code_postal.trim() !== '' 
                          ? user.code_postal 
                          : <span className="text-slate-500 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            try {
                              const response = await fetch(buildAPIURL(`/users/${user.id}`), {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'x-auth-token': localStorage.getItem('token') || ''
                                },
                                body: JSON.stringify({ role: newRole })
                              });
                              if (response.ok) {
                                loadUsers();
                              } else {
                                const err = await response.json().catch(() => ({}));
                                alert(err.error || 'Erreur lors de la mise à jour du rôle');
                              }
                            } catch (err) {
                              console.error('Error updating role:', err);
                              alert('Erreur lors de la mise à jour du rôle');
                            }
                          }}
                          className="px-2 py-1 rounded border border-slate-600 bg-slate-700 text-white text-xs"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? '✓ Actif' : '✗ Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditFormData({
                            nom: user.nom,
                            prenom: user.prenom,
                            denomination_sociale: user.denomination_sociale || '',
                            telephone: user.telephone || '',
                            code_postal: user.code_postal || ''
                          });
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors mr-3"
                        title="Modifier"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserForUpload(user.id);
                          setShowUploadForm(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors mr-3"
                        title="Upload fichier"
                      >
                        📤 Upload
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={goToPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Upload fichier</h3>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadFile(null);
                  setSelectedUserForUpload(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Utilisateur</label>
                <select
                  value={selectedUserForUpload || ''}
                  onChange={(e) => setSelectedUserForUpload(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nom} {user.prenom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Fichier</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {uploading ? 'Upload...' : 'Uploader'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFile(null);
                    setSelectedUserForUpload(null);
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">📤 Upload en masse</h3>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setSelectedFiles([]);
                  setFileUserMapping([]);
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Astuce:</strong> Nommez vos fichiers avec le nom ou les initiales de l'utilisateur 
                  (ex: "martin_bordereau.pdf" ou "MA_janvier.pdf"). Le système les associera automatiquement!
                </p>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Sélectionner les fichiers
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleBulkFileSelect}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                />
                {selectedFiles.length > 0 && (
                  <p className="mt-2 text-sm text-green-400">
                    ✅ {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>

              {/* Preview Mapping */}
              {selectedFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Association fichiers ↔ utilisateurs:
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedFiles.map((file, index) => {
                      const mapping = fileUserMapping.find(m => m.fileIndex === index);
                      const user = mapping ? users.find(u => u.id === mapping.userId) : null;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            user ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium">{file.name}</p>
                            {user ? (
                              <p className="text-green-400 text-sm">
                                ✓ → {user.nom} {user.prenom}
                              </p>
                            ) : (
                              <p className="text-red-400 text-sm">
                                ⚠ Aucun utilisateur trouvé
                              </p>
                            )}
                          </div>
                          {!user && (
                            <button
                              onClick={() => {
                                // Manual assignment logic could go here
                              }}
                              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              Assigner
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedFiles.length > fileUserMapping.length && (
                    <div className="mt-3 bg-amber-900/20 border border-amber-500 rounded-lg p-3">
                      <p className="text-amber-300 text-sm">
                        ⚠ {selectedFiles.length - fileUserMapping.length} fichier(s) non associé(s). 
                        Vérifiez les noms de fichiers ou assignez-les manuellement.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading || selectedFiles.length === 0 || fileUserMapping.length < selectedFiles.length}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload en cours...' : '🚀 Uploader tous les fichiers'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setSelectedFiles([]);
                    setFileUserMapping([]);
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Modifier l'utilisateur</h3>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData({
                    nom: '',
                    prenom: '',
                    denomination_sociale: '',
                    telephone: '',
                    code_postal: ''
                  });
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300">
                  <strong>ℹ️ Information :</strong> Vous pouvez modifier le nom, prénom et les informations complémentaires de l'utilisateur.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Dupont"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={editFormData.prenom}
                    onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Dénomination sociale</label>
                <input
                  type="text"
                  value={editFormData.denomination_sociale}
                  onChange={(e) => setEditFormData({ ...editFormData, denomination_sociale: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ex: Alliance Courtage SARL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Téléphone</label>
                  <input
                    type="text"
                    value={editFormData.telephone}
                    onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Ex: 0123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Code postal</label>
                  <input
                    type="text"
                    value={editFormData.code_postal}
                    onChange={(e) => setEditFormData({ ...editFormData, code_postal: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Ex: 75001"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting || !editFormData.nom.trim() || !editFormData.prenom.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Mise à jour...' : '✅ Enregistrer les modifications'}
                </button>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData({
                      nom: '',
                      prenom: '',
                      denomination_sociale: '',
                      telephone: '',
                      code_postal: ''
                    });
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
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
}

export default UserManagementPage;
