import React, { useState, useEffect } from "react";
import GammeFinancierePage from './GammeFinancierePage';

// Types pour les utilisateurs et fichiers
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
    
    // Simulation de connexion
    setTimeout(() => {
      setIsLoading(false);
      if (email && password) {
        // Trouver l'utilisateur correspondant
        const user = users.find(u => u.email === email);
        if (user) {
          onLogin(user);
        } else {
          alert("Utilisateur non trouvé");
        }
      } else {
        alert("Veuillez remplir tous les champs");
      }
    }, 1500);
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
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition-colors"
              >
                Mot de passe oublié ?
              </button>
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
    const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-utilisateurs'];
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
      const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-utilisateurs'];
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
  
  // Données utilisateurs (simulation)
  const users: User[] = [
    { id: '1', name: 'JEAN MARTIN', email: 'admin@alliance.com', role: 'admin' },
    { id: '2', name: 'MARTIN', email: 'martin@alliance.com', role: 'user' },
    { id: '3', name: 'DUPONT', email: 'dupont@alliance.com', role: 'user' },
    { id: '4', name: 'BERNARD', email: 'bernard@alliance.com', role: 'user' },
    { id: '5', name: 'THOMAS', email: 'thomas@alliance.com', role: 'user' },
    { id: '6', name: 'PETIT', email: 'petit@alliance.com', role: 'user' },
    { id: '7', name: 'ROBERT', email: 'robert@alliance.com', role: 'user' },
    { id: '8', name: 'RICHARD', email: 'richard@alliance.com', role: 'user' },
    { id: '9', name: 'DURAND', email: 'durand@alliance.com', role: 'user' },
    { id: '10', name: 'DUBOIS', email: 'dubois@alliance.com', role: 'user' },
    { id: '11', name: 'MOREAU', email: 'moreau@alliance.com', role: 'user' },
    { id: '12', name: 'LAURENT', email: 'laurent@alliance.com', role: 'user' },
    { id: '13', name: 'SIMON', email: 'simon@alliance.com', role: 'user' },
    { id: '14', name: 'MICHEL', email: 'michel@alliance.com', role: 'user' },
    { id: '15', name: 'LEFEBVRE', email: 'lefebvre@alliance.com', role: 'user' },
    { id: '16', name: 'LEROY', email: 'leroy@alliance.com', role: 'user' },
    { id: '17', name: 'ROUX', email: 'roux@alliance.com', role: 'user' },
    { id: '18', name: 'DAVID', email: 'david@alliance.com', role: 'user' },
    { id: '19', name: 'BERTRAND', email: 'bertrand@alliance.com', role: 'user' },
    { id: '20', name: 'MOREL', email: 'morel@alliance.com', role: 'user' },
    { id: '21', name: 'FOURNIER', email: 'fournier@alliance.com', role: 'user' }
  ];

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
        return <ReglementairePage />;
      case "produits-structures":
        return <ProduitsStructuresPage />;
      case "simulateurs":
        return <SimulateursPage />;
      case "comptabilite":
        return <ComptabilitePage currentUser={currentUser} bordereaux={bordereaux} />;
      case "gestion-utilisateurs":
        return <GestionUtilisateursPage users={users} onFileUpload={handleFileUpload} clearAllBordereaux={clearAllBordereaux} />;
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
              
              {/* Logo */}
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
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
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "comptabilite" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "comptabilite" ? "font-semibold" : ""}>Comptabilité</span>
                </button>
              </li>
              
              {/* Menu Admin seulement visible pour les admins */}
              {currentUser?.role === 'admin' && (
                <li>
                  <button 
                    onClick={() => changePage("gestion-utilisateurs")}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                      currentPage === "gestion-utilisateurs" 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md ${
                      currentPage === "gestion-utilisateurs" ? "bg-white/20" : "border-2 border-gray-400"
                    }`}></div>
                    <span className={currentPage === "gestion-utilisateurs" ? "font-semibold" : ""}>👥 Gestion Utilisateurs</span>
                  </button>
                </li>
              )}
              <li>
                <button 
                  onClick={() => changePage("reglementaire")}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === "reglementaire" 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md ${
                    currentPage === "reglementaire" ? "bg-white/20" : "border-2 border-gray-400"
                  }`}></div>
                  <span className={currentPage === "reglementaire" ? "font-semibold" : ""}>Règlementaire</span>
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

// Home Page Component
function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Bienvenue chez Alliance Courtage</h1>
      </div>

      {/* News Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Actualités</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* News Item 1 */}
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Nouvelle réglementation assurance-vie</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">
                Découvrez les dernières modifications de la réglementation sur l'assurance-vie et leurs impacts sur vos contrats.
              </p>
              <span className="text-xs text-gray-500">15/01/2025</span>
            </div>
          </div>

          {/* News Item 2 */}
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Évolution des taux d'intérêt</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">
                Analyse des tendances actuelles des taux d'intérêt et conseils pour optimiser vos placements.
              </p>
              <span className="text-xs text-gray-500">12/01/2025</span>
            </div>
          </div>

          {/* News Item 3 */}
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Nouveaux produits de prévoyance</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">
                Présentation de nos nouveaux contrats de prévoyance adaptés aux besoins des entreprises.
              </p>
              <span className="text-xs text-gray-500">10/01/2025</span>
            </div>
          </div>

          {/* Newsletter patrimoniale */}
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Nos Services</h3>
          <ul className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
            <li>• Epargne et retraite</li>
            <li>• Prévoyance et santé</li>
            <li>• Assurances collectives</li>
            <li>• Investissement financier (CIF)</li>
          </ul>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Contact</h3>
          <div className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
            <p className="flex items-center">
              <span className="mr-2">📞</span>
              <a href="tel:0745064388" className="hover:text-indigo-600 transition-colors">07.45.06.43.88</a>
            </p>
            <p className="flex items-center">
              <span className="mr-2">✉️</span>
              <a href="mailto:contact@alliance-courtage.fr" className="hover:text-indigo-600 transition-colors">contact@alliance-courtage.fr</a>
            </p>
            <p className="flex items-center">
              <span className="mr-2">📍</span>
              Paris, France
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

  const clientTypes = [
    { id: "particulier", name: "Particulier", icon: "👤" },
    { id: "professionnel", name: "Professionnel", icon: "💼" },
    { id: "entreprise", name: "Entreprise", icon: "🏢" }
  ];

  const productTypes = [
    { id: "epargne", name: "Épargne", icon: "💰" },
    { id: "retraite", name: "Retraite", icon: "🏖️" },
    { id: "prevoyance", name: "Prévoyance", icon: "🛡️" },
    { id: "sante", name: "Santé", icon: "🏥" },
    { id: "cif", name: "Conseil en investissement financier", icon: "📈" }
  ];

  const getProducts = () => {
    const products = {
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
    return products[selectedClientType][selectedProductType] || [];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Gamme Produits</h1>
        <p className="text-gray-600 text-lg">
          Découvrez nos solutions adaptées à chaque type de client et de produit
        </p>
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
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-medium text-gray-800">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Type de Produit</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {productTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedProductType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedProductType === type.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium text-gray-800 text-sm">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Produits {clientTypes.find(t => t.id === selectedClientType)?.name} - {productTypes.find(t => t.id === selectedProductType)?.name}
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

// Partenaires Page Component
function PartenairesPage() {
  const [selectedCategory, setSelectedCategory] = useState("tous");

  // Données des partenaires
  const partenaires = {
    coa: [
      {
        id: 5,
        nom: "ABEILLE VIE",
        logo: "/abeille-assurances-logo.svg",
        site: "https://www.abeille-assurances.fr",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "15/01/2024", type: "Protocole" },
          { nom: "Convention vie", date: "10/06/2023", type: "Convention" }
        ]
      },
      {
        id: 6,
        nom: "AG2R",
        logo: "/AG2R.png",
        site: "https://inscription-partenaires.ag2rlamondiale.fr/#/home",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "20/01/2024", type: "Protocole" },
          { nom: "Convention retraite", date: "15/05/2024", type: "Convention" }
        ]
      },
      {
        id: 4,
        nom: "CNP Assurances",
        logo: "🟡",
        site: "https://www.cnp.fr",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "30/01/2024", type: "Protocole" },
          { nom: "Avenant retraite", date: "18/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 7,
        nom: "CARDIF",
        logo: "/cqrdif.svg",
        site: "https://finagora.cardif.fr/fr/web/finagora/login",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "25/01/2024", type: "Protocole" },
          { nom: "Convention Finagora", date: "18/06/2024", type: "Convention" }
        ]
      },
      {
        id: 8,
        nom: "CARDIF Luxembourg",
        logo: "/CARLV_BL_F_Q.webp",
        site: "https://cardifluxvie.com/",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "30/01/2024", type: "Protocole" },
          { nom: "Convention Wealth Management", date: "20/06/2024", type: "Convention" }
        ]
      },
      {
        id: 9,
        nom: "GENERALI PATRIMOINE",
        logo: "/general.png",
        site: "https://www.ssogf.generali.fr/user/auth/dologin?tabId=976550373",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "05/02/2024", type: "Protocole" },
          { nom: "Convention Patrimoine", date: "25/06/2024", type: "Convention" }
        ]
      },
      {
        id: 10,
        nom: "MMA",
        logo: "/mmm.jpg",
        site: "https://sso.connective-software.fr/error/direct-access",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "10/02/2024", type: "Protocole" },
          { nom: "Convention MMA", date: "30/06/2024", type: "Convention" }
        ]
      },
      {
        id: 11,
        nom: "SELENCIA",
        logo: "/s.jpg",
        site: "https://www.selencia-patrimoine.fr/",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "15/02/2024", type: "Protocole" },
          { nom: "Convention Patrimoine", date: "05/07/2024", type: "Convention" }
        ]
      },
      {
        id: 12,
        nom: "SWISSLIFE",
        logo: "/swiss.svg",
        site: "https://www.swisslifeone.fr/index-swisslifeOne.html",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "20/02/2024", type: "Protocole" },
          { nom: "Convention SwissLife One", date: "10/07/2024", type: "Convention" }
        ]
      },
      {
        id: 13,
        nom: "UAF PATRIMOINE",
        logo: "/vie.svg",
        site: "https://portal.oriadys.fr/web/cgpi/login",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "25/02/2024", type: "Protocole" },
          { nom: "Convention Oriadys", date: "15/07/2024", type: "Convention" }
        ]
      }
    ],
    cif: [
      {
        id: 15,
        nom: "AESTIAM",
        logo: "/logo-aestiam-2025-blanc.svg",
        site: "https://www.aestiam.com/",
        documents: [
          { nom: "Convention de distribution 2024", date: "10/02/2024", type: "Convention" },
          { nom: "Avenant SCPI", date: "30/03/2024", type: "Avenant" }
        ]
      },
      {
        id: 16,
        nom: "ALTAREA IM",
        logo: "/ALTAREA_IM_LOGO_RVB_coul_hd-990x983.webp",
        site: "https://altarea-im.com/",
        documents: [
          { nom: "Convention de distribution 2024", date: "15/02/2024", type: "Convention" },
          { nom: "Avenant SCPI Alta Convictions", date: "05/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 17,
        nom: "ATLAND VOISIN",
        logo: "/atlandpng.png",
        site: "https://extranet.atland-voisin.com/index.php",
        documents: [
          { nom: "Convention de distribution 2024", date: "20/02/2024", type: "Convention" },
          { nom: "Avenant produits immobiliers", date: "10/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 18,
        nom: "EURYALE",
        logo: "/eura.svg",
        site: "https://www.euryale-am.fr/",
        documents: [
          { nom: "Convention de distribution 2024", date: "25/02/2024", type: "Convention" },
          { nom: "Avenant SCPI Santé", date: "15/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 19,
        nom: "ECOFIP",
        logo: "/Logo-ECOFIP-Orange.svg",
        site: "https://www.ecofip.com/",
        documents: [
          { nom: "Convention de distribution 2024", date: "28/02/2024", type: "Convention" },
          { nom: "Avenant Loi Girardin", date: "20/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 20,
        nom: "EPSENS",
        logo: "/logo_malakoff_humanis_epargne.png",
        site: "https://www.partenaires-epargnesalariale.com/accueil-groupes-reseaux-1-e/@fd/index.php?ctrl=logout&nu=1&su=&idu=",
        documents: [
          { nom: "Convention de distribution 2024", date: "05/03/2024", type: "Convention" },
          { nom: "Avenant épargne salariale", date: "25/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 21,
        nom: "NORMA CAPITAL",
        logo: "/normalcapital.png",
        site: "https://normacapital.mipise.fr/fr/users/sign_in",
        documents: [
          { nom: "Convention de distribution 2024", date: "10/03/2024", type: "Convention" },
          { nom: "Avenant produits financiers", date: "30/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 22,
        nom: "OPALE CAPITALE",
        logo: "/opale-blue-d-721jGM.png",
        site: "https://partner.opalecapital.com/login",
        documents: [
          { nom: "Convention de distribution 2024", date: "15/03/2024", type: "Convention" },
          { nom: "Avenant produits d'investissement", date: "05/05/2024", type: "Avenant" }
        ]
      },
      {
        id: 23,
        nom: "OPENSTONE",
        logo: "/open.jpg",
        site: "https://app.openstone.com/sign-up/partners",
        documents: [
          { nom: "Convention de distribution 2024", date: "20/03/2024", type: "Convention" },
          { nom: "Avenant produits financiers", date: "10/05/2024", type: "Avenant" }
        ]
      },
      {
        id: 24,
        nom: "VATEL CAPITAL",
        logo: "/logoeuq.png",
        site: "https://www.vatelcapital.com/espaceclients/",
        documents: [
          { nom: "Convention de distribution 2024", date: "25/03/2024", type: "Convention" },
          { nom: "Avenant produits financiers", date: "15/05/2024", type: "Avenant" }
        ]
      },
      {
        id: 25,
        nom: "WENIMMO",
        logo: "/logo.632b013d489863f49f857abc40020291.svg",
        site: "https://app.wenimmo.com/login",
        documents: [
          { nom: "Convention de distribution 2024", date: "30/03/2024", type: "Convention" },
          { nom: "Avenant produits immobiliers", date: "20/05/2024", type: "Avenant" }
        ]
      }
    ]
  };

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
              {partenaires.coa.map((partenaire) => (
                <div key={partenaire.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {partenaire.logo.startsWith('/') ? (
                      <img 
                        src={partenaire.logo} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                      />
                    ) : (
                    <div className="text-6xl">{partenaire.logo}</div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                      {partenaire.documents.slice(0, 2).map((doc, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
              {partenaires.cif.map((partenaire) => (
                <div key={partenaire.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {partenaire.logo.startsWith('/') ? (
                      <img 
                        src={partenaire.logo} 
                        alt={`Logo ${partenaire.nom}`}
                        className="h-20 w-auto object-contain max-w-full"
                        style={{ maxHeight: '80px' }}
                      />
                    ) : (
                    <div className="text-6xl">{partenaire.logo}</div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                      {partenaire.documents.slice(0, 2).map((doc, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
          {getFilteredPartenaires().map((partenaire) => (
            <div key={partenaire.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{partenaire.nom}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {partenaire.documents.map((doc, index) => (
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
function ReglementairePage() {
  const [expandedFolders, setExpandedFolders] = useState<{[key: string]: boolean}>({});
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedFormationType, setSelectedFormationType] = useState('validantes'); // 'validantes' ou 'obligatoires'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'CIF', 'IAS', 'IOB', 'IMMOBILIER'

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Données des formations par année et catégorie
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
    const formations = formationsData[selectedYear as keyof typeof formationsData]?.validantes || [];
    if (selectedCategory === 'all') {
      return formations;
    }
    return formations.filter(formation => formation.categories.includes(selectedCategory));
  };

  // Calculer le total d'heures par catégorie pour l'année sélectionnée
  const getTotalHoursByCategory = (category: string) => {
    const formations = formationsData[selectedYear as keyof typeof formationsData]?.validantes || [];
    return formations
      .filter(formation => formation.categories.includes(category))
      .reduce((total, formation) => total + formation.heures, 0);
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
                {getFilteredFormations().length > 0 ? (
                  getFilteredFormations().map((formation) => (
                    <tr key={formation.id}>
                      <td className="border border-gray-300 px-4 py-2">{formation.date}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          formation.statut === 'Validée' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formation.statut}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{formation.heures}h</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {formation.categories.map((category) => (
                            <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {category}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formation.delivreePar}</td>
                      <td className="border border-gray-300 px-4 py-2">{formation.nomDocument}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-gray-500" colSpan={7}>
                      Aucune formation enregistrée pour {selectedCategory === 'all' ? 'cette année' : selectedCategory} en {selectedYear}
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
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
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">SIMULATEURS</h1>
        <p className="text-gray-600 text-lg">
          Outils de simulation pour vos calculs fiscaux et financiers
        </p>
      </div>

      {/* Section Impôt sur le revenu */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Impôt sur le revenu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Direction Générale des Finances Publiques */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES</h3>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulation IR
            </button>
          </div>

          {/* abeille ASSURANCES */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🐝</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">abeille ASSURANCES</h3>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulation IR
            </button>
          </div>

          {/* SwissLife */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">SwissLife</h3>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulateur IR
            </button>
          </div>
        </div>
      </div>

      {/* Section Fortune Immobilière */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Fortune Immobilière</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GNCA */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">GNCA</h3>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulation IFI
            </button>
          </div>
        </div>
      </div>

      {/* Section Succession */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Succession</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* abeille ASSURANCES */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🐝</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">abeille ASSURANCES</h3>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Diagnostic succession
            </button>
          </div>

          {/* CARDIF GROUPE BNP PARIBAS */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">CARDIF GROUPE BNP PARIBAS</h3>
            <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Diagnostic succession
            </button>
          </div>

          {/* SwissLife */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">SwissLife</h3>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Diagnostic succession
            </button>
          </div>
        </div>
      </div>

      {/* Section Placement */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Placement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GNCA */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">GNCA</h3>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulateur Placement
            </button>
          </div>

          {/* GNCA */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">GNCA</h3>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulateur Épargne
            </button>
          </div>

          {/* SwissLife */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-2">SwissLife</h3>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Simulateur Retraite
            </button>
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

  // Grouper par mois
  const bordereauxByMonth = userBordereaux.reduce((acc, bordereau) => {
    if (!acc[bordereau.month]) {
      acc[bordereau.month] = [];
    }
    acc[bordereau.month].push(bordereau);
    return acc;
  }, {} as Record<string, BordereauFile[]>);

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
                          Uploadé le: {file.uploadDate} par {file.uploadedBy}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('🖱️ Bouton télécharger cliqué pour:', file.fileName);
                            alert(`Tentative de téléchargement de: ${file.fileName}`);
                            handleDownload(file.fileName);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          Télécharger
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium">
                          📁
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
              {userBordereaux.length}
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