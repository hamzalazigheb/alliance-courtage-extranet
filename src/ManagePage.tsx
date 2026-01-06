import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardPage from './DashboardPage';
import FileManagementPage from './FileManagementPage';
import PartnerManagementPage from './PartnerManagementPage';
import FinancialDocumentsPage from './FinancialDocumentsPage';
import UserManagementPage from './UserManagementPage';
import CMSManagementPage from './CMSManagementPage';
import GammeProductsCMSPage from './GammeProductsCMSPage';
import StructuredProductsCMSPage from './StructuredProductsCMSPage';
import ProductReservationsPage from './ProductReservationsPage';
import SimulatorStatsPage from './SimulatorStatsPage';
import GlobalSearch from './components/GlobalSearch';
import Breadcrumb from './components/Breadcrumb';
import GuidedTour, { manageTourSteps } from './components/GuidedTour';
import { buildAPIURL } from './api';
import AdminNavbar, { NavItem } from './components/AdminNavbar';
import {
  ArchiveIcon,
  PartnerIcon,
  DocumentIcon,
  UserIcon,
  CMSIcon,
  GammeProductsIcon,
  StructuredProductsIcon,
  CartIcon,
  ChartIcon
} from './components/NavIcons';
import { useAlert } from './contexts/AlertContext';
import { useTheme } from './contexts/ThemeContext';

// Dashboard Icon
const DashboardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

