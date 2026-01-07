import { useState, useEffect, lazy, Suspense } from "react";
import { notificationsAPI, buildAPIURL } from './api';
import { User, BordereauFile, Partner } from './types';
import { AlertProvider, useAlert } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages de login chargées immédiatement (nécessaires avant authentification)
import ExtranetLoginPage from './pages/ExtranetLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Lazy loading pour toutes les autres pages - améliore le temps de chargement initial
const GammeFinancierePage = lazy(() => import('./GammeFinancierePage'));
const NosArchivesPage = lazy(() => import('./NosArchivesPage'));
const ManagePage = lazy(() => import('./ManagePage'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const FavorisPage = lazy(() => import('./FavorisPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const GammeProduitsPage = lazy(() => import('./pages/GammeProduitsPage'));
const PartenairesPage = lazy(() => import('./pages/PartenairesPage'));
const RencontresPage = lazy(() => import('./pages/RencontresPage'));
const ReglementairePage = lazy(() => import('./pages/ReglementairePage'));
const ProduitsStructuresPage = lazy(() => import('./pages/ProduitsStructuresPage'));
const SimulateursPage = lazy(() => import('./pages/SimulateursPage'));
const ComptabilitePage = lazy(() => import('./pages/ComptabilitePage'));
const GestionComptabilitePage = lazy(() => import('./pages/GestionComptabilitePage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

// Types pour les utilisateurs et fichiers
interface AuthUserRecord {
  id: number | string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user' | string;
}

// Login Page Components moved to pages/ExtranetLoginPage.tsx and pages/AdminLoginPage.tsx

function App() {
  const { showSuccess, showError, showWarning } = useAlert();
  
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
    
    // Pour /manage, on garde la page - la vérification admin se fait plus tard
    // Cela permet de garder le hash correct pendant le rechargement
    if (hash === 'manage') {
      return 'manage';
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
        } catch (error: any) {
          // Si c'est une erreur d'authentification, ne pas logger (la déconnexion automatique se fera dans api.js)
          if (!error.message?.includes('Token expiré') && !error.message?.includes('Unauthorized')) {
            console.error('Error loading unread count:', error);
          }
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
        showError('Accès refusé : Seuls les administrateurs peuvent accéder à cette page.');
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


  // Composant de chargement pour le lazy loading
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium">Chargement en cours...</p>
          <p className="text-gray-400 text-sm mt-1">Alliance Courtage</p>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    const pageContent = (() => {
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
          return <ProduitsStructuresPage />;
        case "simulateurs":
          return <SimulateursPage />;
        case "comptabilite":
          return <ComptabilitePage currentUser={currentUser} bordereaux={bordereaux} />;
        case "gestion-comptabilite":
          return <GestionComptabilitePage currentUser={currentUser} />;
        case "nos-archives":
          return <NosArchivesPage />;
        case "notifications":
          return <NotificationsPage />;
        case "favoris":
          return <FavorisPage />;
        case "manage":
          return <ManagePage />;
        default:
          // Show 404 for unknown pages, but only if user is logged in
          if (currentUser) {
            return <NotFoundPage onGoHome={() => setCurrentPage('accueil')} />;
          }
          return <HomePage />;
      }
    })();

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {pageContent}
      </Suspense>
    );
  };

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
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ManagePage />
      </Suspense>
    );
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
                className="h-16 sm:h-20 md:h-28 w-auto"
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
                <div className="text-sm font-medium text-gray-900">
                  {currentUser?.prenom && currentUser?.nom 
                    ? `${currentUser.prenom} ${currentUser.nom}`
                    : currentUser?.denomination_sociale || currentUser?.name || 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser?.role === 'admin' ? 'Super Admin' : 'Utilisateur'}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {(currentUser?.prenom || currentUser?.nom || currentUser?.name || 'U')?.charAt(0).toUpperCase()}
                </span>
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
              {/* Page Rencontres temporairement masquée */}
              {/* <li>
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
              </li> */}

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] min-h-0 min-w-0 overflow-y-auto my-auto">
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
                <div>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>ℹ️ Information :</strong> Le nom et le prénom ne peuvent être modifiés que par un administrateur. 
                        Contactez votre administrateur si vous devez les modifier.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        value={profileData.nom}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Le nom ne peut pas être modifié</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        value={profileData.prenom}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Le prénom ne peut pas être modifié</p>
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Astuce :</strong> Vous pouvez modifier votre mot de passe dans l'onglet "Mot de passe".
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProfileModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser?.id) return;

                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      showError('Les mots de passe ne correspondent pas');
                      return;
                    }

                    if (passwordData.newPassword.length < 6) {
                      showWarning('Le mot de passe doit contenir au moins 6 caractères');
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
                        showSuccess('Mot de passe modifié avec succès !');
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowProfileModal(false);
                      } else {
                        showError(data.error || 'Erreur lors de la modification');
                      }
                    } catch (error) {
                      console.error('Error updating password:', error);
                      showError('Erreur lors de la modification du mot de passe');
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                >
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>ℹ️ Sécurité :</strong> Vous pouvez uniquement modifier votre propre mot de passe. 
                        Le système vérifie automatiquement votre identité.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel *</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Entrez votre mot de passe actuel"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe *</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum 6 caractères"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe *</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Répétez le nouveau mot de passe"
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

// Wrapper avec AlertProvider et ThemeProvider
const AppWithProviders = () => (
  <ThemeProvider>
    <AlertProvider>
      <App />
    </AlertProvider>
  </ThemeProvider>
);

export default AppWithProviders;