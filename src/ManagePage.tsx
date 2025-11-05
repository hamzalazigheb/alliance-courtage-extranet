import React, { useState, useEffect } from 'react';
import FileManagementPage from './FileManagementPage';
import PartnerManagementPage from './PartnerManagementPage';
import FinancialDocumentsPage from './FinancialDocumentsPage';
import UserManagementPage from './UserManagementPage';
import CMSManagementPage from './CMSManagementPage';
import ProductReservationsPage from './ProductReservationsPage';
import { buildAPIURL } from './api';

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

const ManagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'archives' | 'partenaires' | 'documents' | 'utilisateurs' | 'cms' | 'reservations'>('archives');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // If user tries to access 'utilisateurs' or 'reservations' tab but is not admin, redirect to first available tab
  useEffect(() => {
    if ((activeTab === 'utilisateurs' || activeTab === 'reservations') && currentUser && currentUser.role !== 'admin') {
      setActiveTab('archives');
    }
  }, [activeTab, currentUser]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(buildAPIURL('/auth/me'), {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        // The API returns { user: {...} }, so we need to extract the user object
        const userData = responseData.user || responseData;
        setCurrentUser(userData);
        setProfileData({
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || ''
        });
      } else {
        // Check if it's a 403 or 401 error
        if (response.status === 403 || response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Authentication error:', errorData);
          // Redirect to login if unauthorized
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          window.location.hash = 'manage';
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildAPIURL(`/users/${currentUser.id}/profile`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        alert('Profil mis à jour avec succès !');
        await loadCurrentUser();
        setShowProfileModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildAPIURL(`/users/${currentUser?.id}/change-password`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        alert('Mot de passe changé avec succès !');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Filter tabs based on user role
  const allTabs = [
    { id: 'archives' as const, label: 'Archives', icon: '📁', adminOnly: false },
    { id: 'partenaires' as const, label: 'Partenaires', icon: '🤝', adminOnly: false },
    { id: 'documents' as const, label: 'Documents Financiers', icon: '📄', adminOnly: false },
    { id: 'utilisateurs' as const, label: 'Utilisateurs', icon: '👥', adminOnly: true },
    { id: 'cms' as const, label: 'CMS', icon: '✏️', adminOnly: false },
    { id: 'reservations' as const, label: 'Produits Réservés', icon: '🛒', adminOnly: true }
  ];
  
  const tabs = allTabs.filter(tab => !tab.adminOnly || currentUser?.role === 'admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/alliance-courtage-logo.svg" 
                alt="Alliance Courtage Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600">Centre de gestion Alliance Courtage</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span>👤</span>
                <span>Gérer le profil</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  window.location.href = '/';
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <span>🚪</span>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
          {activeTab === 'archives' && <FileManagementPage />}
          {activeTab === 'partenaires' && <PartnerManagementPage />}
          {activeTab === 'documents' && <FinancialDocumentsPage />}
          {activeTab === 'utilisateurs' && (
            currentUser?.role === 'admin' ? (
              <UserManagementPage />
            ) : (
              <div className="p-8">
                <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h1 className="text-2xl font-bold text-red-800 mb-4">Accès refusé</h1>
                  <p className="text-red-600">Vous devez être administrateur pour accéder à cette fonctionnalité.</p>
                </div>
              </div>
            )
          )}
          {activeTab === 'cms' && <CMSManagementPage />}
          {activeTab === 'reservations' && (
            currentUser?.role === 'admin' ? (
              <ProductReservationsPage />
            ) : (
              <div className="p-8">
                <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h1 className="text-2xl font-bold text-red-800 mb-4">Accès refusé</h1>
                  <p className="text-red-600">Vous devez être administrateur pour accéder à cette fonctionnalité.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Gérer mon profil</h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {currentUser && (
              <div className="space-y-6">
                {/* Informations du profil */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={profileData.nom}
                        onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={profileData.prenom}
                        onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rôle
                      </label>
                      <input
                        type="text"
                        value={currentUser.role}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                    </button>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Changer le mot de passe</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Entrez votre mot de passe actuel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum 6 caractères"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Répétez le nouveau mot de passe"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Changement...' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePage;
