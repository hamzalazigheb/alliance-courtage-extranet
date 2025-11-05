import React, { useState, useEffect } from "react";
import GammeFinancierePage from './GammeFinancierePage';
import ProduitsStructuresPageComponent from './ProduitsStructuresPage';
import NosArchivesPage from './NosArchivesPage';
import ManagePage from './ManagePage';
import NotificationsPage from './NotificationsPage';
import FavorisPage from './FavorisPage';
import { authAPI, formationsAPI, notificationsAPI, favorisAPI, buildAPIURL, buildFileURL } from './api';

// Types pour les utilisateurs et fichiers
interface AuthUserRecord {
  id: number | string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user' | string;
}

interface LoginResponse {
  token: string;
  user: AuthUserRecord;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  nom?: string;
  prenom?: string;
}

interface BordereauFile {
  id: string;
  fileName: string;
  uploadDate: string;
  month: string;
  year: string;
  userId: string;
  uploadedBy: string;
}

// Login Page Component for Extranet (Accueil)
function ExtranetLoginPage({ onLogin, users }: { onLogin: (user: User) => void, users: User[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response: LoginResponse = await authAPI.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
      
      const user: User = {
        id: response.user.id.toString(),
        name: `${response.user.prenom} ${response.user.nom}`,
        email: response.user.email,
        role: response.user.role === 'admin' ? 'admin' : 'user',
        nom: response.user.nom,
        prenom: response.user.prenom
      };
      
      setIsLoading(false);
      window.location.hash = 'accueil';
      onLogin(user);
    } catch (error) {
      setIsLoading(false);
      alert(error instanceof Error ? error.message : "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header avec Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/alliance-courtage-logo.svg" 
              alt="Alliance Courtage Logo" 
              className="h-24 sm:h-28 w-auto"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Alliance Courtage
          </h1>
          <p className="text-sm text-gray-600">GROUPEMENT NATIONAL DES COURTIERS D'ASSURANCES</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-indigo-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion Extranet</h2>
            <p className="text-gray-600 text-sm">
              Accédez à votre espace utilisateur
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    alert('Veuillez d\'abord entrer votre email');
                    return;
                  }
                  
                  const isReset = window.confirm(
                    'Demander une réinitialisation de mot de passe pour ' + email + '?\n\n' +
                    '📧 Une notification sera envoyée à l\'administrateur.\n' +
                    'Vous recevrez un email avec votre nouveau mot de passe une fois que l\'administrateur aura traité votre demande.\n\n' +
                    'Cliquez sur OK pour continuer.'
                  );
                  
                  if (!isReset) return;
                  
                  try {
                    const response = await fetch(buildAPIURL('/password-reset/request'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });

                    const data = await response.json();
                    if (response.ok) {
                      alert('✅ ' + data.message + '\n\n' +
                        '📧 Vous recevrez un email avec votre nouveau mot de passe une fois que l\'administrateur aura traité votre demande dans le CMS.');
                    } else {
                      alert('❌ ' + (data.error || 'Erreur lors de la demande de réinitialisation'));
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('❌ Erreur de connexion au serveur.');
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Login Page Component for Admin (Manage)
function AdminLoginPage({ onLogin, users }: { onLogin: (user: User) => void, users: User[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response: LoginResponse = await authAPI.login(email, password);
      
      // Vérifier que l'utilisateur est admin avant de permettre l'accès à /manage
      if (response.user.role !== 'admin') {
        setIsLoading(false);
        alert('Accès refusé : Seuls les administrateurs peuvent accéder à cette page.');
        return;
      }
      
      localStorage.setItem('token', response.token);
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
      
      const user: User = {
        id: response.user.id.toString(),
        name: `${response.user.prenom} ${response.user.nom}`,
        email: response.user.email,
        role: response.user.role === 'admin' ? 'admin' : 'user',
        nom: response.user.nom,
        prenom: response.user.prenom
      };
      
      setIsLoading(false);
      window.location.hash = 'manage';
      onLogin(user);
    } catch (error) {
      setIsLoading(false);
      alert(error instanceof Error ? error.message : "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header avec Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/alliance-courtage-logo.svg" 
              alt="Alliance Courtage Logo" 
              className="h-24 sm:h-28 w-auto filter brightness-95"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Administration
          </h1>
          <p className="text-sm text-gray-700 font-medium">Panneau d'Administration Alliance Courtage</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-red-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion Administration</h2>
            <p className="text-gray-600 text-sm">
              Accès réservé aux administrateurs
            </p>
          </div>

          {/* Warning Badge */}
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-xs text-red-800 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Accès sécurisé - Identification requise
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Administrateur</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alliance.com"
                className="w-full px-4 py-3 bg-red-50 rounded-lg border-2 border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-red-50 rounded-lg border-2 border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    alert('Veuillez d\'abord entrer votre email');
                    return;
                  }
                  
                  const isAdminReset = window.confirm(
                    'Réinitialiser le mot de passe administrateur pour ' + email + '?\n\n' +
                    '📧 Vous recevrez un email avec le nouveau mot de passe.\n\n' +
                    'Cliquez sur OK pour continuer.'
                  );
                  
                  if (!isAdminReset) return;
                  
                  try {
                    const adminResponse = await fetch(buildAPIURL('/admin-password-reset/request'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });

                    const adminData = await adminResponse.json();
                    
                    if (adminResponse.ok) {
                      alert('✅ ' + adminData.message + '\n\n' +
                        '📧 Vérifiez votre boîte de réception (et les spams).\n' +
                        '🔐 Le nouveau mot de passe vous a été envoyé par email.\n\n' +
                        '⚠️ Important : Changez votre mot de passe après la première connexion !');
                    } else {
                      alert(adminData.error || 'Erreur lors de la réinitialisation');
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('❌ Erreur de connexion au serveur.');
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </span>
              ) : (
                "Accéder à l'Administration"
              )}
            </button>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
  // État de connexion avec persistance
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoginState = localStorage.getItem('isLoggedIn');
    const savedUser = localStorage.getItem('currentUser');
    return savedLoginState === 'true' && savedUser !== null;
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Get page from URL hash or default to accueil
    const hash = window.location.hash.slice(1); // Remove the # symbol
    const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-comptabilite', 'nos-archives', 'manage'];
    
    // Si l'utilisateur essaie d'accéder à /manage mais n'est pas admin, rediriger vers accueil
    const savedUser = localStorage.getItem('currentUser');
    if (hash === 'manage' && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role !== 'admin') {
          return 'accueil';
        }
      } catch (e) {
        return 'accueil';
      }
    }
    
    return validPages.includes(hash) ? hash : 'accueil';
  });

  // État pour le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to change page and update URL
  const changePage = (page: string) => {
    setCurrentPage(page);
    window.location.hash = page;
    // Fermer le menu mobile après navigation
    setIsMobileMenuOpen(false);
  };
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Update cached user if it's VALOSA to use new name
        if (user.name === 'VALOSA') {
          user.name = 'JEAN MARTIN';
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        return user;
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  });
  
  // Users loaded from database - no static users needed
  const users: User[] = [];

  // Profile management state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: ''
  });

  // Load unread notifications count
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const loadUnreadCount = async () => {
        try {
          const data = await notificationsAPI.getUnreadCount();
          setNotificationCount(data.count || 0);
        } catch (error) {
          console.error('Error loading unread count:', error);
        }
      };
      
      loadUnreadCount();
      // Refresh every 15 seconds pour une mise à jour plus rapide
      const interval = setInterval(loadUnreadCount, 15000);
      
      // Écouter les événements de notification lue pour rafraîchir immédiatement
      const handleNotificationRead = () => {
        loadUnreadCount();
      };
      window.addEventListener('notificationRead', handleNotificationRead);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationRead', handleNotificationRead);
      };
    } else {
      setNotificationCount(0);
    }
  }, [isLoggedIn, currentUser]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Update profile data when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      // Extract nom and prenom from name if they exist separately
      const nom = (currentUser as any).nom || currentUser.name?.split(' ').slice(-1)[0] || '';
      const prenom = (currentUser as any).prenom || currentUser.name?.split(' ').slice(0, -1).join(' ') || '';
      setProfileData({
        nom,
        prenom,
        email: currentUser.email || ''
      });
      
    }
  }, [currentUser, showProfileModal]);

  // Initialize URL hash and listen for hash changes
  // Must be after currentUser declaration to avoid initialization order issues
  useEffect(() => {
    // Correction automatique de la faute de frappe "acceuil" -> "accueil"
    const currentHash = window.location.hash.slice(1);
    if (currentHash === 'acceuil') {
      window.location.hash = 'accueil';
      return;
    }
    
    // Set initial hash if none exists (mais pas si on vient de /manage)
    const comingFromManage = sessionStorage.getItem('comingFromManage') === 'true';
    
    if (!currentHash && !comingFromManage) {
      window.location.hash = 'accueil';
    }
    
    // Nettoyer le flag après utilisation
    if (comingFromManage) {
      sessionStorage.removeItem('comingFromManage');
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      
      // Correction automatique de la faute de frappe "acceuil" -> "accueil"
      if (hash === 'acceuil') {
        window.location.hash = 'accueil';
        setCurrentPage('accueil');
        return;
      }
      
      const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-comptabilite', 'nos-archives', 'notifications', 'favoris', 'manage'];
      
      // Bloquer l'accès à /manage si l'utilisateur n'est pas admin
      if (hash === 'manage' && currentUser && currentUser.role !== 'admin') {
        alert('Accès refusé : Seuls les administrateurs peuvent accéder à cette page.');
        window.location.hash = 'accueil';
        setCurrentPage('accueil');
        return;
      }
      
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    // Vérifier aussi au chargement initial
    const initialHash = window.location.hash.slice(1);
    
    // Correction automatique de la faute de frappe "acceuil" -> "accueil"
    if (initialHash === 'acceuil') {
      window.location.hash = 'accueil';
      setCurrentPage('accueil');
      return;
    }
    
    if (initialHash === 'manage' && currentUser && currentUser.role !== 'admin') {
      alert('Accès refusé : Seuls les administrateurs peuvent accéder à cette page.');
      window.location.hash = 'accueil';
      setCurrentPage('accueil');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Données bordereaux (simulation) - VIDÉES POUR LE TEST
  const [bordereaux, setBordereaux] = useState<BordereauFile[]>([]);

  // Fonction pour détecter les initiales dans le nom du fichier
  const detectUserFromFileName = (fileName: string): User[] => {
    const fileNameUpper = fileName.toUpperCase();
    const detectedUsers: User[] = [];
    
    console.log('🔍 Détection pour fichier:', fileName);
    
    // Chercher les 2 premières lettres au DÉBUT du nom du fichier
    for (const user of users.filter(u => u.role === 'user')) {
      const initials = user.name.substring(0, 2).toUpperCase();
      // Détecter si le fichier commence par les 2 lettres
      const isDetected = fileNameUpper.startsWith(initials);
      console.log(`  - ${user.name} (${initials}) au début de "${fileNameUpper}" ?`, isDetected);
      if (isDetected) {
        detectedUsers.push(user);
      }
    }
    
    console.log('✅ Utilisateurs détectés:', detectedUsers.map(u => u.name));
    return detectedUsers;
  };

  // Fonction pour vider tous les bordereaux
  const clearAllBordereaux = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer TOUS les bordereaux ?\n\nCette action est irréversible.')) {
      setBordereaux([]);
      alert('✅ Tous les bordereaux ont été effacés !');
    }
  };

  // Fonction pour uploader des fichiers avec détection automatique
  const handleFileUpload = (file: File) => {
    const currentDate = new Date();
    const uploadDate = currentDate.toISOString().split('T')[0];
    
    // Extraire le mois et l'année du nom du fichier
    let month = 'Janvier'; // Par défaut
    let year = currentDate.getFullYear().toString(); // Par défaut année actuelle
    
    // Détecter le mois dans le nom du fichier
    const fileNameUpper = file.name.toUpperCase();
    if (fileNameUpper.includes('JANVIER')) month = 'Janvier';
    else if (fileNameUpper.includes('FEVRIER')) month = 'Février';
    else if (fileNameUpper.includes('MARS')) month = 'Mars';
    else if (fileNameUpper.includes('AVRIL')) month = 'Avril';
    else if (fileNameUpper.includes('MAI')) month = 'Mai';
    else if (fileNameUpper.includes('JUIN')) month = 'Juin';
    else if (fileNameUpper.includes('JUILLET')) month = 'Juillet';
    else if (fileNameUpper.includes('AOUT')) month = 'Août';
    else if (fileNameUpper.includes('SEPTEMBRE')) month = 'Septembre';
    else if (fileNameUpper.includes('OCTOBRE')) month = 'Octobre';
    else if (fileNameUpper.includes('NOVEMBRE')) month = 'Novembre';
    else if (fileNameUpper.includes('DECEMBRE')) month = 'Décembre';
    
    // Détecter l'année dans le nom du fichier
    const yearMatch = file.name.match(/20\d{2}/);
    if (yearMatch) {
      year = yearMatch[0];
    }
    
    // Détecter les utilisateurs à partir du nom du fichier
    const targetUsers = detectUserFromFileName(file.name);
    
    if (targetUsers.length === 0) {
      alert(`Aucun utilisateur détecté dans le nom du fichier "${file.name}".\n\nUtilisez les 2 premières lettres AU DÉBUT du nom :\n- MA pour MARTIN\n- RA pour RICHARD\n- BE pour BERNARD\n- etc.\n\nExemple : MA_Rapport_Janvier_2025.pdf ou MA.pdf`);
      return;
    }
    
    // Créer un bordereau pour chaque utilisateur détecté
    const newBordereaux: BordereauFile[] = targetUsers.map(user => ({
      id: `${Date.now()}_${user.id}`,
      fileName: file.name,
      uploadDate: uploadDate,
      month: month,
      year: year,
      userId: user.id,
      uploadedBy: currentUser?.name || 'Admin'
    }));
    
    // Debug: Vérifier l'assignation
    console.log('📁 Fichier uploadé:', file.name);
    console.log('📅 Mois détecté:', month);
    console.log('📅 Année détectée:', year);
    console.log('👥 Utilisateurs assignés:', targetUsers.map(u => `${u.name} (${u.id})`));
    console.log('📋 Bordereaux créés:', newBordereaux.map(b => `${b.fileName} → ${b.userId} (${b.month} ${b.year})`));
    
    setBordereaux(prev => {
      const newState = [...prev, ...newBordereaux];
      console.log('📊 État des bordereaux après upload:', newState);
      console.log('📊 Nombre total de bordereaux:', newState.length);
      return newState;
    });
    
    // Message de confirmation avec les utilisateurs détectés
    const userNames = targetUsers.map(u => u.name).join(', ');
    alert(`Fichier "${file.name}" uploadé avec succès pour :\n${userNames}\n\n(${targetUsers.length} utilisateur${targetUsers.length > 1 ? 's' : ''})`);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "accueil":
        return <HomePage />;
      case "gamme-produits":
        return <GammeProduitsPage />;
      case "partenaires":
        return <PartenairesPage />;
      case "gamme-financiere":
        return <GammeFinancierePage />;
      case "rencontres":
        return <RencontresPage />;
      case "reglementaire":
        return <ReglementairePage currentUser={currentUser} />;
      case "produits-structures":
        return <ProduitsStructuresPageComponent />;
      case "simulateurs":
        return <SimulateursPage />;
      case "comptabilite":
        return <ComptabilitePage currentUser={currentUser} bordereaux={bordereaux} />;
      case "gestion-comptabilite":
        return <GestionComptabilitePage currentUser={currentUser} />;
      case "nos-archives":
        return <NosArchivesPageComponent />;
      case "notifications":
        return <NotificationsPage />;
      case "favoris":
        return <FavorisPage />;
              case "manage":
        return <ManagePage />;
      default:
        return <HomePage />;
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher la page de login appropriée
  if (!isLoggedIn) {
    // Déterminer quelle page de login afficher selon l'URL
    const hash = window.location.hash.slice(1);
    const isManagePage = hash === 'manage';
    
    if (isManagePage) {
      // Page de login Admin pour /manage
      return <AdminLoginPage onLogin={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentPage('manage');
        window.location.hash = 'manage';
      }} users={users} />;
    } else {
      // Page de login Extranet pour /accueil (ou autres pages)
      return <ExtranetLoginPage onLogin={(user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentPage('accueil');
        window.location.hash = 'accueil';
    }} users={users} />;
    }
  }

  // Render ManagePage independently without sidebar
  // Vérifier que seul un admin peut accéder à /manage
  if (currentPage === "manage") {
    // Si l'utilisateur n'est pas admin, bloquer l'accès
    if (currentUser?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-red-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚫</span>
              </div>
              <h1 className="text-3xl font-bold text-red-800 mb-4">Accès Refusé</h1>
              <p className="text-lg text-gray-700 mb-6">
                Seuls les administrateurs peuvent accéder à la page de gestion.
              </p>
              <p className="text-sm text-gray-600 mb-8">
                Vous êtes connecté en tant qu'utilisateur. Veuillez vous connecter avec un compte administrateur pour accéder à cette page.
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  window.location.hash = 'manage';
                  window.location.reload();
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Déconnexion et reconnexion
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <ManagePage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Logo et Branding */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Menu Hamburger pour mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Logo placed above Accueil (left of header) */}
              <img 
                src="/alliance-courtage-logo.svg" 
                alt="Alliance Courtage Logo" 
                className="h-12 sm:h-16 md:h-20 w-auto"
              />
              {/* Texte de marque */}
              <div>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
              {/* Notifications Button */}
              <button
                onClick={() => {
                  setCurrentPage('notifications');
                  window.location.hash = 'notifications';
                }}
                className={`relative p-2 rounded-lg transition-all flex-shrink-0 ${
                  notificationCount > 0 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50 animate-pulse' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={notificationCount > 0 ? `${notificationCount} nouvelle(s) notification(s)` : 'Notifications'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className={`absolute top-0 right-0 block h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center transform translate-x-1/2 -translate-y-1/2 shadow-lg ${
                    notificationCount > 9 ? 'min-w-[1.5rem] px-1' : ''
                  } animate-bounce`}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <div className="text-right hidden sm:block flex-shrink-0">
                <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">
                  {currentUser?.role === 'admin' ? 'Super Admin' : 'Utilisateur'}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">{currentUser?.name?.charAt(0)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <span className="hidden sm:inline">Gérer profil</span>
                <span className="sm:hidden">Profil</span>
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  // Nettoyer localStorage lors de la déconnexion
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('manageAuth');
                  // Si on est sur /manage, rediriger vers la page de login /manage
                  if (currentPage === 'manage') {
                    window.location.hash = 'manage';
                    window.location.reload();
                  } else {
                    window.location.hash = 'accueil';
                  }
                }}
                className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
              >
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Déco</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Overlay pour mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`w-full lg:w-72 bg-white/80 backdrop-blur-sm border-r border-gray-200 lg:min-h-screen transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative z-50 lg:z-auto h-full lg:h-auto`}>
          <nav className="p-4 sm:p-6">
            {/* Bouton fermer pour mobile */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => changePage("accueil")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "accueil" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "accueil" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "accueil" ? "font-semibold" : ""}>Accueil</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("gamme-produits")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "gamme-produits" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "gamme-produits" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "gamme-produits" ? "font-semibold" : ""}>Gamme Produits</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    console.log("Clicking on Partenaires, current page:", currentPage);
                    changePage("partenaires");
                    console.log("Setting page to partenaires");
                  }}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "partenaires" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "partenaires" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "partenaires" ? "font-semibold" : ""}>Partenaires</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("gamme-financiere")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "gamme-financiere" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "gamme-financiere" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "gamme-financiere" ? "font-semibold" : ""}>Gamme Financière</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("produits-structures")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "produits-structures" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "produits-structures" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "produits-structures" ? "font-semibold" : ""}>Produits structurés</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("simulateurs")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "simulateurs" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "simulateurs" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "simulateurs" ? "font-semibold" : ""}>Simulateurs</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("rencontres")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "rencontres" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "rencontres" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "rencontres" ? "font-semibold" : ""}>Rencontres Alliance Courtage</span>
                </button>
              </li>

              <li>
                <button 
                  onClick={() => changePage("comptabilite")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "comptabilite" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "comptabilite" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "comptabilite" ? "font-semibold" : ""}>Comptabilité</span>
                </button>
              </li>
              {currentUser?.role === 'admin' && (
                <li>
                  <button 
                    onClick={() => changePage("gestion-comptabilite")}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                      currentPage === "gestion-comptabilite" 
                        ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md ${
                      currentPage === "gestion-comptabilite" ? "bg-white/20" : "border-2 border-gray-400"
                    }`}></div>
                    <span className={currentPage === "gestion-comptabilite" ? "font-semibold" : ""}>Gestion Comptabilité</span>
                  </button>
                </li>
              )}
              
              <li>
                <button 
                  onClick={() => changePage("reglementaire")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "reglementaire" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "reglementaire" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "reglementaire" ? "font-semibold" : ""}>Règlementaire</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("nos-archives")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "nos-archives" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "nos-archives" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "nos-archives" ? "font-semibold" : ""}>Nos Archives</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changePage("favoris")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "favoris" 
                      ? "bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "favoris" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "favoris" ? "font-semibold" : ""}>⭐ Mes Favoris</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>

      {/* Profile Management Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gérer mon profil</h2>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setActiveTab('profile');
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Profil
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'password'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Mot de passe
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser?.id) return;

                    setProfileLoading(true);
                    try {
                      const response = await fetch(buildAPIURL(`/users/${currentUser.id}/profile`), {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-auth-token': localStorage.getItem('token') || ''
                        },
                        body: JSON.stringify({
                          nom: profileData.nom,
                          prenom: profileData.prenom
                        })
                      });

                      const data = await response.json();

                      if (response.ok) {
                        alert('✅ Profil mis à jour avec succès !');
                        // Update currentUser in localStorage
                        const updatedUser: User = {
                          ...currentUser,
                          nom: profileData.nom,
                          prenom: profileData.prenom,
                          name: `${profileData.prenom} ${profileData.nom}`
                        };
                        setCurrentUser(updatedUser);
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        setShowProfileModal(false);
                      } else {
                        alert('❌ ' + (data.error || 'Erreur lors de la mise à jour'));
                      }
                    } catch (error) {
                      console.error('Error updating profile:', error);
                      alert('❌ Erreur lors de la mise à jour du profil');
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        value={profileData.nom}
                        onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        value={profileData.prenom}
                        onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {profileLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProfileModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser?.id) return;

                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      alert('❌ Les mots de passe ne correspondent pas');
                      return;
                    }

                    if (passwordData.newPassword.length < 6) {
                      alert('❌ Le mot de passe doit contenir au moins 6 caractères');
                      return;
                    }

                    setProfileLoading(true);
                    try {
                      const response = await fetch(buildAPIURL(`/users/${currentUser.id}/password`), {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-auth-token': localStorage.getItem('token') || ''
                        },
                        body: JSON.stringify({
                          currentPassword: passwordData.currentPassword,
                          newPassword: passwordData.newPassword
                        })
                      });

                      const data = await response.json();

                      if (response.ok) {
                        alert('✅ Mot de passe modifié avec succès !');
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowProfileModal(false);
                      } else {
                        alert('❌ ' + (data.error || 'Erreur lors de la modification'));
                      }
                    } catch (error) {
                      console.error('Error updating password:', error);
                      alert('❌ Erreur lors de la modification du mot de passe');
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {profileLoading ? 'Modification...' : 'Modifier le mot de passe'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setShowProfileModal(false);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Home Page Component - Now loads content dynamically from CMS
function HomePage() {
  interface HomePageContent {
    welcomeTitle: string;
    news: Array<{ title: string; content: string; date: string; color: string }>;
    services: Array<{ name: string }>;
  }

  const [content, setContent] = useState<HomePageContent>({
    welcomeTitle: 'Bienvenue chez Alliance Courtage',
    news: [],
    services: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/home'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.content) setContent(JSON.parse(data.content));
      }
    } catch (error) {
      console.error('Error loading CMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = { indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500', green: 'bg-green-500', blue: 'bg-blue-500' };
    return colors[color] || 'bg-indigo-500';
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{content.welcomeTitle}</h1>
      </div>

      {/* News Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Actualités</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {content.news && content.news.length > 0 ? (
            content.news.map((newsItem, index) => (
              <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{newsItem.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">{newsItem.content}</p>
                  <span className="text-xs text-gray-500">{newsItem.date}</span>
            </div>
          </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Services Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Nos Services</h3>
          <ul className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
            {content.services && content.services.length > 0 ? (
              content.services.map((service, index) => (
                <li key={index}>• {service.name}</li>
              ))
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Gamme Produits Page Component
function GammeProduitsPage() {
  const [selectedClientType, setSelectedClientType] = useState("particulier");
  const [selectedProductType, setSelectedProductType] = useState("epargne");
  const [cmsProducts, setCmsProducts] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clientTypes = [
    { id: "particulier", name: "Particulier", icon: "👤" },
    { id: "professionnel", name: "Professionnel", icon: "💼" },
    { id: "entreprise", name: "Entreprise", icon: "🏢" }
  ];

  const productTypes = [
    { id: "epargne", name: "Épargne" },
    { id: "retraite", name: "Retraite" },
    { id: "prevoyance", name: "Prévoyance" },
    { id: "sante", name: "Santé" },
    { id: "cif", name: "Conseil en investissement financier" }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(buildAPIURL('/cms/gamme-produits'), {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.content) {
            setCmsProducts(JSON.parse(data.content));
          }
        }
      } catch {
        // ignore and fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getProducts = () => {
    const fallback = {
      particulier: {
        epargne: ["Assurance vie", "Capitalisation", "PEA assurance"],
        retraite: ["PER"],
        prevoyance: ["Assurance décès / invalidité / incapacité", "Assurance emprunteur"],
        sante: ["Mutuelle santé"],
        cif: ["SCPI", "Private Equity", "Défiscalisation", "Diversification"]
      },
      professionnel: {
        epargne: ["Capitalisation", "PEE"],
        retraite: ["PER", "PERCO"],
        prevoyance: ["Assurance décès / invalidité / incapacité", "Assurance emprunteur"],
        sante: ["Mutuelle santé"],
        cif: ["Conseil professionnel", "Investissements professionnels", "Gestion patrimoniale", "Placements spécialisés"]
      },
      entreprise: {
        epargne: ["Capitalisation", "PEE", "Intéressement", "Participation", "IFC"],
        retraite: ["PER Entreprise", "PERCO"],
        prevoyance: ["Prévoyance collective"],
        sante: ["Mutuelle santé collective"],
        cif: ["Conseil d'entreprise", "Investissements corporatifs", "Gestion financière", "Stratégies d'investissement"]
      }
    };
    const matrix = cmsProducts?.products || fallback;
    return (matrix[selectedClientType] && matrix[selectedClientType][selectedProductType]) || [];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{cmsProducts?.title || 'Gamme Produits'}</h1>
        {!loading && (
        <p className="text-gray-600 text-lg">
            {cmsProducts?.subtitle || 'Découvrez nos solutions adaptées à chaque type de client et de produit'}
        </p>
        )}
      </div>

      {/* Client Type Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Type de Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clientTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedClientType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedClientType === type.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium text-gray-800">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Type de Produit</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(cmsProducts?.products && Object.keys(cmsProducts.products[selectedClientType] || {}).length > 0
            ? Object.keys(cmsProducts.products[selectedClientType] || {}).map((k: string) => ({ id: k, name: k }))
            : productTypes
          ).map((type: any) => (
            <button
              key={type.id}
              onClick={() => setSelectedProductType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedProductType === type.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Produits {clientTypes.find(t => t.id === selectedClientType)?.name} - {(
            cmsProducts?.products && cmsProducts.products[selectedClientType] && cmsProducts.products[selectedClientType][selectedProductType]
              ? selectedProductType
              : productTypes.find(t => t.id === selectedProductType)?.name
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getProducts().map((product, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800">{product}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Solution adaptée aux besoins spécifiques
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Interface pour les partenaires
interface Partner {
  id: number;
  nom: string;
  description?: string;
  website?: string;
  site?: string;
  logoUrl?: string;
  logo_url?: string;
  category?: string;
  is_active?: boolean;
  documents?: Array<{
    nom: string;
    type: string;
    date: string;
  }>;
}

// Partenaires Page Component
function PartenairesPage() {
  const [selectedCategory, setSelectedCategory] = useState("tous");
  const [partenaires, setPartenaires] = useState<{ coa: Partner[]; cif: Partner[] }>({ coa: [], cif: [] });
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState({
    title: 'Nos Partenaires',
    subtitle: 'Découvrez nos partenaires de confiance en assurance et finance',
    description: '',
    headerImage: ''
  });

  // Charger les partenaires depuis l'API avec cache
  useEffect(() => {
    const loadPartenaires = async () => {
      try {
        setLoading(true);
        
        // Try cache first
        const { getCachedData, setCachedData, CACHE_KEYS, CACHE_TTL } = await import('./utils/cache');
        const cached = getCachedData<Partner[]>(CACHE_KEYS.PARTNERS);
        
        if (cached) {
          console.log('📊 Partners loaded from cache:', cached.length);
          // Organiser par catégorie
          const coa = cached.filter((p: Partner) => p.is_active && (p.category === 'coa' || p.category?.toLowerCase() === 'coa'));
          const cif = cached.filter((p: Partner) => p.is_active && (p.category === 'cif' || p.category?.toLowerCase() === 'cif'));
          setPartenaires({ coa, cif });
          setLoading(false);
          return;
        }
        
        // Load from API
        const response = await fetch(buildAPIURL('/partners?active=false'));
        const data = await response.json();
        
        console.log('📊 Partners loaded from API:', data.length);
        
        // Filter out large base64 logos before caching to avoid quota issues
        const dataForCache = data.map((partner: Partner) => {
          // Remove logo_content if it's too large (over 100KB)
          if (partner.logo_content) {
            const logoSize = partner.logo_content.length;
            if (logoSize > 100 * 1024) { // 100KB
              console.warn(`Removing large logo_content from partner ${partner.id} (${(logoSize / 1024).toFixed(2)}KB)`);
              return { ...partner, logo_content: undefined };
            }
          }
          return partner;
        });
        
        // Cache the data (without large logos)
        setCachedData(CACHE_KEYS.PARTNERS, dataForCache, CACHE_TTL.LONG);
        
        // Use original data for display (with logos)
        // Organiser par catégorie (only active partners for display)
        const coa: Partner[] = data.filter((p: Partner) => p.is_active && (p.category === 'coa' || p.category?.toLowerCase() === 'coa'));
        const cif: Partner[] = data.filter((p: Partner) => p.is_active && (p.category === 'cif' || p.category?.toLowerCase() === 'cif'));
        
        setPartenaires({ coa, cif });
        
        console.log(`✅ Active COA: ${coa.length}, Active CIF: ${cif.length}`);
      } catch (error) {
        console.error('Erreur chargement partenaires:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPartenaires();
    loadContent();
  }, []);

  // Load CMS content
  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/partenaires'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          const parsedContent = JSON.parse(data.content);
          if (typeof parsedContent === 'string') {
            setPageContent(JSON.parse(parsedContent));
          } else {
            setPageContent(parsedContent);
          }
        }
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
    }
  };

  const getFilteredPartenaires = (): Partner[] => {
    if (selectedCategory === "coa") return partenaires.coa;
    if (selectedCategory === "cif") return partenaires.cif;
    return [...partenaires.coa, ...partenaires.cif];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        {pageContent.headerImage && (
          <div className="mb-6">
            <img 
              src={pageContent.headerImage} 
              alt="Header" 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{pageContent.title}</h1>
        <p className="text-gray-600 text-lg">
          {pageContent.subtitle}
        </p>
        {pageContent.description && (
          <p className="text-gray-600 mt-2">{pageContent.description}</p>
        )}
      </div>

      {/* Filtres par catégorie */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrer par catégorie</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedCategory("tous")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "tous"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous les partenaires
          </button>
          <button
            onClick={() => setSelectedCategory("coa")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "coa"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Partenaires COA
          </button>
          <button
            onClick={() => setSelectedCategory("cif")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "cif"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Partenaires CIF
          </button>
        </div>
      </div>

      {/* Affichage des partenaires */}
      <div className="space-y-8">
        {/* Section Partenaires COA */}
        {(selectedCategory === "tous" || selectedCategory === "coa") && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">COA</span>
              Partenaires Courtiers en Assurances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partenaires.coa.map((partenaire: Partner, index: number) => (
                <div key={`coa-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center p-6 ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {(partenaire.logoUrl || partenaire.logo_url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                      <img 
                          src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                          className="max-h-20 max-w-[90%] w-auto h-auto object-contain"
                          style={{ 
                            maxHeight: '80px',
                            maxWidth: '90%',
                            width: 'auto',
                            height: 'auto'
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', partenaire.logoUrl || partenaire.logo_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {partenaire.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.website || partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels (seulement pour les fallback avec documents) */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                        {partenaire.documents.slice(0, 2).map((doc: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {/* Description (seulement pour les partenaires de la DB) */}
                    {(!partenaire.documents || !Array.isArray(partenaire.documents)) && partenaire.description && (
                      <p className="text-xs text-gray-600 text-center line-clamp-2">{partenaire.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Partenaires CIF */}
        {(selectedCategory === "tous" || selectedCategory === "cif") && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">CIF</span>
              Partenaires Conseillers en Investissements Financiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partenaires.cif.map((partenaire: Partner, index: number) => (
                <div key={`cif-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center p-6 ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {(partenaire.logoUrl || partenaire.logo_url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                      <img 
                          src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                          className="max-h-20 max-w-[90%] w-auto h-auto object-contain"
                          style={{ 
                            maxHeight: '80px',
                            maxWidth: '90%',
                            width: 'auto',
                            height: 'auto'
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', partenaire.logoUrl || partenaire.logo_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {partenaire.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.website || partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels (seulement pour les fallback avec documents) */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                        {partenaire.documents.slice(0, 2).map((doc: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {/* Description (seulement pour les partenaires de la DB) */}
                    {(!partenaire.documents || !Array.isArray(partenaire.documents)) && partenaire.description && (
                      <p className="text-xs text-gray-600 text-center line-clamp-2">{partenaire.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Protocoles */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Protocoles et Documents Contractuels</h2>
        <div className="space-y-4">
          {getFilteredPartenaires()
            .filter((partenaire: Partner) => partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0)
            .map((partenaire: Partner) => (
            <div key={partenaire.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{partenaire.nom}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {partenaire.documents.map((doc: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                        {doc.type}
                      </span>
                      <span className="text-xs text-gray-500">{doc.date}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-800">{doc.nom}</div>
                    <button className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                      📄 Voir le document
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
  );
}

// Rencontres GNCA Page Component
function RencontresPage() {
  const [content, setContent] = useState<any>({
    title: 'RENCONTRES',
    subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
    headerImage: '',
    introText: '',
    upcomingMeetings: [],
    historicalMeetings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/rencontres'), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          try {
            let parsedContent = data.content;
            
            // Si c'est une string, parser une première fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // Si le résultat est encore une string, parser une deuxième fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // S'assurer que les propriétés existent
            setContent({
              title: parsedContent.title || 'RENCONTRES',
              subtitle: parsedContent.subtitle || 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
              headerImage: parsedContent.headerImage || '',
              introText: parsedContent.introText || '',
              upcomingMeetings: Array.isArray(parsedContent.upcomingMeetings) ? parsedContent.upcomingMeetings : [],
              historicalMeetings: Array.isArray(parsedContent.historicalMeetings) ? parsedContent.historicalMeetings : []
            });
          } catch (parseError) {
            // Silencieusement utiliser les valeurs par défaut si le JSON est corrompu
            // Ne pas logger l'erreur pour éviter le spam dans la console
            setContent({
              title: 'RENCONTRES',
              subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
              headerImage: '',
              introText: '',
              upcomingMeetings: [],
              historicalMeetings: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu CMS:', error);
      // En cas d'erreur, utiliser les valeurs par défaut
      setContent({
        title: 'RENCONTRES',
        subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
        headerImage: '',
        introText: '',
        upcomingMeetings: [],
        historicalMeetings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      'indigo': 'from-indigo-50 to-purple-50 border-indigo-200 text-indigo-800 bg-indigo-500',
      'purple': 'from-purple-50 to-pink-50 border-purple-200 text-purple-800 bg-purple-500',
      'pink': 'from-pink-50 to-rose-50 border-pink-200 text-pink-800 bg-pink-500',
      'blue': 'from-blue-50 to-cyan-50 border-blue-200 text-blue-800 bg-blue-500',
      'green': 'from-green-50 to-emerald-50 border-green-200 text-green-800 bg-green-500',
      'yellow': 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800 bg-yellow-500',
      'red': 'from-red-50 to-rose-50 border-red-200 text-red-800 bg-red-500',
      'orange': 'from-orange-50 to-amber-50 border-orange-200 text-orange-800 bg-orange-500'
    };
    return colors[color] || colors['indigo'];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div 
        className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 relative ${content.headerImage ? '' : ''}`}
        style={content.headerImage ? {
          backgroundImage: `url(${content.headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '300px'
        } : {}}
      >
        {/* Overlay très léger seulement pour améliorer la lisibilité du texte */}
        {content.headerImage && (
          <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        )}
        <div className="relative z-10">
          <div className={content.headerImage ? 'bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg' : ''}>
            <h1 className={`text-3xl font-bold mb-4 ${content.headerImage ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
              {content.title || 'RENCONTRES'}
            </h1>
            <p className={`text-lg ${content.headerImage ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
              {content.subtitle || 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage'}
            </p>
            {content.introText && (
              <div className={`mt-4 p-4 rounded-lg ${content.headerImage ? 'bg-white/10 backdrop-blur-sm border border-white/20' : 'bg-gray-50'}`}>
                <p className={content.headerImage ? 'text-white italic' : 'text-gray-700 italic'}>{content.introText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Rencontres Actuelles */}
      {content.upcomingMeetings && content.upcomingMeetings.length > 0 && (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📅</span>
          Prochaines Rencontres
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.upcomingMeetings.map((meeting: any, index: number) => {
              const colorInfo = getColorClasses(meeting.color || 'indigo');
              const [gradient, border, textColor, buttonColor] = colorInfo.split(' ');
              
              return (
                <div key={index} className={`bg-gradient-to-br ${gradient} p-6 rounded-xl border ${border}`}>
            <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${textColor}`}>{meeting.title}</h3>
                    <span className={`${buttonColor} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {meeting.date}
                    </span>
            </div>
                  {meeting.description && (
                    <p className="text-gray-700 mb-4">{meeting.description}</p>
                  )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {meeting.location && <span>📍 {meeting.location}</span>}
                    {meeting.time && <span>⏰ {meeting.time}</span>}
            </div>
                  <button className={`mt-4 ${buttonColor} hover:opacity-90 text-white px-4 py-2 rounded-lg transition-colors`}>
              S'inscrire
            </button>
          </div>
              );
            })}
        </div>
      </div>
      )}

      {/* Section Historique des Rencontres */}
      {content.historicalMeetings && content.historicalMeetings.length > 0 && (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📚</span>
          Historique des Rencontres
        </h2>
        
        <div className="space-y-4">
            {content.historicalMeetings.map((meeting: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
                  <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">{meeting.date}</p>
            </div>
                {meeting.reportUrl ? (
                  <a
                    href={meeting.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
              📄 Voir le compte-rendu
                  </a>
                ) : (
                  <button className="text-gray-400 text-sm font-medium cursor-not-allowed">
                    📄 Compte-rendu non disponible
            </button>
                )}
          </div>
            ))}
            </div>
          </div>
      )}

      {/* Section Echanges - Cachée pour l'instant */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 opacity-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">💬</span>
          Espace Echanges
          <span className="ml-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Bientôt disponible
          </span>
        </h2>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Espace en construction</h3>
          <p className="text-gray-500">
            L'espace d'échanges sera bientôt disponible pour permettre aux membres GNCA 
            de partager leurs expériences et de collaborer.
          </p>
        </div>
      </div>


    </div>
  );
}

// Règlementaire Page Component
function ReglementairePage({ currentUser }: { currentUser: User | null }) {
  const [expandedFolders, setExpandedFolders] = useState<{[key: string]: boolean}>({});
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingReglementaire, setLoadingReglementaire] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedFormationType, setSelectedFormationType] = useState('validantes'); // 'validantes' ou 'obligatoires'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'CIF', 'IAS', 'IOB', 'IMMOBILIER'
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nom_document: '',
    date: '',
    heures: '',
    categories: [] as string[],
    delivree_par: '',
    year: '2025',
    file: null as File | null
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Load réglementaire folders and documents from API
  useEffect(() => {
    const loadReglementaire = async () => {
      try {
        setLoadingReglementaire(true);
        const token = localStorage.getItem('token');
        
        // Load folders
        const foldersResponse = await fetch(buildAPIURL('/reglementaire/folders'), {
          headers: { 'x-auth-token': token || '' }
        });
        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          setFolders(foldersData);
        }
        
        // Load documents
        const documentsResponse = await fetch(buildAPIURL('/reglementaire/documents'), {
          headers: { 'x-auth-token': token || '' }
        });
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData);
        }
      } catch (error) {
        console.error('Error loading réglementaire:', error);
      } finally {
        setLoadingReglementaire(false);
      }
    };
    loadReglementaire();
  }, []);

  // Load formations from API
  useEffect(() => {
    const loadFormations = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const data = await formationsAPI.getAll({ year: selectedYear });
        setFormations(data);
      } catch (error) {
        console.error('Error loading formations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFormations();
  }, [selectedYear, currentUser?.id]);

  // Handle form submission
  const handleSubmitFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.nom_document || !formData.date || !formData.heures || formData.categories.length === 0) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setSubmitting(true);
    try {
      const formationData = {
        file: formData.file,
        nom_document: formData.nom_document,
        date: formData.date,
        heures: formData.heures,
        categories: formData.categories,
        delivree_par: formData.delivree_par,
        year: formData.year
      };

      const data = await formationsAPI.create(formationData);
      alert('✅ ' + data.message);
      setShowAddForm(false);
      setFormData({
        nom_document: '',
        date: '',
        heures: '',
        categories: [],
        delivree_par: '',
        year: selectedYear,
        file: null
      });
      // Reload formations
      const reloadData = await formationsAPI.getAll({ year: selectedYear });
      setFormations(reloadData);
    } catch (error: any) {
      console.error('Error submitting formation:', error);
      alert('Erreur: ' + (error.message || 'Erreur lors de la soumission de la formation'));
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Données des formations par année et catégorie (pour les heures obligatoires)
  const formationsData = {
    '2024': {
      validantes: [
        {
          id: 1,
          date: '15/03/2024',
          statut: 'Validée',
          heures: 7,
          delivreePar: 'Formation Pro',
          nomDocument: 'Formation CIF - Gestion de portefeuille',
          categories: ['CIF'],
          documentUrl: '#'
        },
        {
          id: 2,
          date: '22/06/2024',
          statut: 'Validée',
          heures: 5,
          delivreePar: 'Institut IAS',
          nomDocument: 'Formation IAS - Nouvelles réglementations',
          categories: ['IAS'],
          documentUrl: '#'
        },
        {
          id: 3,
          date: '10/09/2024',
          statut: 'Validée',
          heures: 8,
          delivreePar: 'Centre Formation',
          nomDocument: 'Formation Multi-catégories - Conformité',
          categories: ['CIF', 'IAS', 'IOB'],
          documentUrl: '#'
        }
      ],
      obligatoires: {
        CIF: 12,
        IAS: 8,
        IOB: 6,
        IMMOBILIER: 4
      }
    },
    '2025': {
      validantes: [
        {
          id: 4,
          date: '18/01/2025',
          statut: 'En cours',
          heures: 6,
          delivreePar: 'Formation Pro',
          nomDocument: 'Formation CIF 2025 - Marchés financiers',
          categories: ['CIF'],
          documentUrl: '#'
        },
        {
          id: 5,
          date: '25/02/2025',
          statut: 'Validée',
          heures: 4,
          delivreePar: 'Institut IAS',
          nomDocument: 'Formation IAS - Mise à jour réglementaire',
          categories: ['IAS'],
          documentUrl: '#'
        }
      ],
      obligatoires: {
        CIF: 8,
        IAS: 6,
        IOB: 4,
        IMMOBILIER: 3
      }
    },
    '2026': {
      validantes: [],
      obligatoires: {
        CIF: 0,
        IAS: 0,
        IOB: 0,
        IMMOBILIER: 0
      }
    }
  };

  // Années disponibles
  const availableYears = ['2024', '2025', '2026'];

  // Filtrer les formations selon la catégorie sélectionnée
  const getFilteredFormations = () => {
    // Use approved formations from API
    const approvedFormations = formations.filter(f => f.statut === 'approved');
    if (selectedCategory === 'all') {
      return approvedFormations;
    }
    return approvedFormations.filter(formation => formation.categories.includes(selectedCategory));
  };

  // Calculer le total d'heures par catégorie pour l'année sélectionnée
  const getTotalHoursByCategory = (category: string) => {
    const approvedFormations = formations.filter(f => f.statut === 'approved');
    return approvedFormations
      .filter(formation => formation.categories.includes(category))
      .reduce((total, formation) => total + (formation.heures || 0), 0);
  };

  // Get documents for a specific folder
  const getDocumentsForFolder = (folderId: number) => {
    return documents.filter(doc => doc.folder_id === folderId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Bibliothèque Règlementaire</h1>
        <p className="text-gray-600 text-lg">
          Documents types en version Word pour la mise en conformité de votre cabinet
        </p>
      </div>

      {/* Navigation par Année */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sélection de l'Année</h2>
          <div className="flex space-x-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Formations Obligatoires */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-red-800 to-red-900 p-6">
          <h2 className="text-2xl font-bold text-white">MES FORMATIONS OBLIGATOIRES {selectedYear}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['IAS', 'CIF', 'IOB', 'IMMOBILIER'].map((category) => {
              const requiredHours = formationsData[selectedYear as keyof typeof formationsData]?.obligatoires?.[category as keyof typeof formationsData['2024']['obligatoires']] || 0;
              const completedHours = getTotalHoursByCategory(category);
              const isCompleted = completedHours >= requiredHours;
              
              return (
                <button 
                  key={category}
                  onClick={() => {
                    setSelectedFormationType('obligatoires');
                    setSelectedCategory(category);
                  }}
                  className={`p-4 rounded-lg transition-colors ${
                    isCompleted 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <div className="text-lg font-semibold">{category}</div>
                  {isCompleted && (
                    <div className="text-xs mt-1">✓ Complété</div>
                  )}
            </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Formations Validantes */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">MES FORMATIONS VALIDANTES {selectedYear}</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? "bg-white text-blue-800"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Toutes
              </button>
              {['CIF', 'IAS', 'IOB', 'IMMOBILIER'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-white text-blue-800"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Statut</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nb d'heures</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Catégories</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Délivrée par</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nom document</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-gray-500 text-center" colSpan={7}>
                      Chargement...
                    </td>
                  </tr>
                ) : getFilteredFormations().length > 0 ? (
                  getFilteredFormations().map((formation) => {
                    const dateStr = formation.date ? new Date(formation.date).toLocaleDateString('fr-FR') : '';
                    return (
                    <tr key={formation.id}>
                        <td className="border border-gray-300 px-4 py-2">{dateStr}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formation.statut === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                              : formation.statut === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                            {formation.statut === 'approved' ? 'Validée' : formation.statut === 'pending' ? 'En attente' : 'Rejetée'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{formation.heures}h</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                            {Array.isArray(formation.categories) ? formation.categories.map((category: string) => (
                            <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {category}
                            </span>
                            )) : null}
                        </div>
                      </td>
                        <td className="border border-gray-300 px-4 py-2">{formation.delivree_par || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{formation.nom_document}</td>
                      <td className="border border-gray-300 px-4 py-2">
                          {(formation.fileUrl || formation.file_path) && (
                            <button
                              onClick={async () => {
                                const downloadUrl = formation.fileUrl || (formation.file_path ? buildFileURL(formation.file_path) : '');
                                if (downloadUrl.includes('/api/formations/') && downloadUrl.includes('/download')) {
                                  try {
                                    const token = localStorage.getItem('token');
                                    let apiPath: string;
                                    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
                                      const urlObj = new URL(downloadUrl);
                                      apiPath = urlObj.pathname;
                                      if (apiPath.startsWith('/api/')) {
                                        apiPath = apiPath.replace('/api', '');
                                      }
                                    } else {
                                      apiPath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
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
                                      a.download = formation.nom_document || 'formation.pdf';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      window.URL.revokeObjectURL(url);
                                    } else {
                                      alert('Erreur lors du téléchargement');
                                    }
                                  } catch (error) {
                                    console.error('Error downloading:', error);
                                    alert('Erreur lors du téléchargement');
                                  }
                                } else {
                                  window.open(downloadUrl, '_blank');
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                          Télécharger
                        </button>
                          )}
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-gray-500" colSpan={7}>
                      Aucune formation approuvée enregistrée pour {selectedCategory === 'all' ? 'cette année' : selectedCategory} en {selectedYear}
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ajouter une formation
            </button>
            <div className="text-gray-600 font-medium">
              Total heures {selectedCategory === 'all' ? 'toutes catégories' : selectedCategory}: {getFilteredFormations().reduce((total, formation) => total + formation.heures, 0)}h
            </div>
          </div>
        </div>
      </div>

      {/* Section Bibliothèque Conformité */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <h2 className="text-2xl font-bold text-white">BIBLIOTHEQUE CONFORMITE</h2>
        </div>
        <div className="p-6">
          {loadingReglementaire ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des documents...</p>
            </div>
          ) : (
          <div className="space-y-4">
              {folders.map((folder) => {
                const folderDocuments = getDocumentsForFolder(folder.id);
                return (
              <div key={folder.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête du dossier */}
                <button
                      onClick={() => toggleFolder(folder.id.toString())}
                  className="w-full bg-gray-50 hover:bg-gray-100 p-4 text-left transition-colors flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{folder.title}</h3>
                  <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{folderDocuments.length} document(s)</span>
                    <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedFolders[folder.id.toString()] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Contenu du dossier */}
                    {expandedFolders[folder.id.toString()] && (
                  <div className="border-t border-gray-200 bg-white">
                        {folderDocuments.length > 0 ? (
                          folderDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 text-blue-600">
                            📄
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{doc.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {doc.document_date || 'N/A'} {doc.document_type ? ` • ${doc.document_type}` : ''}
                          </div>
                        </div>
                              </div>
                              {doc.fileUrl && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('token');
                                      let apiPath: string;
                                      if (doc.fileUrl!.startsWith('http://') || doc.fileUrl!.startsWith('https://')) {
                                        const urlObj = new URL(doc.fileUrl!);
                                        apiPath = urlObj.pathname;
                                        if (apiPath.startsWith('/api/')) {
                                          apiPath = apiPath.replace('/api', '');
                                        }
                                      } else {
                                        apiPath = doc.fileUrl!.startsWith('/') ? doc.fileUrl! : `/${doc.fileUrl!}`;
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
                                        a.download = doc.name || 'document.pdf';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      } else {
                                        alert('Erreur lors du téléchargement');
                                      }
                                    } catch (error) {
                                      console.error('Error downloading:', error);
                                      alert('Erreur lors du téléchargement');
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Télécharger"
                                >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                              )}
                      </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Aucun document dans ce dossier
                  </div>
                )}
              </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal pour ajouter une formation */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ajouter une formation</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitFormation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du document <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_document}
                  onChange={(e) => setFormData({ ...formData, nom_document: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation CIF - Gestion de portefeuille"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre d'heures <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.heures}
                    onChange={(e) => setFormData({ ...formData, heures: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégories <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['CIF', 'IAS', 'IOB', 'IMMOBILIER'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
            ))}
          </div>
                {formData.categories.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">Sélectionnez au moins une catégorie</p>
                )}
        </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Délivrée par
                </label>
                <input
                  type="text"
                  value={formData.delivree_par}
                  onChange={(e) => setFormData({ ...formData, delivree_par: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation Pro, Institut IAS..."
                />
      </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Année <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fichier (PDF, DOC, DOCX, etc.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.categories.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Produits Structurés Page Component
function ProduitsStructuresPage() {
  const [selectedSection, setSelectedSection] = useState('commercialisation');
  const [selectedTab, setSelectedTab] = useState('details');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Données des produits en cours de commercialisation
  const produitsCommercialisation = [
    {
      id: 1,
      logo: "🟦",
      company: "SwissLife",
      title: "Stratégie Patrimoine S Total Dividende Forfaitaire 3.30 Septembre 2025",
      sousJacent: "Euro Stoxx 50",
      coupon: "2% / an",
      commercialisation: "08/05/2024 au 10/09/2025",
      finCommercialisation: "dans 17 jours",
      montantEnveloppe: "5 000 000€",
      enveloppeRestante: "0€",
      documents: [
        { nom: "Note d'information", type: "PDF", taille: "2.3 MB" },
        { nom: "Prospectus", type: "PDF", taille: "1.8 MB" },
        { nom: "Document d'information clé", type: "PDF", taille: "0.5 MB" },
        { nom: "Conditions générales", type: "PDF", taille: "1.2 MB" },
        { nom: "Fiche produit", type: "PDF", taille: "0.8 MB" }
      ]
    },
    {
      id: 2,
      logo: "🟨",
      company: "CARDIF",
      title: "Stratégie Patrimoine S Taux Mai 2025",
      sousJacent: "Euro Stoxx 50",
      coupon: "3% / an",
      commercialisation: "15/06/2024 au 20/09/2025",
      finCommercialisation: "dans 24 jours",
      montantEnveloppe: "3 000 000€",
      enveloppeRestante: "520 880€",
      documents: [
        { nom: "Note d'information", type: "PDF", taille: "2.1 MB" },
        { nom: "Prospectus", type: "PDF", taille: "1.9 MB" },
        { nom: "Document d'information clé", type: "PDF", taille: "0.6 MB" },
        { nom: "Conditions générales", type: "PDF", taille: "1.4 MB" }
      ]
    },
    {
      id: 3,
      logo: "🟩",
      company: "abeille ASSURANCES",
      title: "Stratégie Patrimoine S Dividende Avril 2025",
      sousJacent: "CAC 40",
      coupon: "2.5% / an",
      commercialisation: "20/07/2024 au 25/09/2025",
      finCommercialisation: "dans 29 jours",
      montantEnveloppe: "2 500 000€",
      enveloppeRestante: "150 000€",
      documents: [
        { nom: "Note d'information", type: "PDF", taille: "2.0 MB" },
        { nom: "Prospectus", type: "PDF", taille: "1.7 MB" },
        { nom: "Document d'information clé", type: "PDF", taille: "0.4 MB" }
      ]
    }
  ];

  // Données des produits commercialisation terminée
  const produitsTermines = [
    {
      id: 4,
      logo: "🟥",
      company: "Garance",
      title: "Stratégie Patrimoine S Taux Juin 2025",
      sousJacent: "S&P 500",
      coupon: "4% / an",
      dateFinCommercialisation: "30/09/2025",
      montantCollecte: "4 000 000€",
      nombreSouscripteurs: "125",
      documents: [
        { nom: "Note d'information", type: "PDF", taille: "2.2 MB" },
        { nom: "Prospectus", type: "PDF", taille: "1.6 MB" },
        { nom: "Document d'information clé", type: "PDF", taille: "0.5 MB" },
        { nom: "Conditions générales", type: "PDF", taille: "1.3 MB" },
        { nom: "Rapport de clôture", type: "PDF", taille: "0.9 MB" }
      ]
    },
    {
      id: 5,
      logo: "🟪",
      company: "SwissLife",
      title: "Stratégie Patrimoine S Dividende Juillet 2025",
      sousJacent: "DAX",
      coupon: "2.8% / an",
      dateFinCommercialisation: "05/10/2025",
      montantCollecte: "3 500 000€",
      nombreSouscripteurs: "98",
      documents: [
        { nom: "Note d'information", type: "PDF", taille: "2.4 MB" },
        { nom: "Prospectus", type: "PDF", taille: "1.8 MB" },
        { nom: "Document d'information clé", type: "PDF", taille: "0.6 MB" },
        { nom: "Conditions générales", type: "PDF", taille: "1.1 MB" }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">PRODUITS STRUCTURÉS</h1>
        <p className="text-gray-600 text-lg">
          Découvrez notre gamme de produits structurés adaptés à vos besoins d'investissement
        </p>
      </div>

      {/* Section Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setSelectedSection('commercialisation');
              setSelectedTab('details');
              setSelectedProduct(null);
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedSection === 'commercialisation'
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            En cours de commercialisation
              </button>
          <button
            onClick={() => {
              setSelectedSection('termines');
              setSelectedTab('details');
              setSelectedProduct(null);
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedSection === 'termines'
                ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Commercialisation terminée
              </button>
            </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedTab('details')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTab === 'details'
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Détails
          </button>
          <button
            onClick={() => setSelectedTab('documents')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTab === 'documents'
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Documents
          </button>
          {selectedSection === 'commercialisation' && (
            <button
              onClick={() => setSelectedTab('reserver')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === 'reserver'
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Réserver
            </button>
          )}
          </div>
        </div>
        
      {/* Content based on selected tab */}
      {selectedTab === 'details' && (
        <div className="space-y-6">
          {selectedSection === 'commercialisation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {produitsCommercialisation.map((produit) => (
                <div key={produit.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{produit.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{produit.company}</h3>
                    <h4 className="text-sm font-medium text-gray-700 leading-tight">{produit.title}</h4>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sous jacent:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.sousJacent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Coupon:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.coupon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commercialisation:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.commercialisation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fin de commercialisation:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.finCommercialisation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant enveloppe:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.montantEnveloppe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Enveloppe restante:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.enveloppeRestante}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        setSelectedProduct(produit);
                        setSelectedTab('documents');
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      Documents
                  </button>
                    <button 
                      onClick={() => {
                        setSelectedProduct(produit);
                        setSelectedTab('reserver');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {produitsTermines.map((produit) => (
                <div key={produit.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{produit.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{produit.company}</h3>
                    <h4 className="text-sm font-medium text-gray-700 leading-tight">{produit.title}</h4>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sous jacent:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.sousJacent}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coupon:</span>
                      <span className="text-sm font-medium text-gray-800">{produit.coupon}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date fin commercialisation:</span>
                      <span className="text-sm font-medium text-gray-800">{produit.dateFinCommercialisation}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Montant collecté:</span>
                      <span className="text-sm font-medium text-gray-800">{produit.montantCollecte}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nombre de souscripteurs:</span>
                      <span className="text-sm font-medium text-gray-800">{produit.nombreSouscripteurs}</span>
                  </div>
                </div>
                
                  <button 
                    onClick={() => {
                      setSelectedProduct(produit);
                      setSelectedTab('documents');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                  >
                    Documents
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'documents' && selectedProduct && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-3xl">{selectedProduct.logo}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedProduct.company}</h2>
              <p className="text-sm text-gray-600">{selectedProduct.title}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {selectedProduct.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{doc.nom}</h3>
                    <p className="text-sm text-gray-600">{doc.type} • {doc.taille}</p>
                  </div>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'reserver' && selectedProduct && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-3xl">{selectedProduct.logo}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedProduct.company}</h2>
              <p className="text-sm text-gray-600">{selectedProduct.title}</p>
      </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Formulaire de Réservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant à investir</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Montant en €" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de souscription souhaitée</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Commentaires additionnels..."></textarea>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                Confirmer la réservation
              </button>
              <button 
                onClick={() => setSelectedTab('details')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simulateurs Page Component
function SimulateursPage() {
  const [activeSimulator, setActiveSimulator] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">SIMULATEURS</h1>
        <p className="text-gray-600 text-lg">
          Outils de simulation pour vos calculs fiscaux et financiers
        </p>
      </div>

      {/* Grid des 4 simulateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Simulateur IR */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">💰</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Impôt sur le Revenu</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez votre impôt sur le revenu selon les tranches d'imposition</p>
          <button 
            onClick={() => setActiveSimulator('ir')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
              Simulation IR
            </button>
          </div>

        {/* 2. Simulateur IFI */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🏠</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Fortune Immobilière (IFI)</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Estimez votre impôt sur la fortune immobilière</p>
          <button 
            onClick={() => setActiveSimulator('ifi')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Simulation IFI
            </button>
          </div>

        {/* 3. Simulateur Succession */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">📋</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Diagnostic Succession</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez les droits de succession pour vos héritiers</p>
          <button 
            onClick={() => setActiveSimulator('succession')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Diagnostic Succession
            </button>
      </div>

        {/* 4. Simulateur Placement */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">📈</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Simulateur Placement</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Estimez le rendement et le capital accumulé de vos placements</p>
          <button 
            onClick={() => setActiveSimulator('placement')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Simulateur Placement
            </button>
          </div>
        </div>

      {/* Modals pour chaque simulateur */}
      {activeSimulator === 'ir' && (
        <IRSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'ifi' && (
        <IFISimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'succession' && (
        <SuccessionSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'placement' && (
        <PlacementSimulator onClose={() => setActiveSimulator(null)} />
      )}
      </div>
  );
}

// Simulateur IR - Amélioré avec sliders et calcul temps réel
function IRSimulator({ onClose }: { onClose: () => void }) {
  const [revenuNet, setRevenuNet] = useState(50000);
  const [situation, setSituation] = useState('celibataire');
  const [nbEnfants, setNbEnfants] = useState(0);
  const [result, setResult] = useState<{impot: number, taux: number, tranches: any[], revenuApresImpot: number} | null>(null);

  useEffect(() => {
    const calculateIR = () => {
      const revenu = revenuNet;
      if (revenu <= 0) {
        setResult(null);
        return;
      }

      // Calcul du nombre de parts fiscales
      let parts = 1;
      if (situation === 'marie') {
        parts = 2;
      } else if (situation === 'pacse') {
        parts = 2;
      }
      
      parts += nbEnfants * 0.5;
      if (situation === 'marie' && nbEnfants > 2) {
        parts += (nbEnfants - 2) * 0.5;
      }

      const revenuImposable = revenu / parts;

      // Barème 2024 (pour déclaration 2025)
      const tranches: any[] = [];
      let impot = 0;
      
      if (revenuImposable > 11088) {
        const tranche1 = Math.min(revenuImposable, 28288) - 11088;
        const impot1 = tranche1 * 0.11;
        impot += impot1;
        tranches.push({ montant: tranche1, taux: 11, impot: impot1, limite: 28288 });
      }
      if (revenuImposable > 28288) {
        const tranche2 = Math.min(revenuImposable, 80624) - 28288;
        const impot2 = tranche2 * 0.30;
        impot += impot2;
        tranches.push({ montant: tranche2, taux: 30, impot: impot2, limite: 80624 });
      }
      if (revenuImposable > 80624) {
        const tranche3 = Math.min(revenuImposable, 173041) - 80624;
        const impot3 = tranche3 * 0.41;
        impot += impot3;
        tranches.push({ montant: tranche3, taux: 41, impot: impot3, limite: 173041 });
      }
      if (revenuImposable > 173041) {
        const tranche4 = revenuImposable - 173041;
        const impot4 = tranche4 * 0.45;
        impot += impot4;
        tranches.push({ montant: tranche4, taux: 45, impot: impot4, limite: Infinity });
      }

      const impotTotal = impot * parts;
      const taux = (impotTotal / revenu) * 100;
      const revenuApresImpot = revenu - impotTotal;

      setResult({ 
        impot: Math.round(impotTotal), 
        taux: Math.round(taux * 10) / 10,
        tranches,
        revenuApresImpot: Math.round(revenuApresImpot)
      });
    };

    calculateIR();
  }, [revenuNet, situation, nbEnfants]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur Impôt sur le Revenu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Revenu net imposable</label>
                <span className="text-lg font-bold text-blue-600">{revenuNet.toLocaleString('fr-FR')} €</span>
            </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="1000"
                value={revenuNet}
                onChange={(e) => setRevenuNet(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>200 000 €</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Situation familiale</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSituation('celibataire')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'celibataire'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Célibataire
                </button>
                <button
                  onClick={() => setSituation('marie')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'marie'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Marié(e)
                </button>
                <button
                  onClick={() => setSituation('pacse')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'pacse'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pacsé(e)
            </button>
              </div>
          </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Nombre d'enfants</label>
                <span className="text-lg font-bold text-blue-600">{nbEnfants}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={nbEnfants}
                onChange={(e) => setNbEnfants(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>5</span>
            </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Impôt à payer</div>
                    <div className="text-4xl font-bold text-blue-700">{result.impot.toLocaleString('fr-FR')} €</div>
              </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenu annuel</span>
                      <span className="font-medium">{revenuNet.toLocaleString('fr-FR')} €</span>
            </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taux moyen</span>
                      <span className="font-medium">{result.taux}%</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-blue-200">
                      <span>Revenu après impôt</span>
                      <span className="text-green-600">{result.revenuApresImpot.toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>

                {result.tranches.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition par tranche</h4>
                    <div className="space-y-2">
                      {result.tranches.map((t, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between mb-1">
                            <span>Tranche {t.taux}%</span>
                            <span className="font-medium">{Math.round(t.impot).toLocaleString('fr-FR')} €</span>
              </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(t.impot / result.impot) * 100}%` }}
                            ></div>
            </div>
          </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulateur IFI - Amélioré avec sliders et calcul temps réel
function IFISimulator({ onClose }: { onClose: () => void }) {
  const [patrimoine, setPatrimoine] = useState(2000000);
  const [dettes, setDettes] = useState(300000);
  const [result, setResult] = useState<{ifi: number, base: number, patrimoineNet: number} | null>(null);

  useEffect(() => {
    const calculateIFI = () => {
      const patrimoineBrut = patrimoine;
      const dettesValue = dettes;
      
      if (patrimoineBrut <= 0) {
        setResult(null);
        return;
      }

      const patrimoineNet = patrimoineBrut - dettesValue;
      const baseImposable = Math.max(0, patrimoineNet - 1300000); // Abattement de 1.3M€

      if (baseImposable <= 0) {
        setResult({ ifi: 0, base: 0, patrimoineNet });
        return;
      }

      // Barème IFI 2024
      let ifi = 0;
      if (baseImposable > 800000) {
        const tranche2 = baseImposable - 800000;
        ifi += tranche2 * 0.007; // 0.70%
      }

      setResult({ ifi: Math.round(ifi), base: Math.round(baseImposable), patrimoineNet: Math.round(patrimoineNet) });
    };

    calculateIFI();
  }, [patrimoine, dettes]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur IFI</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Valeur du patrimoine immobilier</label>
                <span className="text-lg font-bold text-purple-600">{patrimoine.toLocaleString('fr-FR')} €</span>
            </div>
              <input
                type="range"
                min="0"
                max="10000000"
                step="50000"
                value={patrimoine}
                onChange={(e) => setPatrimoine(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>10 M€</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Valeur de tous vos biens immobiliers</p>
          </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Dettes immobilières</label>
                <span className="text-lg font-bold text-purple-600">{dettes.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max={patrimoine}
                step="10000"
                value={dettes}
                onChange={(e) => setDettes(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>{patrimoine.toLocaleString('fr-FR')} €</span>
            </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Patrimoine net:</span>
                  <span className="font-semibold">{result?.patrimoineNet.toLocaleString('fr-FR') || '...'} €</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Abattement (1.3M€):</span>
                  <span className="font-semibold">1 300 000 €</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-300">
                  <span>Base imposable:</span>
                  <span className="font-bold text-purple-700">{result?.base.toLocaleString('fr-FR') || '0'} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">IFI à payer</div>
                    <div className="text-4xl font-bold text-purple-700">
                      {result.ifi === 0 ? '0 €' : `${result.ifi.toLocaleString('fr-FR')} €`}
                    </div>
                  </div>
                  
                  {result.ifi === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-green-600 font-semibold mb-2">✅ Vous n'êtes pas soumis à l'IFI</div>
                      <p className="text-xs text-gray-600">Votre patrimoine net est inférieur au seuil de 1.3M€</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taux IFI</span>
                        <span className="font-medium">0.70%</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                        <span>Patrimoine net après IFI</span>
                        <span className="font-semibold text-green-600">
                          {(result.patrimoineNet - result.ifi).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {result.ifi > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Détails du calcul</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Patrimoine net</span>
                        <span className="font-medium">{result.patrimoineNet.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Abattement</span>
                        <span className="font-medium">- 1 300 000 €</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span>Base imposable</span>
                        <span className="font-medium">{result.base.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span>× Taux 0.70%</span>
                        <span className="font-bold">{result.ifi.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulateur Succession - Amélioré avec sliders et calcul temps réel
function SuccessionSimulator({ onClose }: { onClose: () => void }) {
  const [patrimoine, setPatrimoine] = useState(500000);
  const [lien, setLien] = useState('enfants');
  const [result, setResult] = useState<{droits: number, net: number, abattement: number, taux: number} | null>(null);

  useEffect(() => {
    const calculateSuccession = () => {
      const patrimoineValue = patrimoine;
      if (patrimoineValue <= 0) {
        setResult(null);
        return;
      }

      // Abattements selon le lien de parenté (2024)
      let abattement = 0;
      if (lien === 'enfants') {
        abattement = 100000; // 100k€ par enfant
      } else if (lien === 'conjoint') {
        abattement = 80724; // Abattement conjoint survivant
      } else if (lien === 'parents') {
        abattement = 15858;
      } else {
        abattement = 7967; // Frères/sœurs
      }

      const baseImposable = Math.max(0, patrimoineValue - abattement);

      // Taux selon le lien
      let taux = 0;
      if (lien === 'enfants') {
        if (baseImposable <= 8081) taux = 0.05;
        else if (baseImposable <= 12109) taux = 0.10;
        else if (baseImposable <= 15932) taux = 0.15;
        else if (baseImposable <= 552324) taux = 0.20;
        else if (baseImposable <= 902838) taux = 0.30;
        else if (baseImposable <= 1805677) taux = 0.40;
        else taux = 0.45;
      } else if (lien === 'conjoint') {
        taux = 0; // Pas de droits entre époux
      } else if (lien === 'parents') {
        if (baseImposable <= 8072) taux = 0.35;
        else taux = 0.45;
      } else {
        if (baseImposable <= 24331) taux = 0.35;
        else taux = 0.45;
      }

      const droits = baseImposable * taux;
      const net = patrimoineValue - droits;

      setResult({ 
        droits: Math.round(droits), 
        net: Math.round(net),
        abattement,
        taux: taux * 100
      });
    };

    calculateSuccession();
  }, [patrimoine, lien]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Diagnostic Succession</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Valeur du patrimoine transmis</label>
                <span className="text-lg font-bold text-green-600">{patrimoine.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={patrimoine}
                onChange={(e) => setPatrimoine(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>5 M€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lien avec le bénéficiaire</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLien('conjoint')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'conjoint'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Conjoint
                </button>
                <button
                  onClick={() => setLien('enfants')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'enfants'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Enfants
                </button>
                <button
                  onClick={() => setLien('parents')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'parents'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Parents
                </button>
                <button
                  onClick={() => setLien('autres')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'autres'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Autres
            </button>
          </div>
        </div>

            {result && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between mb-1">
                    <span>Abattement:</span>
                    <span className="font-semibold">{result.abattement.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Base imposable:</span>
                    <span className="font-semibold">
                      {Math.max(0, patrimoine - result.abattement).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span>Taux appliqué:</span>
                    <span className="font-bold text-green-700">{result.taux}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Droits de succession</div>
                    <div className="text-4xl font-bold text-green-700">{result.droits.toLocaleString('fr-FR')} €</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Patrimoine transmis</span>
                      <span className="font-medium">{patrimoine.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Droits de succession</span>
                      <span className="font-medium text-red-600">- {result.droits.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-green-200">
                      <span>Patrimoine net reçu</span>
                      <span className="text-green-600 text-lg">{result.net.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>

                {result.droits > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Droits à payer</span>
                          <span className="font-medium">{result.droits.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all"
                            style={{ width: `${(result.droits / patrimoine) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Patrimoine net</span>
                          <span className="font-medium">{result.net.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${(result.net / patrimoine) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulateur Placement - Amélioré avec sliders et calcul temps réel
function PlacementSimulator({ onClose }: { onClose: () => void }) {
  const [capitalInitial, setCapitalInitial] = useState(10000);
  const [versementMensuel, setVersementMensuel] = useState(200);
  const [tauxRendement, setTauxRendement] = useState(3);
  const [duree, setDuree] = useState(10);
  const [result, setResult] = useState<{capitalFinal: number, gains: number, totalVerse: number} | null>(null);

  useEffect(() => {
    const calculatePlacement = () => {
      const initial = capitalInitial;
      const mensuel = versementMensuel;
      const taux = tauxRendement / 100 / 12; // Taux mensuel
      const annees = duree;

      if ((initial <= 0 && mensuel <= 0) || annees <= 0) {
        setResult(null);
        return;
      }

      let capital = initial;
      const nbMois = annees * 12;

      // Calcul avec intérêts composés mensuels
      for (let mois = 0; mois < nbMois; mois++) {
        capital = capital * (1 + taux) + mensuel;
      }

      const capitalFinal = Math.round(capital);
      const totalVerse = initial + (mensuel * nbMois);
      const gains = capitalFinal - totalVerse;

      setResult({ capitalFinal, gains, totalVerse });
    };

    calculatePlacement();
  }, [capitalInitial, versementMensuel, tauxRendement, duree]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur Placement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Capital initial</label>
                <span className="text-lg font-bold text-orange-600">{capitalInitial.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={capitalInitial}
                onChange={(e) => setCapitalInitial(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>100 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Versement mensuel</label>
                <span className="text-lg font-bold text-orange-600">{versementMensuel.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={versementMensuel}
                onChange={(e) => setVersementMensuel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>2 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Taux de rendement annuel</label>
                <span className="text-lg font-bold text-orange-600">{tauxRendement}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={tauxRendement}
                onChange={(e) => setTauxRendement(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Durée</label>
                <span className="text-lg font-bold text-orange-600">{duree} ans</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={duree}
                onChange={(e) => setDuree(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 an</span>
                <span>40 ans</span>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Capital final</div>
                    <div className="text-4xl font-bold text-orange-700">{result.capitalFinal.toLocaleString('fr-FR')} €</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total versé</span>
                      <span className="font-medium">{result.totalVerse.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gains générés</span>
                      <span className="font-medium text-green-600">+ {result.gains.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                      <span>Rendement</span>
                      <span className="font-semibold text-orange-700">
                        {((result.gains / result.totalVerse) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Capital versé</span>
                        <span className="font-medium">{result.totalVerse.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gray-400 h-3 rounded-full transition-all"
                          style={{ width: `${(result.totalVerse / result.capitalFinal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Gains (intérêts)</span>
                        <span className="font-medium">{result.gains.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${(result.gains / result.capitalFinal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-gray-700">
                    <div className="flex justify-between mb-1">
                      <span>Versement mensuel:</span>
                      <span className="font-medium">{versementMensuel.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Durée totale:</span>
                      <span className="font-medium">{duree * 12} mois</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-300">
                      <span>Total des versements:</span>
                      <span className="font-semibold">{(versementMensuel * duree * 12).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Comptabilité Page Component
function ComptabilitePage({ currentUser, bordereaux }: { currentUser: User | null, bordereaux: BordereauFile[] }) {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [userFiles, setUserFiles] = useState<any[]>([]);
  
  // Load bordereaux from database for current user
  useEffect(() => {
    const loadUserBordereaux = async () => {
      if (!currentUser?.id) return;
      try {
        // Load bordereaux from new API
        // IMPORTANT: In ComptabilitePage, even admins should see only their own files
        const response = await fetch(buildAPIURL(`/bordereaux?user_id=${currentUser.id}`), {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter by selected year AND ensure only current user's files (even for admins)
          const filteredData = data.filter((b: any) => {
            // Always filter by current user ID (even for admins in this page)
            // Convert both to numbers for comparison
            const fileUserId = typeof b.userId === 'string' ? parseInt(b.userId) : b.userId;
            const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
            
            if (fileUserId !== currentUserId) return false;
            // Filter by selected year
            if (selectedYear && b.periodYear?.toString() !== selectedYear && 
                !(b.periodYear === null && new Date(b.createdAt).getFullYear().toString() === selectedYear)) {
              return false;
            }
            return true;
          });
          setUserFiles(filteredData);
        }
      } catch (error) {
        console.error('Error loading user bordereaux:', error);
      }
    };
    loadUserBordereaux();
  }, [currentUser?.id, selectedYear]);
  
  // Debug simple pour vérifier le chargement
  console.log('ComptabilitePage loaded for user:', currentUser?.name);

  // Fonction pour télécharger/ouvrir un fichier
  const handleDownload = async (fileUrl: string, fileName: string) => {
    console.log('📥 Tentative de téléchargement de:', fileName);
    
    // Si l'URL est une route API qui nécessite l'authentification, utiliser fetch
    if (fileUrl.includes('/bordereaux/') && fileUrl.includes('/download')) {
      try {
        const token = localStorage.getItem('token');
        
        // Extraire le chemin de l'URL complète ou utiliser directement
        let apiPath: string;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          // URL complète - extraire le chemin après le domaine
          const urlObj = new URL(fileUrl);
          apiPath = urlObj.pathname; // Ex: /api/bordereaux/29/download
          // Retirer /api si présent pour que buildAPIURL puisse l'ajouter
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', ''); // Ex: /bordereaux/29/download
          }
        } else {
          // Chemin relatif
          apiPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
          // Retirer /api si présent
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', '');
          }
        }
        
        // buildAPIURL attend un chemin relatif (sans /api au début)
        const apiUrl = buildAPIURL(apiPath);
        
        console.log('Downloading from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'x-auth-token': token || ''
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || 'bordereau.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } else {
          const errorText = await response.text();
          console.error('Download error:', errorText);
          alert('Erreur lors du téléchargement du fichier');
        }
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Erreur lors du téléchargement du fichier');
      }
    } else {
      // Pour les anciens fichiers (file_path direct) ou autres URLs
      window.open(fileUrl, '_blank');
    }
  };


  // Transform bordereaux data for display
  const displayFiles = userFiles.map(file => ({
    id: `bordereau_${file.id}`,
    fileName: file.title || file.filePath?.split('/').pop() || 'Unknown',
    title: file.title,
    uploadDate: file.createdAt,
    month: file.periodMonth ? new Date(2000, file.periodMonth - 1).toLocaleString('fr-FR', { month: 'long' }) : 
            file.createdAt ? new Date(file.createdAt).toLocaleString('fr-FR', { month: 'long' }) : 'Unknown',
    year: file.periodYear?.toString() || new Date(file.createdAt).getFullYear().toString(),
    userId: file.userId?.toString() || '',
    uploadedBy: file.uploadedByLabel || 'Admin',
    file_path: file.filePath, // Keep for backward compatibility
    fileUrl: file.fileUrl // New: URL for base64 files stored in DB
  }));
  
  // Only use bordereaux from API (no longer combining with old bordereaux state)
  const allUserFiles = displayFiles;

  // Grouper par mois (including files from database)
  const bordereauxByMonth = allUserFiles.reduce((acc, file) => {
    if (!acc[file.month]) {
      acc[file.month] = [];
    }
    acc[file.month].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  // Debug: Afficher les données dans la console
  console.log('🔍 Debug Comptabilité pour', currentUser?.name, ':', {
    currentUser: currentUser,
    selectedYear: selectedYear,
    allBordereaux: bordereaux,
    userFiles: userFiles,
    displayFiles: displayFiles,
    bordereauxByMonth: bordereauxByMonth,
    // Debug supplémentaire
    totalUserFiles: userFiles.length,
    totalDisplayFiles: displayFiles.length
  });

  // Données des dossiers annuels
  const yearlyFolders = {
    "2025": {
      months: [
        { name: "Janvier", files: 12, lastUpdate: "15/01/2025" },
        { name: "Février", files: 8, lastUpdate: "14/02/2025" },
        { name: "Mars", files: 15, lastUpdate: "20/03/2025" },
        { name: "Avril", files: 0, lastUpdate: "En attente" },
        { name: "Mai", files: 0, lastUpdate: "En attente" },
        { name: "Juin", files: 0, lastUpdate: "En attente" },
        { name: "Juillet", files: 0, lastUpdate: "En attente" },
        { name: "Août", files: 0, lastUpdate: "En attente" },
        { name: "Septembre", files: 0, lastUpdate: "En attente" },
        { name: "Octobre", files: 0, lastUpdate: "En attente" },
        { name: "Novembre", files: 0, lastUpdate: "En attente" },
        { name: "Décembre", files: 0, lastUpdate: "En attente" }
      ]
    },
    "2024": {
      months: [
        { name: "Janvier", files: 18, lastUpdate: "15/01/2024" },
        { name: "Février", files: 14, lastUpdate: "14/02/2024" },
        { name: "Mars", files: 16, lastUpdate: "20/03/2024" },
        { name: "Avril", files: 12, lastUpdate: "18/04/2024" },
        { name: "Mai", files: 15, lastUpdate: "22/05/2024" },
        { name: "Juin", files: 13, lastUpdate: "19/06/2024" },
        { name: "Juillet", files: 11, lastUpdate: "17/07/2024" },
        { name: "Août", files: 9, lastUpdate: "14/08/2024" },
        { name: "Septembre", files: 17, lastUpdate: "21/09/2024" },
        { name: "Octobre", files: 14, lastUpdate: "18/10/2024" },
        { name: "Novembre", files: 16, lastUpdate: "20/11/2024" },
        { name: "Décembre", files: 19, lastUpdate: "23/12/2024" }
      ]
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">COMPTABILITÉ</h1>
            <p className="text-gray-600 text-lg">
              Gestion des bordereaux comptables par année
            </p>
          </div>
        </div>
      </div>

      {/* Year Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sélectionner l'année</h2>
        <div className="flex space-x-4">
          {Object.keys(yearlyFolders).map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedYear === year
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Folders */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Bordereaux {selectedYear} - {currentUser?.name}
        </h2>
        
        {Object.keys(bordereauxByMonth).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(bordereauxByMonth).map(([month, files]) => (
              <div key={month} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{month}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    files.length > 0 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {files.length} fichier{files.length > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="truncate font-medium text-sm">{file.fileName}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Uploadé le: {new Date(file.uploadDate).toLocaleDateString('fr-FR')} par {file.uploadedBy}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            // Use fileUrl if available (for base64 files), otherwise use file_path
                            const downloadUrl = file.fileUrl || (file.file_path ? buildFileURL(file.file_path) : '');
                            handleDownload(downloadUrl, file.fileName || file.title);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium">Aucun bordereau disponible</p>
            <p className="text-sm">Aucun fichier n'a été uploadé pour {currentUser?.name} en {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Résumé {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {allUserFiles.length}
            </div>
            <div className="text-sm text-gray-600">Total bordereaux</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(bordereauxByMonth).length}
            </div>
            <div className="text-sm text-gray-600">Mois avec fichiers</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {12 - Object.keys(bordereauxByMonth).length}
            </div>
            <div className="text-sm text-gray-600">Mois en attente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gestion Comptabilité Page Component - Display all users for admin
function GestionComptabilitePage({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<Array<{
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [invalidNamedFiles, setInvalidNamedFiles] = useState<string[]>([]);
  const [fileUserMapping, setFileUserMapping] = useState<{fileIndex: number, userId: number, score: number}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedUserIdForBulk, setSelectedUserIdForBulk] = useState<number | ''>('');
  const [recentUploads, setRecentUploads] = useState<Array<{ archiveId: number; fileUrl: string; title: string; userId: number; userLabel: string; createdAt: string }>>([]);
  const [uploadMode, setUploadMode] = useState<'auto' | 'manual'>('auto'); // 'auto' = direct upload, 'manual' = preview first
  const [bulkUploadDate, setBulkUploadDate] = useState<string>(new Date().toISOString().split('T')[0]); // Date configurable pour l'affichage

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      // Load recent bordereaux uploads from backend so they persist across sessions
      (async () => {
        try {
          const res = await fetch(buildAPIURL('/bordereaux/recent?limit=20'), {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          });
          if (res.ok) {
            const data = await res.json();
            // Filtrer les valeurs null/undefined et s'assurer que chaque objet a un title
            const validUploads = Array.isArray(data) 
              ? data.filter((r: any) => r && r.title && typeof r.title === 'string')
              : [];
            setRecentUploads(validUploads);
          }
        } catch {}
      })();
    }
  }, [currentUser]);

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
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utilities for smart matching
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[-_.()\s]+/g, ' ') // unify separators
      .trim();

  // Return best userId and a confidence score [0..100]
  // NEW LOGIC: Prioritizes prefixes at the beginning of filename
  const matchFileToUser = (fileName: string): { userId: number | null, score: number } => {
    // Extract prefix BEFORE normalization to preserve delimiters
    const fileNameLower = fileName.toLowerCase();
    
    // Extract prefix from beginning: either before delimiter (_ - space) or first 2-3 characters
    const prefixWithDelimiter = fileNameLower.match(/^([a-zà-ÿ]{2,15})[_-\s\.]/);
    const prefixDelimited = prefixWithDelimiter ? prefixWithDelimiter[1] : null;
    const prefix2 = fileNameLower.substring(0, 2);
    const prefix3 = fileNameLower.substring(0, 3);
    
    const fileNorm = normalize(fileName);
    
    // Helper function to check if prefix is a subsequence of name (e.g., "ai" in "amir")
    const isSubsequence = (prefix: string, name: string): boolean => {
      let nameIndex = 0;
      for (let i = 0; i < prefix.length; i++) {
        const char = prefix[i];
        const found = name.indexOf(char, nameIndex);
        if (found === -1) return false;
        nameIndex = found + 1;
      }
      return true;
    };
    
    let best: { userId: number | null, score: number } = { userId: null, score: 0 };

    users.forEach((u) => {
      const nom = normalize(u.nom);
      const prenom = normalize(u.prenom);
      const full1 = `${prenom} ${nom}`.trim();
      const full2 = `${nom} ${prenom}`.trim();
      const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toLowerCase();
      const emailLocal = normalize((u.email || '').split('@')[0] || '');

      let score = 0;
      
      // PRIORITY 0: Check if prefix matches initials (first letter of firstname + first letter of lastname)
      // This handles cases like "ai" for "Amir IT" (a from Amir, i from IT)
      if (prefixDelimited && prefixDelimited.length === 2) {
        if (prefixDelimited.toLowerCase() === initials) {
          score = Math.max(score, 100);
        }
      }
      if (prefix2.length === 2 && !prefixDelimited) {
        if (prefix2.toLowerCase() === initials) {
          score = Math.max(score, 98);
        }
      }
      
      // LEVEL 1: Prefix with delimiter (ex: "ai_", "mi-", "jean ")
      // Highest priority: exact match at the beginning with separator
      if (prefixDelimited) {
        const prefixLower = prefixDelimited.toLowerCase();
        const prenomLower = prenom.toLowerCase();
        const nomLower = nom.toLowerCase();
        const prenomLen = prenomLower.length;
        const nomLen = nomLower.length;
        
        // Exact match with beginning of firstname or lastname
        if (prefixLower === prenomLower.substring(0, Math.min(prefixDelimited.length, prenomLen)) ||
            prefixLower === nomLower.substring(0, Math.min(prefixDelimited.length, nomLen)) ||
            prefixLower === `${prenomLower}${nomLower}`.substring(0, Math.min(prefixDelimited.length, prenomLen + nomLen)) ||
            prefixLower === `${nomLower}${prenomLower}`.substring(0, Math.min(prefixDelimited.length, prenomLen + nomLen))) {
          score = Math.max(score, 100);
        } else {
          // Flexible match: check if prefix is a subsequence in first 5-6 characters
          // This handles cases like "ai" for "Amir" (a-m-i-r contains "ai" as subsequence)
          const checkLength = Math.min(prefixLower.length + 4, 6);
          const prenomStart = prenomLower.substring(0, checkLength);
          const nomStart = nomLower.substring(0, checkLength);
          
          // Check if prefix is a subsequence (all letters appear in order)
          if (isSubsequence(prefixLower, prenomStart) || isSubsequence(prefixLower, nomStart)) {
            score = Math.max(score, 92);
          } else if (prenomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length))) || 
                     nomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length)))) {
            // Fallback: at least the first 2 letters match somewhere
            score = Math.max(score, 75);
          }
        }
      }
      
      // LEVEL 2: Simple prefix at beginning (2-3 first letters)
      // High priority: first letters match beginning of firstname/lastname/initials
      const prenomPrefix2 = prenom.substring(0, 2).toLowerCase();
      const prenomPrefix3 = prenom.substring(0, 3).toLowerCase();
      const nomPrefix2 = nom.substring(0, 2).toLowerCase();
      const nomPrefix3 = nom.substring(0, 3).toLowerCase();
      
      // Exact match
      if (prefix2.toLowerCase() === prenomPrefix2 || prefix2.toLowerCase() === nomPrefix2 || prefix2.toLowerCase() === initials) {
        score = Math.max(score, 95);
      }
      if (prefix3.toLowerCase() === prenomPrefix3 || prefix3.toLowerCase() === nomPrefix3) {
        score = Math.max(score, 95);
      }
      
      // Flexible match for prefixes without delimiter (for "ai" in "amir")
      if (prefix2.length >= 2 && !prefixDelimited) {
        const prefix2Lower = prefix2.toLowerCase();
        const prenomStart5 = prenom.substring(0, 5).toLowerCase();
        const nomStart5 = nom.substring(0, 5).toLowerCase();
        
        // Check if prefix is a subsequence (all letters appear in order)
        if (isSubsequence(prefix2Lower, prenomStart5) || isSubsequence(prefix2Lower, nomStart5)) {
          score = Math.max(score, 88);
        }
      }
      
      // LEVEL 3: Initials at the beginning
      if (fileNorm.substring(0, 2).toLowerCase() === initials) {
        score = Math.max(score, 90);
      }
      
      // LEVEL 4: Full name at the beginning
      if (fileNorm.startsWith(full1) || fileNorm.startsWith(full2)) {
        score = Math.max(score, 85);
      }
      
      // LEVEL 5: Search in entire filename (fallback - original logic)
      if (fileNorm === full1 || fileNorm === full2) score = Math.max(score, 80);
      if (fileNorm.includes(full1) || fileNorm.includes(full2)) score = Math.max(score, 75);
      if (fileNorm.includes(prenom) && fileNorm.includes(nom)) score = Math.max(score, 70);
      if (emailLocal && (emailLocal.includes(nom) || emailLocal.includes(prenom)) && fileNorm.includes(emailLocal)) score = Math.max(score, 70);
      if (fileNorm.includes(initials)) score = Math.max(score, 65);
      if (nom.length >= 3 && fileNorm.includes(nom.substring(0, 3))) score = Math.max(score, 60);
      if (prenom.length >= 3 && fileNorm.includes(prenom.substring(0, 3))) score = Math.max(score, 60);

      if (score > best.score) best = { userId: u.id, score };
    });

    // Threshold: accept matches with score >= 70 (lowered to include prefix matches)
    if (best.score < 70) return { userId: null, score: best.score };
    return best;
  };

  // NEW LOGIC: Auto-match and upload directly
  const handleBulkFileSelectAndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Enforce: filename must begin with a letter
    const valid = files.filter(f => /^[A-Za-zÀ-ÿ]/.test(f.name));
    const invalid = files.filter(f => !/^[A-Za-zÀ-ÿ]/.test(f.name)).map(f => f.name);
    
    if (valid.length === 0) {
      alert('Aucun fichier valide sélectionné. Les fichiers doivent commencer par une lettre.');
      return;
    }

    // Show invalid files warning
    if (invalid.length > 0) {
      const shouldContinue = window.confirm(
        `⚠️ ${invalid.length} fichier(s) ignoré(s) car leur nom ne commence pas par une lettre:\n${invalid.slice(0, 5).join('\n')}${invalid.length > 5 ? '\n...' : ''}\n\nContinuer avec ${valid.length} fichier(s) valide(s) ?`
      );
      if (!shouldContinue) return;
    }

    setUploading(true);
    setSelectedFiles(valid);

    try {
      // Auto-match each file with a user
      const uploadResults: Array<{fileName: string, userId: number | null, userName: string, success: boolean, error?: string}> = [];
      let successCount = 0;
      let failCount = 0;
      let noMatchCount = 0;

      // Process each file
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        let targetUserId: number | null = null;
        let targetUserName = '';
        let uploadSuccess = false;
        let uploadError = '';

        // If a user is preselected, use that user
        if (selectedUserIdForBulk) {
          targetUserId = Number(selectedUserIdForBulk);
          const user = users.find(u => u.id === targetUserId);
          targetUserName = user ? `${user.nom} ${user.prenom}` : `#${targetUserId}`;
        } else {
          // Auto-match with user based on filename
          const matchResult = matchFileToUser(file.name);
          if (matchResult.userId) {
            targetUserId = matchResult.userId;
            const user = users.find(u => u.id === targetUserId);
            targetUserName = user ? `${user.nom} ${user.prenom}` : `#${targetUserId}`;
          } else {
            // No match found
            uploadResults.push({
              fileName: file.name,
              userId: null,
              userName: 'Non associé',
              success: false,
              error: 'Aucun utilisateur trouvé pour ce fichier'
            });
            noMatchCount++;
            continue;
          }
        }

        // Upload the file to the matched user
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('user_id', targetUserId.toString());
          formData.append('title', file.name);
          formData.append('bulk_upload', 'true'); // Indiquer que c'est un upload en masse
          // Ajouter la date configurée pour l'affichage
          if (bulkUploadDate) {
            formData.append('display_date', bulkUploadDate);
          }

          const response = await fetch(buildAPIURL('/bordereaux'), {
            method: 'POST',
            headers: {
              'x-auth-token': localStorage.getItem('token') || ''
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            uploadSuccess = true;
            successCount++;
            
            // Add to recent uploads
            setRecentUploads(prev => [
              {
                archiveId: data.bordereauId || data.id,
                fileUrl: data.fileUrl || data.filePath,
                title: data.title || file.name,
                userId: targetUserId!,
                userLabel: targetUserName,
                createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString()
              },
              ...prev
            ].slice(0, 20));
          } else {
            const errorData = await response.json().catch(() => ({}));
            uploadError = errorData.error || 'Erreur lors de l\'upload';
            uploadSuccess = false;
            failCount++;
          }
        } catch (error) {
          uploadError = error instanceof Error ? error.message : 'Erreur inconnue';
          uploadSuccess = false;
          failCount++;
        }

        uploadResults.push({
          fileName: file.name,
          userId: targetUserId,
          userName: targetUserName,
          success: uploadSuccess,
          error: uploadError || undefined
        });
      }

      // Show summary
      let message = `✅ ${successCount} fichier(s) uploadé(s) avec succès!\n`;
      if (noMatchCount > 0) {
        message += `⚠️ ${noMatchCount} fichier(s) non associé(s) (aucun utilisateur trouvé)\n`;
      }
      if (failCount > 0) {
        message += `❌ ${failCount} fichier(s) n'ont pas pu être uploadé(s)\n`;
      }

      // Show detailed results
      const detailedResults = uploadResults.map(r => {
        if (r.success) {
          return `✅ ${r.fileName} → ${r.userName}`;
        } else if (r.userId === null) {
          return `⚠️ ${r.fileName} → Non associé`;
        } else {
          return `❌ ${r.fileName} → ${r.userName} (${r.error})`;
        }
      }).join('\n');

      alert(`${message}\n\nDétails:\n${detailedResults}`);

      // Reset form
      setSelectedFiles([]);
      setFileUserMapping([]);
      setSelectedUserIdForBulk('');
      setShowBulkUpload(false);
      
      // Reset file input
      const input = e.target;
      if (input) input.value = '';

      // Reload users data
      await loadUsers();
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Erreur lors de l\'upload en masse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setUploading(false);
    }
  };

  // Handle bulk file selection (original method - for preview mode)
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Enforce: filename must begin with a letter
    const valid = files.filter(f => /^[A-Za-zÀ-ÿ]/.test(f.name));
    const invalid = files.filter(f => !/^[A-Za-zÀ-ÿ]/.test(f.name)).map(f => f.name);
    setSelectedFiles(valid);
    setInvalidNamedFiles(invalid);
    
    // If a user is preselected, clear mapping; otherwise attempt auto-match
    if (selectedUserIdForBulk) {
      setFileUserMapping([]);
    } else {
      const mapping: {fileIndex: number, userId: number, score: number}[] = [];
      valid.forEach((file, index) => {
        const { userId, score } = matchFileToUser(file.name);
        if (userId) mapping.push({ fileIndex: index, userId, score });
      });
      setFileUserMapping(mapping);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Upload each file with its matched user
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mapping = selectedUserIdForBulk
          ? { fileIndex: i, userId: Number(selectedUserIdForBulk), score: 100 }
          : fileUserMapping.find(m => m.fileIndex === i);
        
        if (!mapping) {
          console.warn(`No user mapping found for file ${file.name}, skipping...`);
          failCount++;
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', mapping.userId.toString());
        formData.append('title', file.name);
        formData.append('bulk_upload', 'true'); // Indiquer que c'est un upload en masse
        // Ajouter la date configurée pour l'affichage
        if (bulkUploadDate) {
          formData.append('display_date', bulkUploadDate);
        }
        
        const response = await fetch(buildAPIURL('/bordereaux'), {
          method: 'POST',
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          const u = users.find(u => u.id === mapping.userId);
          setRecentUploads(prev => [
            {
              archiveId: data.bordereauId,
              fileUrl: data.fileUrl || data.filePath,
              title: data.title || file.name,
              userId: mapping.userId,
              userLabel: u ? `${u.nom} ${u.prenom}` : `#${mapping.userId}`,
              createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString()
            },
            ...prev
          ].slice(0, 20));
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to upload file ${file.name}:`, errorData.error || 'Unknown error');
          failCount++;
        }
      }
      
      let message = `✅ ${successCount} fichier(s) uploadé(s) avec succès!`;
      if (failCount > 0) {
        message += `\n⚠️ ${failCount} fichier(s) n'ont pas pu être uploadé(s).`;
      }
      alert(message);
      
      setSelectedFiles([]);
      setFileUserMapping([]);
      setSelectedUserIdForBulk('');
      setShowBulkUpload(false);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Erreur lors de l\'upload en masse');
    } finally {
      setUploading(false);
    }
  };

  // If not admin, show access denied
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Accès refusé</h1>
          <p className="text-red-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion Comptabilité</h1>
            <p className="text-gray-600">Vue d'ensemble de tous les utilisateurs</p>
          </div>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <span>📤</span>
            <span>Upload en masse</span>
          </button>
        </div>

        {recentUploads.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <h3 className="text-xl font-bold text-gray-800">Derniers fichiers uploadés</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentUploads
                .filter((r) => r && r.title) // Filtrer les valeurs null/undefined
                .map((r) => (
                <div key={r.archiveId} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-sm text-gray-600">→ {r.userLabel || 'Inconnu'}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href={r.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Ouvrir</a>
                    <span className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-800">Liste des utilisateurs ({users.length})</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>Aucun utilisateur enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.nom} {user.prenom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">📤 Upload en masse</h3>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
              setSelectedFiles([]);
              setFileUserMapping([]);
              setInvalidNamedFiles([]);
              setBulkUploadDate(new Date().toISOString().split('T')[0]);
                  }}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Date Configuration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Date d'affichage pour les utilisateurs
                  </label>
                  <input
                    type="date"
                    value={bulkUploadDate}
                    onChange={(e) => setBulkUploadDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Cette date sera visible par les utilisateurs lors de l'affichage des fichiers. Par défaut: aujourd'hui.
                  </p>
                </div>

                {/* Mode Selection */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mode d'upload :
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="auto"
                        checked={uploadMode === 'auto'}
                        onChange={(e) => {
                          setUploadMode(e.target.value as 'auto' | 'manual');
                          // Reset when switching modes
                          setSelectedFiles([]);
                          setFileUserMapping([]);
                          setInvalidNamedFiles([]);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-800">⚡ Automatique (Recommandé)</span>
                        <p className="text-xs text-gray-600">Upload direct après sélection - Matching automatique</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="manual"
                        checked={uploadMode === 'manual'}
                        onChange={(e) => {
                          setUploadMode(e.target.value as 'auto' | 'manual');
                          // Reset when switching modes
                          setSelectedFiles([]);
                          setFileUserMapping([]);
                          setInvalidNamedFiles([]);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-800">👁️ Manuel</span>
                        <p className="text-xs text-gray-600">Aperçu avant upload - Contrôle total</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {uploadMode === 'auto' ? '📤 Sélectionner et Uploader les fichiers' : 'Sélectionner les fichiers'}
                  </label>
                  {uploading && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-800 font-medium">Upload en cours...</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={uploading}
                    onChange={uploadMode === 'auto' ? handleBulkFileSelectAndUpload : handleBulkFileSelect}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      ✅ {selectedFiles.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                  {invalidNamedFiles.length > 0 && (
                    <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠ Certains fichiers ont été ignorés car leur nom ne commence pas par une lettre:
                      <ul className="list-disc ml-5">
                        {invalidNamedFiles.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Preview Mapping (shown only in manual mode when no user is preselected) */}
                {uploadMode === 'manual' && selectedFiles.length > 0 && !selectedUserIdForBulk && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
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
                              user ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{file.name}</p>
                              {user ? (
                                <div className="flex items-center space-x-2 text-sm">
                                  <p className="text-green-700">✓ → {user.nom} {user.prenom}</p>
                                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">{Math.round(mapping?.score || 0)}%</span>
                                </div>
                              ) : (
                                <p className="text-red-700 text-sm">
                                  ⚠ Aucun utilisateur trouvé
                                </p>
                              )}
                            </div>
                            {/* Manual override */}
                            <div className="ml-4 w-64">
                              <select
                                value={mapping?.userId || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : 0;
                                  setFileUserMapping((prev) => {
                                    const copy = prev.filter(m => m.fileIndex !== index);
                                    if (val) copy.push({ fileIndex: index, userId: val, score: 100 });
                                    return copy;
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
                              >
                                <option value="">— Assigner manuellement —</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.nom} {u.prenom}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedFiles.length > fileUserMapping.length && (
                      <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
                        <p className="text-amber-800 text-sm">
                          ⚠ {selectedFiles.length - fileUserMapping.length} fichier(s) non associé(s). 
                          Vérifiez les noms de fichiers ou assignez-les manuellement.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Only shown in manual mode */}
                {uploadMode === 'manual' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleBulkUpload}
                      disabled={uploading || selectedFiles.length === 0 || (!selectedUserIdForBulk && fileUserMapping.length === 0)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Upload en cours...' : '🚀 Uploader tous les fichiers'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUpload(false);
                      setSelectedFiles([]);
                      setFileUserMapping([]);
                        setInvalidNamedFiles([]);
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                  >
                    Annuler
                  </button>
                </div>
                )}
                
                {/* Close button for auto mode */}
                {uploadMode === 'auto' && !uploading && (
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setSelectedFiles([]);
                        setFileUserMapping([]);
                        setInvalidNamedFiles([]);
                      }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

// Gestion Utilisateurs Page Component (Admin seulement)
function GestionUtilisateursPage({ users, onFileUpload, clearAllBordereaux }: { users: User[], onFileUpload: (file: File) => void, clearAllBordereaux: () => void }) {
  const [isUploading, setIsUploading] = useState(false);

  // Debug: Vérifier que la fonction se charge
  console.log('GestionUtilisateursPage loaded:', { users: users.length, isUploading });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      
      // Simulation d'upload pour chaque fichier
      setTimeout(() => {
        let totalProcessed = 0;
        let totalUsers = 0;
        const processedFiles: string[] = [];
        
        // Traiter chaque fichier
        Array.from(files).forEach((file) => {
          onFileUpload(file);
          totalProcessed++;
          processedFiles.push(file.name);
        });
        
        setIsUploading(false);
        
        // Message de confirmation détaillé
        const message = `✅ ${totalProcessed} fichier${totalProcessed > 1 ? 's' : ''} uploadé${totalProcessed > 1 ? 's' : ''} avec succès !\n\nFichiers traités :\n${processedFiles.map(name => `• ${name}`).join('\n')}\n\nChaque fichier a été envoyé aux utilisateurs correspondants selon leurs initiales.`;
        alert(message);
      }, 1500);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Super Admin - Upload intelligent par initiales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Liste des utilisateurs avec initiales */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Utilisateurs et Initiales</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.filter(user => user.role === 'user').map((user) => (
                <div key={user.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">{user.name.charAt(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone d'upload */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload Intelligent</h2>
            
            <div className="space-y-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900">Détection automatique</h3>
                <p className="text-gray-600">Le système détecte automatiquement les destinataires selon les initiales AU DÉBUT du nom du fichier</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📝 Exemples de noms de fichiers :</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div><strong>MA</strong>_Rapport_Martin.pdf → Envoyé à MARTIN</div>
                  <div><strong>RA</strong>_Document_Richard.pdf → Envoyé à RICHARD</div>
                  <div><strong>BE</strong>_Bordereau_Bernard.pdf → Envoyé à BERNARD</div>
                  <div><strong>MA_RA</strong>_Partage.pdf → Envoyé à MARTIN et RICHARD</div>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                  💡 <strong>Astuce :</strong> Vous pouvez sélectionner plusieurs fichiers en une seule fois ! Le système analysera chaque fichier et l'enverra automatiquement aux bons utilisateurs.
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-gray-600">
                    <p className="text-lg font-medium mb-2">Cliquez pour uploader plusieurs fichiers</p>
                    <p className="text-sm">PDF, DOC, DOCX, XLS, XLSX</p>
                    <p className="text-xs text-blue-600 mt-2">🎯 Détection automatique par initiales</p>
                    <p className="text-xs text-green-600 mt-1">📁 Sélection multiple autorisée</p>
                  </div>
                </label>
              </div>

              {isUploading && (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyse des fichiers et détection des initiales...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={clearAllBordereaux}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
            >
              🗑️ Vider tous les bordereaux
            </button>
            <button
              onClick={() => {
                // Créer 3 fichiers de test pour MARTIN, RICHARD, BERNARD
                const testFiles = [
                  { name: 'MA_Rapport_Janvier_2025.pdf', initials: 'MA' },
                  { name: 'RA_Document_Fevrier_2025.pdf', initials: 'RA' },
                  { name: 'BE_Bordereau_Mars_2025.pdf', initials: 'BE' }
                ];
                
                testFiles.forEach(file => {
                  const fileObj = new File(['test'], file.name, { type: 'application/pdf' });
                  onFileUpload(fileObj);
                });
                
                alert('✅ 3 fichiers de test créés et envoyés automatiquement :\n\n• MA_Rapport_Janvier_2025.pdf → MARTIN\n• RA_Document_Fevrier_2025.pdf → RICHARD\n• BE_Bordereau_Mars_2025.pdf → BERNARD\n\nVous pouvez maintenant vous connecter avec chaque utilisateur pour vérifier !');
              }}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
            >
              🧪 Créer 3 fichiers de test
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Statistiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'user').length}</div>
              <div className="text-sm text-green-800">Utilisateurs</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="text-sm text-blue-800">Super Admin</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">21</div>
              <div className="text-sm text-purple-800">Total Comptes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nos Archives Page Component - Utilise maintenant le composant d'affichage des archives
function NosArchivesPageComponent() {
  return <NosArchivesPage />;
}