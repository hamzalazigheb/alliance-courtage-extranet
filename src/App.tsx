import React, { useState, useEffect } from "react";
import GammeFinancierePage from './GammeFinancierePage';
import StructuredProductsDashboard from './StructuredProductsDashboard';
import AdminDashboard from './AdminDashboard';
import ProduitsStructuresPageComponent from './ProduitsStructuresPage';
import NosArchivesPage from './NosArchivesPage';
import ManagePage from './ManagePage';
import { authAPI, formationsAPI } from './api';

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

// Login Page Component
function LoginPage({ onLogin, users }: { onLogin: (user: User) => void, users: User[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Connexion via l'API backend
      const response: LoginResponse = await authAPI.login(email, password);
      
      // Sauvegarder le token et nettoyer les anciennes clés legacy
      localStorage.setItem('token', response.token);
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
      
      // Créer l'objet utilisateur pour onLogin
      const user: User = {
        id: response.user.id.toString(),
        name: `${response.user.prenom} ${response.user.nom}`,
        email: response.user.email,
        role: response.user.role === 'admin' ? 'admin' : 'user'
      };
      
      setIsLoading(false);
      onLogin(user);
    } catch (error) {
      setIsLoading(false);
      alert(error instanceof Error ? error.message : "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/alliance-courtage-logo.svg" 
              alt="Alliance Courtage Logo" 
              className="h-24 w-auto"
            />
          </div>
          <p className="text-sm text-gray-600">GROUPEMENT NATIONAL DES COURTIERS D'ASSURANCES</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-100 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    alert('Veuillez d\'abord entrer votre email');
                    return;
                  }
                  
                  // Confirmer que l'utilisateur veut réinitialiser (surtout pour les admins)
                  const isAdminReset = window.confirm(
                    'Réinitialiser le mot de passe pour ' + email + '?\n\n' +
                    '📧 Si c\'est un compte ADMIN, vous recevrez un email avec le nouveau mot de passe.\n\n' +
                    'Cliquez sur OK pour continuer.'
                  );
                  
                  if (!isAdminReset) {
                    return;
                  }
                  
                  try {
                    // Essayer d'abord la réinitialisation automatique pour admins (avec email)
                    const adminResponse = await fetch('http://localhost:3001/api/admin-password-reset/request', {
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
                      return;
                    }
                    
                    // Si ce n'est pas un admin, essayer la méthode normale
                    const response = await fetch('http://localhost:3001/api/password-reset/request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });

                    const data = await response.json();
                    if (response.ok) {
                      alert('✅ Demande envoyée avec succès !\n\n' +
                        '📋 Un administrateur va recevoir votre demande et réinitialiser votre mot de passe.\n\n' +
                        '💡 Pour les comptes ADMIN : utilisez plutôt la réinitialisation automatique qui envoie un email.');
                    } else {
                      alert(data.error || 'Erreur lors de la demande de réinitialisation');
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('❌ Erreur de connexion au serveur.\n\n' +
                      'Vérifiez que le serveur backend est démarré.');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center justify-end w-full"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Mot de passe oublié ?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>

            {/* Footer Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>
          </form>
        </div>

        {/* Demo Info */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">🔐 Comptes de démonstration</h3>
            <div className="text-xs text-blue-600 space-y-1">
              <div><strong>Super Admin:</strong> admin@alliance.com</div>
              <div><strong>Utilisateur:</strong> martin@alliance.com</div>
              <div className="mt-2">Mot de passe: n'importe quel mot de passe</div>
            </div>
          </div>
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

  // Initialize URL hash and listen for hash changes
  useEffect(() => {
    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = 'accueil';
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-comptabilite', 'nos-archives', 'manage'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
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
              case "manage":
        return <ManagePage />;
      default:
        return <HomePage />;
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher la page de login
  if (!isLoggedIn) {
    return <LoginPage onLogin={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
      // Sauvegarder dans localStorage pour la persistance
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
    }} users={users} />;
  }

  // Render ManagePage independently without sidebar
  if (currentPage === "manage") {
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">
                  {currentUser?.role === 'admin' ? 'Super Admin' : 'Utilisateur'}
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">{currentUser?.name?.charAt(0)}</span>
              </div>
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
                }}
                className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium"
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
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// Home Page Component - Now loads content dynamically from CMS
function HomePage() {
  interface HomePageContent {
    welcomeTitle: string;
    news: Array<{ title: string; content: string; date: string; color: string }>;
    newsletter: { title: string; badge: string; description: string; filePath: string; isRecent: boolean } | null;
    services: Array<{ name: string }>;
    contact: { phone: string; email: string; location: string };
  }

  const [content, setContent] = useState<HomePageContent>({
    welcomeTitle: 'Bienvenue chez Alliance Courtage',
    news: [],
    newsletter: null,
    services: [],
    contact: { phone: '07.45.06.43.88', email: 'contact@alliance-courtage.fr', location: 'Paris, France' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/cms/home', {
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
          {content.newsletter && (
          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-100 rounded-full -ml-8 -mb-8 opacity-30"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Newsletter patrimoniale</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Rentrée 2025
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Découvrez notre newsletter patrimoniale spéciale rentrée 2025 avec les dernières tendances et conseils d'investissement pour optimiser votre patrimoine.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <a 
                      href="/Newsletter patrimoniale - Rentrée 2025.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger le PDF
                    </a>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Publication récente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Services and Contact Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Contact</h3>
          <div className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
            <p className="flex items-center">
              <span className="mr-2">📞</span>
              <a href={`tel:${content.contact.phone.replace(/\./g, '')}`} className="hover:text-indigo-600 transition-colors">{content.contact.phone}</a>
            </p>
            <p className="flex items-center">
              <span className="mr-2">✉️</span>
              <a href={`mailto:${content.contact.email}`} className="hover:text-indigo-600 transition-colors">{content.contact.email}</a>
            </p>
            <p className="flex items-center">
              <span className="mr-2">📍</span>
              {content.contact.location}
            </p>
          </div>
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
        const resp = await fetch('http://localhost:3001/api/cms/gamme-produits', {
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

  // Resolve catalogue URL from CMS (safe for hash routing)
  const catalogUrl = (() => {
    const url = cmsProducts?.catalogue?.fileUrl || '';
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url; // absolute
    return url.startsWith('/') ? url : `/${url}`; // make absolute path
  })();

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

      {/* Download Block Footer */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-blue-700 rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-4 sm:p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-bold text-white">{cmsProducts?.catalogue?.title || 'Téléchargez notre catalogue produits'}</h3>
                {cmsProducts?.catalogue?.badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                    {cmsProducts.catalogue.badge}
                </span>
                )}
              </div>
              
              {(
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  {cmsProducts?.catalogue?.description || "Découvrez notre gamme complète de produits d'assurance et d'investissement pour tous vos besoins."}
              </p>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {catalogUrl ? (
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center justify-center px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {cmsProducts?.catalogue?.downloadLabel || 'Télécharger le PDF'}
                </a>
                ) : (
                  <button disabled className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white/70 text-sm font-medium rounded-lg cursor-not-allowed">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {cmsProducts?.catalogue?.downloadLabel || 'Télécharger le PDF'}
                </button>
                )}
                
                <div className="flex items-center text-xs text-white/60">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {cmsProducts?.catalogue?.updatedAtLabel || 'Mise à jour 2025'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
      </div>
    </div>
  );
}

// Partenaires Page Component
function PartenairesPage() {
  const [selectedCategory, setSelectedCategory] = useState("tous");
  const [partenaires, setPartenaires] = useState({ coa: [], cif: [] });
  const [loading, setLoading] = useState(true);

  // Charger les partenaires depuis l'API
  useEffect(() => {
    const loadPartenaires = async () => {
      try {
        // Load all partners (including inactive for testing)
        const response = await fetch('http://localhost:3001/api/partners?active=false');
        const data = await response.json();
        
        console.log('📊 Partners loaded from API:', data.length);
        
        // Organiser par catégorie (only active partners for display)
        const coa = data.filter((p: any) => p.is_active && (p.category === 'coa' || p.category?.toLowerCase() === 'coa'));
        const cif = data.filter((p: any) => p.is_active && (p.category === 'cif' || p.category?.toLowerCase() === 'cif'));
        
        setPartenaires({ coa, cif });
        
        console.log(`✅ Active COA: ${coa.length}, Active CIF: ${cif.length}`);
        console.log('COA Partners:', coa.map((p: any) => p.nom));
        console.log('CIF Partners:', cif.map((p: any) => p.nom));
      } catch (error) {
        console.error('Erreur chargement partenaires:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPartenaires();
  }, []);

  const getFilteredPartenaires = () => {
    if (selectedCategory === "coa") return partenaires.coa;
    if (selectedCategory === "cif") return partenaires.cif;
    return [...partenaires.coa, ...partenaires.cif];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Nos Partenaires</h1>
        <p className="text-gray-600 text-lg">
          Découvrez nos partenaires de confiance en assurance et finance
        </p>
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
              {partenaires.coa.map((partenaire, index) => (
                <div key={`coa-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? (
                      <img 
                        src={`http://localhost:3001${partenaire.logo_url}`} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                        onError={(e) => {
                          console.error('Image failed to load:', partenaire.logo_url);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">${partenaire.nom.charAt(0)}</div>`;
                        }}
                      />
                    ) : partenaire.logo ? (
                      partenaire.logo.startsWith('http') ? (
                      <img 
                        src={partenaire.logo} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                      />
                    ) : (
                        <img 
                          src={partenaire.logo} 
                          alt={`Logo ${partenaire.nom}`}
                          className="h-20 w-auto object-contain max-w-full"
                          style={{ maxHeight: '80px' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      )
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
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
              {partenaires.cif.map((partenaire, index) => (
                <div key={`cif-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? (
                      <img 
                        src={`http://localhost:3001${partenaire.logo_url}`} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                        onError={(e) => {
                          console.error('Image failed to load:', partenaire.logo_url);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">${partenaire.nom.charAt(0)}</div>`;
                        }}
                      />
                    ) : partenaire.logo ? (
                      partenaire.logo.startsWith('http') ? (
                      <img 
                        src={partenaire.logo} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                      />
                    ) : (
                        <img 
                          src={partenaire.logo} 
                          alt={`Logo ${partenaire.nom}`}
                          className="h-20 w-auto object-contain max-w-full"
                          style={{ maxHeight: '80px' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      )
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
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
            .filter((partenaire) => partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0)
            .map((partenaire) => (
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
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">RENCONTRES</h1>
        <p className="text-gray-600 text-lg">
          Espace dédié aux rencontres et échanges de la communauté Alliance Courtage
        </p>
      </div>

      {/* Section Rencontres Actuelles */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📅</span>
          Prochaines Rencontres
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rencontre 1 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-indigo-800">Assemblée Générale 2025</h3>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">15 Mars 2025</span>
            </div>
            <p className="text-gray-700 mb-4">
              Assemblée générale annuelle d'Alliance Courtage avec présentation des résultats et perspectives 2025.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📍 Paris, France</span>
              <span>⏰ 14h00 - 18h00</span>
            </div>
            <button className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors">
              S'inscrire
            </button>
          </div>

          {/* Rencontre 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-800">Formation Réglementation</h3>
              <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">22 Avril 2025</span>
            </div>
            <p className="text-gray-700 mb-4">
              Formation sur les nouvelles réglementations en assurance et finance pour les membres Alliance Courtage.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📍 Lyon, France</span>
              <span>⏰ 9h00 - 17h00</span>
            </div>
            <button className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
              S'inscrire
            </button>
          </div>
        </div>
      </div>

      {/* Section Historique des Rencontres */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📚</span>
          Historique des Rencontres
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Rencontre Régionale Sud</h3>
              <p className="text-sm text-gray-600">Marseille, 15 Décembre 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              📄 Voir le compte-rendu
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Formation Produits Structurés</h3>
              <p className="text-sm text-gray-600">Paris, 8 Novembre 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              📄 Voir le compte-rendu
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Assemblée Générale 2024</h3>
              <p className="text-sm text-gray-600">Paris, 20 Mars 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              📄 Voir le compte-rendu
            </button>
          </div>
        </div>
      </div>

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

  // Structure des 10 dossiers avec documents
  const folders = [
    {
      id: "clients",
      title: "0. CLIENTS",
      documents: [
        { name: "Procedure_kit_reglementaire_clients_assurance", date: "15/01/2024", type: "Procédure" },
        { name: "Parcours client - Assurance vie", date: "12/01/2024", type: "Guide" },
        { name: "Parcours client - Assurance non-vie", date: "10/01/2024", type: "Guide" },
        { name: "Questionnaire client type", date: "08/01/2024", type: "Modèle" }
      ]
    },
    {
      id: "conflits-interet",
      title: "1. CONFLITS D'INTÉRÊT",
      documents: [
        { name: "Procédure de prévention et gestion des Conflits d'intérêts", date: "10/07/2020", type: "Procédure" },
        { name: "Déclaration de conflit d'intérêt", date: "05/01/2024", type: "Modèle" },
        { name: "Registre des conflits d'intérêt", date: "03/01/2024", type: "Modèle" }
      ]
    },
    {
      id: "controle-fraude",
      title: "2. CONTRÔLE ET LUTTE CONTRE LA FRAUDE",
      documents: [
        { name: "Procédure de détection de fraude", date: "20/01/2024", type: "Procédure" },
        { name: "Signalement suspicion de fraude", date: "18/01/2024", type: "Modèle" },
        { name: "Checklist vigilance anti-fraude", date: "15/01/2024", type: "Checklist" }
      ]
    },
    {
      id: "distribution",
      title: "3. DISTRIBUTION",
      documents: [
        { name: "Procédure de distribution des produits", date: "22/01/2024", type: "Procédure" },
        { name: "Convention de distribution type", date: "20/01/2024", type: "Modèle" },
        { name: "Guide des bonnes pratiques distribution", date: "18/01/2024", type: "Guide" }
      ]
    },
    {
      id: "gouvernance",
      title: "4. GOUVERNANCE",
      documents: [
        { name: "Organigramme de gouvernance", date: "25/01/2024", type: "Organigramme" },
        { name: "Procédure de prise de décision", date: "23/01/2024", type: "Procédure" },
        { name: "Règlement intérieur", date: "21/01/2024", type: "Règlement" }
      ]
    },
    {
      id: "lcb-ft",
      title: "5. LCB-FT",
      documents: [
        { name: "Procédure - LAB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "Procédure" },
        { name: "Questionnaire Risques LCB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "Questionnaire" },
        { name: "Note Veille Courtiers - Application du gel des avoirs", date: "10/07/2020", type: "Note" }
      ]
    },
    {
      id: "pca",
      title: "6. PCA",
      documents: [
        { name: "Plan de Continuité d'Activité", date: "28/01/2024", type: "Plan" },
        { name: "Procédure de crise", date: "26/01/2024", type: "Procédure" },
        { name: "Test PCA annuel", date: "24/01/2024", type: "Modèle" }
      ]
    },
    {
      id: "presentation-cabinet",
      title: "7. PRÉSENTATION DU CABINET",
      documents: [
        { name: "Note mentions légales obligatoires IAS (08 11 2019)", date: "10/07/2020", type: "Note" },
        { name: "Présentation cabinet type", date: "30/01/2024", type: "Présentation" },
        { name: "Brochure commerciale", date: "28/01/2024", type: "Brochure" }
      ]
    },
    {
      id: "rgpd",
      title: "8. RGPD",
      documents: [
        { name: "Procédure RGPD cabinet", date: "02/02/2024", type: "Procédure" },
        { name: "Registre des traitements", date: "31/01/2024", type: "Modèle" },
        { name: "Formulaire consentement client", date: "29/01/2024", type: "Modèle" }
      ]
    },
    {
      id: "traitement-reclamations",
      title: "9. TRAITEMENT DES RÉCLAMATIONS",
      documents: [
        { name: "Procédure de traitement des réclamations", date: "05/02/2024", type: "Procédure" },
        { name: "Registre des réclamations", date: "03/02/2024", type: "Modèle" },
        { name: "Modèle de réponse réclamation", date: "01/02/2024", type: "Modèle" }
      ]
    }
  ];

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
                  <div className="text-sm opacity-90">
                    {completedHours}h / {requiredHours}h
                  </div>
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
                          {formation.file_path && (
                            <a 
                              href={`http://localhost:3001${formation.file_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors inline-block"
                            >
                          Télécharger
                            </a>
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
          <div className="space-y-4">
            {folders.map((folder) => (
              <div key={folder.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête du dossier */}
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full bg-gray-50 hover:bg-gray-100 p-4 text-left transition-colors flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{folder.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{folder.documents.length} document(s)</span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedFolders[folder.id] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Contenu du dossier */}
                {expandedFolders[folder.id] && (
                  <div className="border-t border-gray-200 bg-white">
                    {folder.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 text-blue-600">
                            📄
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.date}</div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [userFiles, setUserFiles] = useState<any[]>([]);
  
  // Load files from database for current user
  useEffect(() => {
    const loadUserFiles = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await fetch(`http://localhost:3001/api/archives?user_id=${currentUser.id}`, {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserFiles(data);
        }
      } catch (error) {
        console.error('Error loading user files:', error);
      }
    };
    loadUserFiles();
  }, [currentUser?.id]);
  
  // Debug simple pour vérifier le chargement
  console.log('ComptabilitePage loaded for user:', currentUser?.name);

  // Fonction pour télécharger un fichier
  const handleDownload = (fileName: string) => {
    console.log('📥 Tentative de téléchargement de:', fileName);
    
    // Créer un contenu simple
    const content = `BORDEREAU DE COMMISSION - ${currentUser?.name}

Fichier: ${fileName}
Utilisateur: ${currentUser?.name}
Date: ${new Date().toLocaleDateString('fr-FR')}

=== DÉTAILS ===
Mois: ${fileName.includes('Janvier') ? 'Janvier' : fileName.includes('Février') ? 'Février' : fileName.includes('Mars') ? 'Mars' : 'Non spécifié'}
Année: 2025

=== COMMISSIONS ===
Prime nette: 1,250.00 €
Commission: 187.50 €
TVA: 37.50 €
Total: 225.00 €

---
Alliance Courtage - Extranet
`;
    
    // Créer et télécharger le fichier
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName.replace('.pdf', '.txt');
    
    // Ajouter au DOM, cliquer, puis supprimer
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Nettoyer l'URL
    URL.revokeObjectURL(url);
    
    console.log('✅ Téléchargement terminé pour:', fileName);
  };

  const handleSmsVerification = async () => {
    setIsLoading(true);
    // Simulation d'envoi SMS
    setTimeout(() => {
      setIsLoading(false);
      if (smsCode === "123456") { // Code de test
        setIsAuthenticated(true);
      } else {
        alert("Code SMS incorrect");
      }
    }, 2000);
  };

  const sendSmsCode = () => {
    setIsLoading(true);
    // Simulation d'envoi SMS
    setTimeout(() => {
      setIsLoading(false);
      alert("Code SMS envoyé sur votre téléphone");
    }, 1500);
  };

  // Filtrer les bordereaux par utilisateur et année
  const userBordereaux = bordereaux.filter(bordereau => 
    bordereau.userId === currentUser?.id && bordereau.year === selectedYear
  );

  // Combine database files with bordereaux
  const displayFiles = userFiles.map(file => ({
    id: `db_${file.id}`,
    fileName: file.title || file.file_path?.split('/').pop() || 'Unknown',
    uploadDate: file.created_at,
    month: file.created_at ? new Date(file.created_at).toLocaleString('fr-FR', { month: 'long' }) : 'Unknown',
    year: file.year || new Date().getFullYear().toString(),
    userId: file.uploaded_by?.toString() || '',
    uploadedBy: file.uploaded_by_nom && file.uploaded_by_prenom ? `${file.uploaded_by_prenom} ${file.uploaded_by_nom}` : 'Admin',
    file_path: file.file_path
  }));
  
  // Combine both sources
  const allUserFiles = [...userBordereaux, ...displayFiles];

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
    userBordereaux: userBordereaux,
    bordereauxByMonth: bordereauxByMonth,
    martinFiles: bordereaux.filter(b => b.userId === '2'),
    richardFiles: bordereaux.filter(b => b.userId === '8'),
    bernardFiles: bordereaux.filter(b => b.userId === '4'),
    // Vérifier si des fichiers sont mal assignés
    wrongAssignments: bordereaux.filter(b => {
      const fileName = b.fileName.toUpperCase();
      const userId = b.userId;
      if (fileName.startsWith('MA') && userId !== '2') return true; // MA mais pas MARTIN
      if (fileName.startsWith('RA') && userId !== '8') return true; // RA mais pas RICHARD
      if (fileName.startsWith('BE') && userId !== '4') return true; // BE mais pas BERNARD
      return false;
    }),
    // Debug supplémentaire
    totalBordereaux: bordereaux.length,
    currentUserBordereaux: bordereaux.filter(b => b.userId === currentUser?.id)
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">COMPTABILITÉ</h1>
          <p className="text-gray-600 text-lg">
            Accès sécurisé aux documents comptables
          </p>
        </div>

        {/* Security Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Sécurisé</h2>
            <p className="text-gray-600">
              Cette section nécessite une authentification à deux niveaux pour des raisons de sécurité.
            </p>
          </div>

          <div className="space-y-6">
            {/* SMS Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code SMS de vérification
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="Entrez le code reçu par SMS"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
                <button
                  onClick={sendSmsCode}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  {isLoading ? "Envoi..." : "Envoyer SMS"}
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleSmsVerification}
              disabled={smsCode.length !== 6 || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors font-medium"
            >
              {isLoading ? "Vérification..." : "Vérifier et Accéder"}
            </button>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Sécurité renforcée</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Le code SMS sera envoyé sur le téléphone enregistré pour votre compte courtier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Se déconnecter
          </button>
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
                        {file.id?.startsWith('db_') && file.file_path ? (
                          <a 
                            href={`http://localhost:3001${file.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium text-center"
                          >
                            Télécharger
                          </a>
                        ) : (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownload(file.fileName);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          Télécharger
                        </button>
                        )}
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

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      // Load recent uploads from backend so they persist across sessions
      (async () => {
        try {
          const res = await fetch('http://localhost:3001/api/archives/recent?limit=20', {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          });
          if (res.ok) {
            const data = await res.json();
            setRecentUploads(data);
          }
        } catch {}
      })();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users', {
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
  const matchFileToUser = (fileName: string): { userId: number | null, score: number } => {
    const fileNorm = normalize(fileName);
    let best: { userId: number | null, score: number } = { userId: null, score: 0 };

    users.forEach((u) => {
      const nom = normalize(u.nom);
      const prenom = normalize(u.prenom);
      const full1 = `${prenom} ${nom}`.trim();
      const full2 = `${nom} ${prenom}`.trim();
      const initials = `${prenom.charAt(0)}${nom.charAt(0)}`;
      const emailLocal = normalize((u.email || '').split('@')[0] || '');

      let score = 0;
      if (fileNorm === full1 || fileNorm === full2) score = Math.max(score, 100);
      if (fileNorm.includes(full1) || fileNorm.includes(full2)) score = Math.max(score, 95);
      if (fileNorm.includes(prenom) && fileNorm.includes(nom)) score = Math.max(score, 90);
      if (emailLocal && (emailLocal.includes(nom) || emailLocal.includes(prenom)) && fileNorm.includes(emailLocal)) score = Math.max(score, 85);
      if (fileNorm.includes(initials)) score = Math.max(score, 75);
      if (nom.length >= 3 && fileNorm.includes(nom.substring(0, 3))) score = Math.max(score, 70);
      if (prenom.length >= 3 && fileNorm.includes(prenom.substring(0, 3))) score = Math.max(score, 70);

      if (score > best.score) best = { userId: u.id, score };
    });

    // threshold
    if (best.score < 80) return { userId: null, score: best.score };
    return best;
  };

  // Handle bulk file selection
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
        
        const response = await fetch('http://localhost:3001/api/archives', {
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
              archiveId: data.archiveId,
              fileUrl: data.fileUrl || data.filePath,
              title: data.title || file.name,
              userId: mapping.userId,
              userLabel: u ? `${u.nom} ${u.prenom}` : `#${mapping.userId}`,
              createdAt: new Date().toISOString()
            },
            ...prev
          ].slice(0, 20));
          successCount++;
        } else {
          console.error(`Failed to upload file ${file.name}`);
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
              {recentUploads.map((r) => (
                <div key={r.archiveId} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-sm text-gray-600">→ {r.userLabel}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Ouvrir</a>
                    <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('fr-FR')}</span>
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
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Target user selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner l'utilisateur destinataire</label>
                  <select
                    value={selectedUserIdForBulk}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setSelectedUserIdForBulk(val);
                      // When a specific user is chosen, ignore auto-mapping
                      if (val !== '') setFileUserMapping([]);
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  >
                    <option value="">— Choisir un utilisateur (optionnel) —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nom} {u.prenom} — {u.email}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">Si vous choisissez un utilisateur, tous les fichiers seront envoyés à celui‑ci.</p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Astuce:</strong> Vous pouvez soit sélectionner un utilisateur ci‑dessus pour envoyer tous les fichiers, soit laisser vide et nommer les fichiers avec le nom/initiales pour une association automatique.
                  </p>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sélectionner les fichiers
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleBulkFileSelect}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
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

                {/* Preview Mapping (shown only when no user is preselected) */}
                {selectedFiles.length > 0 && !selectedUserIdForBulk && (
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

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleBulkUpload}
                    disabled={uploading || selectedFiles.length === 0 || fileUserMapping.length === 0}
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
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                  >
                    Annuler
                  </button>
                </div>
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