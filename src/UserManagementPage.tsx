import React, { useState, useEffect } from 'react';
import { authAPI, buildAPIURL } from './api';
import { usePagination, PaginationControls } from './utils/pagination';
import { UserIcon } from './components/NavIcons';

// Additional icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  denomination_sociale?: string | null;
  telephone?: string | null;
  code_postal?: string | null;
  validite_date?: string | null;
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Pagination
  const { paginatedData: paginatedUsers, pagination, goToPage, setItemsPerPage } = usePagination(users, 50);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    nom: '',
    prenom: '',
    denomination_sociale: '',
    telephone: '',
    code_postal: '',
    validite_date: ''
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'activate' | 'deactivate' | 'delete';
    userId: number | null;
    userName: string;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'activate',
    userId: null,
    userName: ''
  });

  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    denomination_sociale: '',
    password: '',
    role: 'user',
    telephone: '',
    code_postal: '',
    validite_date: ''
  });

  useEffect(() => {
    loadUsers();
    loadResetRequests();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [activeFilter]);

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
      const url = activeFilter !== 'all' 
        ? buildAPIURL(`/users?active=${activeFilter === 'active'}`)
        : buildAPIURL('/users');
      
      const response = await fetch(url, {
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
          code_postal: formData.code_postal && formData.code_postal.trim() !== '' ? formData.code_postal.trim() : null,
          validite_date: formData.validite_date || null
        })
      });

      if (response.ok) {
        const newUser = await response.json();
        alert('Utilisateur créé avec succès !');
        setFormData({ email: '', nom: '', prenom: '', denomination_sociale: '', password: '', role: 'user', telephone: '', code_postal: '', validite_date: '' });
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
    const user = users.find(u => u.id === id);
    const userName = user ? (user.denomination_sociale || `${user.prenom} ${user.nom}`) : `l'utilisateur #${id}`;
    
    setConfirmModal({
      show: true,
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer ${userName} ?\n\nCette action est irréversible et supprimera toutes les données associées à cet utilisateur.`,
      type: 'delete',
      userId: id,
      userName
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.userId) return;

    try {
      const response = await fetch(buildAPIURL(`/users/${confirmModal.userId}`), {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (response.ok) {
        setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
        loadUsers();
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Utilisateur supprimé avec succès</span>';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
        const errorMsg = document.createElement('div');
        errorMsg.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        errorMsg.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>${errorData.error || 'Erreur lors de la suppression'}</span>`;
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>Erreur lors de la suppression</span>';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const user = users.find(u => u.id === id);
    const userName = user ? (user.denomination_sociale || `${user.prenom} ${user.nom}`) : `l'utilisateur #${id}`;
    
    setConfirmModal({
      show: true,
      title: currentStatus ? 'Désactiver l\'utilisateur' : 'Réactiver l\'utilisateur',
      message: currentStatus 
        ? `Êtes-vous sûr de vouloir désactiver ${userName} ?\n\nL'utilisateur ne pourra plus accéder à l'intranet.`
        : `Êtes-vous sûr de vouloir réactiver ${userName} ?`,
      type: currentStatus ? 'deactivate' : 'activate',
      userId: id,
      userName
    });
  };

  const confirmToggleActive = async () => {
    if (!confirmModal.userId) return;

    const user = users.find(u => u.id === confirmModal.userId);
    const currentStatus = user?.is_active ?? false;

    try {
      const response = await fetch(buildAPIURL(`/users/${confirmModal.userId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
        loadUsers();
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMsg.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Utilisateur ${!currentStatus ? 'réactivé' : 'désactivé'} avec succès</span>`;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
        const errorMsg = document.createElement('div');
        errorMsg.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        errorMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>Erreur lors de la mise à jour</span>';
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' });
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMsg.textContent = '❌ Erreur lors de la mise à jour';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
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
          code_postal: editFormData.code_postal.trim() || null,
          validite_date: editFormData.validite_date || null
        })
      });

      if (response.ok) {
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Utilisateur mis à jour avec succès</span>';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
        setEditingUser(null);
        setEditFormData({
          nom: '',
          prenom: '',
          denomination_sociale: '',
          telephone: '',
          code_postal: '',
          validite_date: ''
        });
        loadUsers();
      } else {
        const error = await response.json();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        errorMsg.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>${error.error || 'Erreur lors de la mise à jour'}</span>`;
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      errorMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span>Erreur lors de la mise à jour de l\'utilisateur</span>';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Get pending requests count
  const pendingRequests = resetRequests.filter(r => r.status === 'pending');
  const pendingCount = pendingRequests.length;

  return (
    <div className="space-y-6">
      {/* Header - Premium Alliance Courtage Blue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
              <p className="text-gray-600 text-sm">Créer et gérer les comptes utilisateurs</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {pendingCount > 0 && (
              <div className="relative">
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {pendingCount}
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Demandes</span>
                </button>
              </div>
            )}
            <button
              onClick={async () => {
                try {
                  const response = await fetch(buildAPIURL('/users/export/csv'), {
                    headers: { 'x-auth-token': localStorage.getItem('token') || '' }
                  });
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  console.error('Export error:', error);
                }
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
              title="Exporter en CSV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nouvel utilisateur</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Reset Requests Section - Premium Style */}
      {pendingRequests.length > 0 && !selectedRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-800">
                  {pendingCount} demande{pendingCount > 1 ? 's' : ''} de réinitialisation en attente
                </h3>
                <p className="text-amber-600 text-sm">Cliquez sur une demande pour réinitialiser le mot de passe</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {request.nom.charAt(0)}{request.prenom.charAt(0)}
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">{request.nom} {request.prenom}</div>
                      <div className="text-gray-500 text-sm">{request.user_email}</div>
                      <div className="text-gray-400 text-xs">{new Date(request.requested_at).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Réinitialiser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Password Modal - Premium Style */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Réinitialiser le mot de passe</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setNewPassword('');
                  setResetNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-gray-900 font-semibold">{selectedRequest.nom} {selectedRequest.prenom}</div>
              <div className="text-gray-500 text-sm">{selectedRequest.user_email}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Min. 6 caractères"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                <textarea
                  value={resetNotes}
                  onChange={(e) => setResetNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Notes pour l'administrateur..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleResetPassword(selectedRequest.id)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setNewPassword('');
                    setResetNotes('');
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Form - Premium Style */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Créer un nouvel utilisateur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Dupont"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Jean"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dénomination sociale</label>
              <input
                type="text"
                value={formData.denomination_sociale}
                onChange={(e) => setFormData({ ...formData, denomination_sociale: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ex: Alliance Courtage SARL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Min. 6 caractères"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                <input
                  type="text"
                  value={formData.code_postal}
                  onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="75001"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de validité (fin de convention)</label>
                <input
                  type="date"
                  value={formData.validite_date}
                  onChange={(e) => setFormData({ ...formData, validite_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-500 mt-1">Laissez vide pour une validité illimitée</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer utilisateur'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs - Premium Style Alliance Courtage Blue */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 mb-6 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide py-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${activeFilter === 'all'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {/* Left indicator bar */}
              {activeFilter === 'all' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <span className="font-medium">Tous</span>
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                ${activeFilter === 'active'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {/* Left indicator bar */}
              {activeFilter === 'active' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-500 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <CheckCircleIcon className="w-4 h-4" />
              <span className="font-medium">Actifs</span>
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                ${activeFilter === 'inactive'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {/* Left indicator bar */}
              {activeFilter === 'inactive' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <XCircleIcon className="w-4 h-4" />
              <span className="font-medium">Inactifs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users List - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Liste des utilisateurs ({users.length})</h3>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p>
              {activeFilter === 'active' 
                ? 'Aucun utilisateur actif' 
                : activeFilter === 'inactive' 
                ? 'Aucun utilisateur inactif' 
                : 'Aucun utilisateur enregistré'}
            </p>
          </div>
        ) : (
          <div>
            
            <div className="overflow-x-auto overflow-y-visible" style={{ minWidth: '100%' }}>
            <table className="w-full" style={{ minWidth: '1200px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dénomination sociale</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px', width: '200px' }}>Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px', width: '80px' }}>Code postal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '280px', width: '280px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`${!user.is_active || (user.validite_date && new Date(user.validite_date) < new Date()) ? 'bg-gray-100 opacity-75' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.nom} {user.prenom}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">
                        {user.denomination_sociale && user.denomination_sociale.trim() !== '' 
                          ? user.denomination_sociale 
                          : <span className="text-gray-400 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700" style={{ minWidth: '200px', width: '200px', whiteSpace: 'nowrap' }}>
                      {user.telephone && user.telephone.trim() !== '' 
                        ? user.telephone 
                        : <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700" style={{ minWidth: '80px', width: '80px' }}>
                      {user.code_postal && user.code_postal.trim() !== '' 
                        ? user.code_postal 
                        : <span className="text-gray-400 italic">-</span>}
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
                          className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 text-xs"
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
                      <div className="flex flex-col gap-1">
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
                        {user.validite_date && new Date(user.validite_date) < new Date() && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            ⏰ Expiré
                          </span>
                        )}
                        {user.validite_date && new Date(user.validite_date) >= new Date() && (
                          <span className="text-xs text-gray-500">
                            Expire: {new Date(user.validite_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap" style={{ minWidth: '280px', width: '280px' }}>
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditFormData({
                              nom: user.nom,
                              prenom: user.prenom,
                              denomination_sociale: user.denomination_sociale || '',
                              telephone: user.telephone || '',
                              code_postal: user.code_postal || '',
                              validite_date: user.validite_date ? user.validite_date.split('T')[0] : ''
                            });
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 flex items-center"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="whitespace-nowrap">Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700 transition-colors flex-shrink-0 flex items-center"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="whitespace-nowrap">Supprimer</span>
                        </button>
                      </div>
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
          </div>
        )}
      </div>

      {/* Edit User Modal - Premium Style */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'utilisateur</h3>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData({
                    nom: '',
                    prenom: '',
                    denomination_sociale: '',
                    telephone: '',
                    code_postal: '',
                    validite_date: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>ℹ️ Information :</strong> Vous pouvez modifier le nom, prénom et les informations complémentaires de l'utilisateur.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Dupont"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={editFormData.prenom}
                    onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dénomination sociale</label>
                <input
                  type="text"
                  value={editFormData.denomination_sociale}
                  onChange={(e) => setEditFormData({ ...editFormData, denomination_sociale: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Alliance Courtage SARL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="text"
                    value={editFormData.telephone}
                    onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 0123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                  <input
                    type="text"
                    value={editFormData.code_postal}
                    onChange={(e) => setEditFormData({ ...editFormData, code_postal: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 75001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de validité (fin de convention)</label>
                  <input
                    type="date"
                    value={editFormData.validite_date}
                    onChange={(e) => setEditFormData({ ...editFormData, validite_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laissez vide pour une validité illimitée</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting || !editFormData.nom.trim() || !editFormData.prenom.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Mise à jour...' : (
                    <>
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enregistrer les modifications
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData({
                      nom: '',
                      prenom: '',
                      denomination_sociale: '',
                      telephone: '',
                      code_postal: '',
                      validite_date: ''
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full transform transition-all">
            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'delete' 
                    ? 'bg-red-50' 
                    : confirmModal.type === 'deactivate'
                    ? 'bg-amber-50'
                    : 'bg-emerald-50'
                }`}>
                  {confirmModal.type === 'delete' ? (
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : confirmModal.type === 'deactivate' ? (
                    <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                {confirmModal.title}
              </h3>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-100">
                <p className="text-gray-700 text-center whitespace-pre-line leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', type: 'activate', userId: null, userName: '' })}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'delete') {
                      confirmDelete();
                    } else {
                      confirmToggleActive();
                    }
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    confirmModal.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmModal.type === 'deactivate'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmModal.type === 'delete' 
                    ? 'Supprimer' 
                    : confirmModal.type === 'deactivate'
                    ? 'Désactiver'
                    : 'Réactiver'}
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