const ManagePage: React.FC = () => {
  const { showSuccess, showError, showWarning } = useAlert();
  const { theme, toggleTheme, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'archives' | 'partenaires' | 'documents' | 'utilisateurs' | 'cms' | 'produits-structures' | 'reservations' | 'simulateurs'>('dashboard');
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
  const [showTour, setShowTour] = useState(false);

  // Check if tour should be shown (first visit)
  useEffect(() => {
    const tourCompleted = localStorage.getItem('manageTourCompleted');
    if (!tourCompleted) {
      setTimeout(() => setShowTour(true), 1000);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // If user tries to access 'utilisateurs', 'reservations', or 'simulateurs' tab but is not admin, redirect to first available tab
  useEffect(() => {
    if ((activeTab === 'utilisateurs' || activeTab === 'reservations' || activeTab === 'simulateurs') && currentUser && currentUser.role !== 'admin') {
      setActiveTab('dashboard');
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


  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showWarning('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showWarning('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Les nouveaux mots de passe ne correspondent pas');
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
        showSuccess('Mot de passe changé avec succès !');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        showError(error.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Navigation items configuration with professional icons
  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'archives',
      label: 'Archives',
      icon: <ArchiveIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'partenaires',
      label: 'Partenaires',
      icon: <PartnerIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'documents',
      label: 'Documents Financiers',
      icon: <DocumentIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: <UserIcon className="w-4 h-4" />,
      adminOnly: true
    },
    {
      id: 'cms',
      label: 'CMS',
      icon: <CMSIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'gamme-produits',
      label: 'Gamme Produits',
      icon: <GammeProductsIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'produits-structures',
      label: 'Produits Structurés',
      icon: <StructuredProductsIcon className="w-4 h-4" />,
      adminOnly: false
    },
    {
      id: 'reservations',
      label: 'Produits Réservés',
      icon: <CartIcon className="w-4 h-4" />,
      adminOnly: true
    },
    {
      id: 'simulateurs',
      label: 'Simulateurs',
      icon: <ChartIcon className="w-4 h-4" />,
      adminOnly: true
    }
  ], []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as typeof activeTab);
  }, []);

  const handleSearchNavigate = useCallback((tab: string, itemId?: number) => {
    setActiveTab(tab as typeof activeTab);
    // TODO: Scroll to item or highlight it if needed
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200 relative z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0" data-tour="logo">
              <img 
                src="/alliance-courtage-logo.svg" 
                alt="Alliance Courtage Logo" 
                className="h-16 sm:h-20 md:h-24 w-auto"
              />
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Administration</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Centre de gestion Alliance Courtage</p>
              </div>
            </div>
            
            {/* Global Search */}
            <div className="flex-1 max-w-2xl hidden md:block relative z-[200]" data-tour="search">
              <GlobalSearch onNavigate={handleSearchNavigate} />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Help Tour Button */}
              <button
                onClick={() => setShowTour(true)}
                className="flex items-center justify-center w-10 h-10 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 rounded-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                aria-label="Aide / Tour guidé"
                title="Lancer le tour guidé"
              >
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
                title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                data-tour="dark-mode"
              >
                {isDark ? (
                  // Sun icon for light mode
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Moon icon for dark mode
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Gérer le profil"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Gérer le profil</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('manageAuth');
                  window.location.hash = 'manage';
                  window.location.reload();
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full page without scroll */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Professional Navigation Bar - Fixed */}
        <div className="flex-shrink-0 mb-3">
          <AdminNavbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userRole={currentUser?.role}
            items={navItems}
            className="mb-0"
          />
        </div>

        {/* Breadcrumb - Compact */}
        <div className="flex-shrink-0 mb-3">
          <Breadcrumb
            items={[
              { label: 'Administration', onClick: () => setActiveTab('dashboard') },
              { 
                label: navItems.find(item => item.id === activeTab)?.label || activeTab,
                icon: navItems.find(item => item.id === activeTab)?.icon
              }
            ]}
          />
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-auto min-h-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-colors duration-200">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setActiveTab(tab as typeof activeTab)} />}
          {activeTab === 'archives' && <FileManagementPage />}
          {activeTab === 'partenaires' && <PartnerManagementPage />}
          {activeTab === 'documents' && <FinancialDocumentsPage />}
          {activeTab === 'utilisateurs' && (
            currentUser?.role === 'admin' ? (
              <UserManagementPage />
            ) : (
              <div className="p-8">
                <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h1 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">Accès refusé</h1>
                  <p className="text-red-600 dark:text-red-300">Vous devez être administrateur pour accéder à cette fonctionnalité.</p>
                </div>
              </div>
            )
          )}
          {activeTab === 'cms' && <CMSManagementPage />}
          {activeTab === 'gamme-produits' && <GammeProductsCMSPage />}
          {activeTab === 'produits-structures' && <StructuredProductsCMSPage mode="products-only" />}
          {activeTab === 'reservations' && (
            currentUser?.role === 'admin' ? (
              <ProductReservationsPage />
            ) : (
              <div className="p-8">
                <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h1 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">Accès refusé</h1>
                  <p className="text-red-600 dark:text-red-300">Vous devez être administrateur pour accéder à cette fonctionnalité.</p>
                </div>
              </div>
            )
          )}
          {activeTab === 'simulateurs' && (
            currentUser?.role === 'admin' ? (
              <SimulatorStatsPage />
            ) : (
              <div className="p-8">
                <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h1 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">Accès refusé</h1>
                  <p className="text-red-600 dark:text-red-300">Vous devez être administrateur pour accéder à cette fonctionnalité.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-3 sm:p-4 overflow-y-auto pt-20 sm:pt-24">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] min-h-0 min-w-0 overflow-y-auto mx-auto mt-0 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Gérer mon profil</h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl sm:text-3xl leading-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {currentUser && (
              <div className="space-y-4 sm:space-y-6">
                {/* Informations du profil */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Informations personnelles</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                      <strong>ℹ️ Information :</strong> Le nom et le prénom ne peuvent être modifiés que par un administrateur. 
                      Contactez votre administrateur si vous devez les modifier.
                    </p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={profileData.nom}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Le nom ne peut pas être modifié</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={profileData.prenom}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Le prénom ne peut pas être modifié</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Rôle
                      </label>
                      <input
                        type="text"
                        value={currentUser.role}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 sm:p-3">
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        <strong>💡 Astuce :</strong> Vous pouvez modifier votre mot de passe ci-dessous.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Changer le mot de passe</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      <strong>ℹ️ Sécurité :</strong> Vous pouvez uniquement modifier votre propre mot de passe. 
                      Le système vérifie automatiquement votre identité.
                    </p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Mot de passe actuel *
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Entrez votre mot de passe actuel"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Nouveau mot de passe *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Minimum 6 caractères"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 caractères</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Confirmer le nouveau mot de passe *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Répétez le nouveau mot de passe"
                        minLength={6}
                        required
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Guided Tour */}
      <GuidedTour
        steps={manageTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          localStorage.setItem('manageTourCompleted', 'true');
        }}
      />
    </div>
  );
};

export default ManagePage;
