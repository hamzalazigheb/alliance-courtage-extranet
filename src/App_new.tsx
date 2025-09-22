import React, { useState, useEffect } from "react";
import GammeFinancierePage from './GammeFinancierePage';
import ProduitsStructuresPage from './ProduitsStructuresPage';

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
          alert("Utilisateur non trouvÃ©");
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
                Mot de passe oubliÃ© ?
              </button>
            </div>
          </form>
        </div>

        {/* Demo Info */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">ðŸ” Comptes de dÃ©monstration</h3>
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
  // Ã‰tat de connexion avec persistance
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoginState = localStorage.getItem('isLoggedIn');
    return savedLoginState === 'true';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Get page from URL hash or default to accueil
    const hash = window.location.hash.slice(1); // Remove the # symbol
    const validPages = ['accueil', 'gamme-produits', 'partenaires', 'rencontres', 'reglementaire', 'produits-structures', 'simulateurs', 'comptabilite', 'gestion-utilisateurs'];
    return validPages.includes(hash) ? hash : 'accueil';
  });

  // Function to change page and update URL
  const changePage = (page: string) => {
    setCurrentPage(page);
    window.location.hash = page;
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
      const user = JSON.parse(savedUser);
      // Update cached user if it's VALOSA to use new name
      if (user.name === 'VALOSA') {
        user.name = 'JEAN MARTIN';
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      return user;
    }
    return null;
  });
  
  // DonnÃ©es utilisateurs (simulation)
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

  // DonnÃ©es bordereaux (simulation) - VIDÃ‰ES POUR LE TEST
  const [bordereaux, setBordereaux] = useState<BordereauFile[]>([]);

  // Fonction pour dÃ©tecter les initiales dans le nom du fichier
  const detectUserFromFileName = (fileName: string): User[] => {
    const fileNameUpper = fileName.toUpperCase();
    const detectedUsers: User[] = [];
    
    console.log('ðŸ” DÃ©tection pour fichier:', fileName);
    
    // Chercher les 2 premiÃ¨res lettres au DÃ‰BUT du nom du fichier
    for (const user of users.filter(u => u.role === 'user')) {
      const initials = user.name.substring(0, 2).toUpperCase();
      // DÃ©tecter si le fichier commence par les 2 lettres
      const isDetected = fileNameUpper.startsWith(initials);
      console.log(`  - ${user.name} (${initials}) au dÃ©but de "${fileNameUpper}" ?`, isDetected);
      if (isDetected) {
        detectedUsers.push(user);
      }
    }
    
    console.log('âœ… Utilisateurs dÃ©tectÃ©s:', detectedUsers.map(u => u.name));
    return detectedUsers;
  };

  // Fonction pour vider tous les bordereaux
  const clearAllBordereaux = () => {
    if (confirm('ÃŠtes-vous sÃ»r de vouloir effacer TOUS les bordereaux ?\n\nCette action est irrÃ©versible.')) {
      setBordereaux([]);
      alert('âœ… Tous les bordereaux ont Ã©tÃ© effacÃ©s !');
    }
  };

  // Fonction pour uploader des fichiers avec dÃ©tection automatique
  const handleFileUpload = (file: File) => {
    const currentDate = new Date();
    const uploadDate = currentDate.toISOString().split('T')[0];
    
    // Extraire le mois et l'annÃ©e du nom du fichier
    let month = 'Janvier'; // Par dÃ©faut
    let year = currentDate.getFullYear().toString(); // Par dÃ©faut annÃ©e actuelle
    
    // DÃ©tecter le mois dans le nom du fichier
    const fileNameUpper = file.name.toUpperCase();
    if (fileNameUpper.includes('JANVIER')) month = 'Janvier';
    else if (fileNameUpper.includes('FEVRIER')) month = 'FÃ©vrier';
    else if (fileNameUpper.includes('MARS')) month = 'Mars';
    else if (fileNameUpper.includes('AVRIL')) month = 'Avril';
    else if (fileNameUpper.includes('MAI')) month = 'Mai';
    else if (fileNameUpper.includes('JUIN')) month = 'Juin';
    else if (fileNameUpper.includes('JUILLET')) month = 'Juillet';
    else if (fileNameUpper.includes('AOUT')) month = 'AoÃ»t';
    else if (fileNameUpper.includes('SEPTEMBRE')) month = 'Septembre';
    else if (fileNameUpper.includes('OCTOBRE')) month = 'Octobre';
    else if (fileNameUpper.includes('NOVEMBRE')) month = 'Novembre';
    else if (fileNameUpper.includes('DECEMBRE')) month = 'DÃ©cembre';
    
    // DÃ©tecter l'annÃ©e dans le nom du fichier
    const yearMatch = file.name.match(/20\d{2}/);
    if (yearMatch) {
      year = yearMatch[0];
    }
    
    // DÃ©tecter les utilisateurs Ã  partir du nom du fichier
    const targetUsers = detectUserFromFileName(file.name);
    
    if (targetUsers.length === 0) {
      alert(`Aucun utilisateur dÃ©tectÃ© dans le nom du fichier "${file.name}".\n\nUtilisez les 2 premiÃ¨res lettres AU DÃ‰BUT du nom :\n- MA pour MARTIN\n- RA pour RICHARD\n- BE pour BERNARD\n- etc.\n\nExemple : MA_Rapport_Janvier_2025.pdf ou MA.pdf`);
      return;
    }
    
    // CrÃ©er un bordereau pour chaque utilisateur dÃ©tectÃ©
    const newBordereaux: BordereauFile[] = targetUsers.map(user => ({
      id: `${Date.now()}_${user.id}`,
      fileName: file.name,
      uploadDate: uploadDate,
      month: month,
      year: year,
      userId: user.id,
      uploadedBy: currentUser?.name || 'Admin'
    }));
    
    // Debug: VÃ©rifier l'assignation
    console.log('ðŸ“ Fichier uploadÃ©:', file.name);
    console.log('ðŸ“… Mois dÃ©tectÃ©:', month);
    console.log('ðŸ“… AnnÃ©e dÃ©tectÃ©e:', year);
    console.log('ðŸ‘¥ Utilisateurs assignÃ©s:', targetUsers.map(u => `${u.name} (${u.id})`));
    console.log('ðŸ“‹ Bordereaux crÃ©Ã©s:', newBordereaux.map(b => `${b.fileName} â†’ ${b.userId} (${b.month} ${b.year})`));
    
    setBordereaux(prev => {
      const newState = [...prev, ...newBordereaux];
      console.log('ðŸ“Š Ã‰tat des bordereaux aprÃ¨s upload:', newState);
      console.log('ðŸ“Š Nombre total de bordereaux:', newState.length);
      return newState;
    });
    
    // Message de confirmation avec les utilisateurs dÃ©tectÃ©s
    const userNames = targetUsers.map(u => u.name).join(', ');
    alert(`Fichier "${file.name}" uploadÃ© avec succÃ¨s pour :\n${userNames}\n\n(${targetUsers.length} utilisateur${targetUsers.length > 1 ? 's' : ''})`);
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

  // Si l'utilisateur n'est pas connectÃ©, afficher la page de login
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
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo et Branding */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <img 
                src="/alliance-courtage-logo.svg" 
                alt="Alliance Courtage Logo" 
                className="h-20 w-auto"
              />
              
              {/* Texte de marque */}
              <div>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
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
                  // Nettoyer localStorage lors de la dÃ©connexion
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                DÃ©connexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 bg-white/80 backdrop-blur-sm border-r border-gray-200 min-h-screen">
          <nav className="p-6">
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
                  <span className={currentPage === "gamme-financiere" ? "font-semibold" : ""}>Gamme FinanciÃ¨re</span>
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
                  <span className={currentPage === "produits-structures" ? "font-semibold" : ""}>Produits structurÃ©s</span>
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
                  <span className={currentPage === "comptabilite" ? "font-semibold" : ""}>ComptabilitÃ©</span>
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
                    <span className={currentPage === "gestion-utilisateurs" ? "font-semibold" : ""}>ðŸ‘¥ Gestion Utilisateurs</span>
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
                  <span className={currentPage === "reglementaire" ? "font-semibold" : ""}>RÃ¨glementaire</span>
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenue chez Alliance Courtage</h1>
      </div>

      {/* News Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white">ActualitÃ©s</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* News Item 1 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Nouvelle rÃ©glementation assurance-vie</h3>
              <p className="text-gray-600 text-sm mb-2">
                DÃ©couvrez les derniÃ¨res modifications de la rÃ©glementation sur l'assurance-vie et leurs impacts sur vos contrats.
              </p>
              <span className="text-xs text-gray-500">15/01/2025</span>
            </div>
          </div>

          {/* News Item 2 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Ã‰volution des taux d'intÃ©rÃªt</h3>
              <p className="text-gray-600 text-sm mb-2">
                Analyse des tendances actuelles des taux d'intÃ©rÃªt et conseils pour optimiser vos placements.
              </p>
              <span className="text-xs text-gray-500">12/01/2025</span>
            </div>
          </div>

          {/* News Item 3 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-pink-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Nouveaux produits de prÃ©voyance</h3>
              <p className="text-gray-600 text-sm mb-2">
                PrÃ©sentation de nos nouveaux contrats de prÃ©voyance adaptÃ©s aux besoins des entreprises.
              </p>
              <span className="text-xs text-gray-500">10/01/2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nos Services</h3>
          <ul className="space-y-2 text-gray-600">
            <li>â€¢ Epargne et retraite</li>
            <li>â€¢ PrÃ©voyance et santÃ©</li>
            <li>â€¢ Assurances collectives</li>
            <li>â€¢ Investissement financier (CIF)</li>
          </ul>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact</h3>
          <div className="space-y-2 text-gray-600">
            <p>ðŸ“ž 07.45.06.43.88</p>
            <p>âœ‰ï¸ contact@alliance-courtage.fr</p>
            <p>ðŸ“ Paris, France</p>
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
    { id: "particulier", name: "Particulier", icon: "ðŸ‘¤" },
    { id: "professionnel", name: "Professionnel", icon: "ðŸ’¼" },
    { id: "entreprise", name: "Entreprise", icon: "ðŸ¢" }
  ];

  const productTypes = [
    { id: "epargne", name: "Ã‰pargne", icon: "ðŸ’°" },
    { id: "retraite", name: "Retraite", icon: "ðŸ–ï¸" },
    { id: "prevoyance", name: "PrÃ©voyance", icon: "ðŸ›¡ï¸" },
    { id: "sante", name: "SantÃ©", icon: "ðŸ¥" },
    { id: "cif", name: "Conseil en investissement financier", icon: "ðŸ“ˆ" }
  ];

  const getProducts = () => {
    const products = {
      particulier: {
        epargne: ["Assurance vie", "Capitalisation", "PEA assurance"],
        retraite: ["PER"],
        prevoyance: ["Assurance dÃ©cÃ¨s / invaliditÃ© / incapacitÃ©", "Assurance emprunteur"],
        sante: ["Mutuelle santÃ©"],
        cif: ["Conseil en investissement", "Gestion de portefeuille", "Placements financiers", "StratÃ©gies d'investissement"]
      },
      professionnel: {
        epargne: ["Capitalisation", "PEE"],
        retraite: ["PER", "PERCO"],
        prevoyance: ["Assurance dÃ©cÃ¨s / invaliditÃ© / incapacitÃ©", "Assurance emprunteur"],
        sante: ["Mutuelle santÃ©"],
        cif: ["Conseil professionnel", "Investissements professionnels", "Gestion patrimoniale", "Placements spÃ©cialisÃ©s"]
      },
      entreprise: {
        epargne: ["Capitalisation", "PEE", "IntÃ©ressement", "Participation", "IFC"],
        retraite: ["PER Entreprise", "PERCO"],
        prevoyance: ["PrÃ©voyance collective"],
        sante: ["Mutuelle santÃ© collective"],
        cif: ["Conseil d'entreprise", "Investissements corporatifs", "Gestion financiÃ¨re", "StratÃ©gies d'investissement"]
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
          DÃ©couvrez nos solutions adaptÃ©es Ã  chaque type de client et de produit
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
                Solution adaptÃ©e aux besoins spÃ©cifiques
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

  // DonnÃ©es des partenaires
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
        logo: "ðŸŸ¡",
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
        logo: "/logo-mm.png",
        site: "https://sso.connective-software.fr/error/direct-access",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "10/02/2024", type: "Protocole" },
          { nom: "Convention MMA", date: "30/06/2024", type: "Convention" }
        ]
      },
      {
        id: 11,
        nom: "SELENCIA",
        logo: "/selenciq.svg",
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
          { nom: "Avenant SCPI SantÃ©", date: "15/04/2024", type: "Avenant" }
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
          { nom: "Avenant Ã©pargne salariale", date: "25/04/2024", type: "Avenant" }
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
          DÃ©couvrez nos partenaires de confiance en assurance et finance
        </p>
      </div>

      {/* Filtres par catÃ©gorie */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrer par catÃ©gorie</h2>
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
                      ðŸŒ Visiter le site
                    </a>
                    
                    {/* Documents contractuels */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents rÃ©cents</h4>
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
                      ðŸŒ Visiter le site
                    </a>
                    
                    {/* Documents contractuels */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents rÃ©cents</h4>
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
                      ðŸ“„ Voir le document
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
          Espace dÃ©diÃ© aux rencontres et Ã©changes de la communautÃ© Alliance Courtage
        </p>
      </div>

      {/* Section Rencontres Actuelles */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">ðŸ“…</span>
          Prochaines Rencontres
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rencontre 1 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-indigo-800">AssemblÃ©e GÃ©nÃ©rale 2025</h3>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">15 Mars 2025</span>
            </div>
            <p className="text-gray-700 mb-4">
              AssemblÃ©e gÃ©nÃ©rale annuelle d'Alliance Courtage avec prÃ©sentation des rÃ©sultats et perspectives 2025.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>ðŸ“ Paris, France</span>
              <span>â° 14h00 - 18h00</span>
            </div>
            <button className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors">
              S'inscrire
            </button>
          </div>

          {/* Rencontre 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-800">Formation RÃ©glementation</h3>
              <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">22 Avril 2025</span>
            </div>
            <p className="text-gray-700 mb-4">
              Formation sur les nouvelles rÃ©glementations en assurance et finance pour les membres Alliance Courtage.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>ðŸ“ Lyon, France</span>
              <span>â° 9h00 - 17h00</span>
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
          <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">ðŸ“š</span>
          Historique des Rencontres
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Rencontre RÃ©gionale Sud</h3>
              <p className="text-sm text-gray-600">Marseille, 15 DÃ©cembre 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ðŸ“„ Voir le compte-rendu
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Formation Produits StructurÃ©s</h3>
              <p className="text-sm text-gray-600">Paris, 8 Novembre 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ðŸ“„ Voir le compte-rendu
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">AssemblÃ©e GÃ©nÃ©rale 2024</h3>
              <p className="text-sm text-gray-600">Paris, 20 Mars 2024</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ðŸ“„ Voir le compte-rendu
            </button>
          </div>
        </div>
      </div>

      {/* Section Echanges - CachÃ©e pour l'instant */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 opacity-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">ðŸ’¬</span>
          Espace Echanges
          <span className="ml-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            BientÃ´t disponible
          </span>
        </h2>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">ðŸš§</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Espace en construction</h3>
          <p className="text-gray-500">
            L'espace d'Ã©changes sera bientÃ´t disponible pour permettre aux membres GNCA 
            de partager leurs expÃ©riences et de collaborer.
          </p>
        </div>
      </div>


    </div>
  );
}

// RÃ¨glementaire Page Component
function ReglementairePage() {
  const [expandedFolders, setExpandedFolders] = useState<{[key: string]: boolean}>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Structure des 10 dossiers avec documents
  const folders = [
    {
      id: "clients",
      title: "0. CLIENTS",
      documents: [
        { name: "Procedure_kit_reglementaire_clients_assurance", date: "15/01/2024", type: "ProcÃ©dure" },
        { name: "Parcours client - Assurance vie", date: "12/01/2024", type: "Guide" },
        { name: "Parcours client - Assurance non-vie", date: "10/01/2024", type: "Guide" },
        { name: "Questionnaire client type", date: "08/01/2024", type: "ModÃ¨le" }
      ]
    },
    {
      id: "conflits-interet",
      title: "1. CONFLITS D'INTÃ‰RÃŠT",
      documents: [
        { name: "ProcÃ©dure de prÃ©vention et gestion des Conflits d'intÃ©rÃªts", date: "10/07/2020", type: "ProcÃ©dure" },
        { name: "DÃ©claration de conflit d'intÃ©rÃªt", date: "05/01/2024", type: "ModÃ¨le" },
        { name: "Registre des conflits d'intÃ©rÃªt", date: "03/01/2024", type: "ModÃ¨le" }
      ]
    },
    {
      id: "controle-fraude",
      title: "2. CONTRÃ”LE ET LUTTE CONTRE LA FRAUDE",
      documents: [
        { name: "ProcÃ©dure de dÃ©tection de fraude", date: "20/01/2024", type: "ProcÃ©dure" },
        { name: "Signalement suspicion de fraude", date: "18/01/2024", type: "ModÃ¨le" },
        { name: "Checklist vigilance anti-fraude", date: "15/01/2024", type: "Checklist" }
      ]
    },
    {
      id: "distribution",
      title: "3. DISTRIBUTION",
      documents: [
        { name: "ProcÃ©dure de distribution des produits", date: "22/01/2024", type: "ProcÃ©dure" },
        { name: "Convention de distribution type", date: "20/01/2024", type: "ModÃ¨le" },
        { name: "Guide des bonnes pratiques distribution", date: "18/01/2024", type: "Guide" }
      ]
    },
    {
      id: "gouvernance",
      title: "4. GOUVERNANCE",
      documents: [
        { name: "Organigramme de gouvernance", date: "25/01/2024", type: "Organigramme" },
        { name: "ProcÃ©dure de prise de dÃ©cision", date: "23/01/2024", type: "ProcÃ©dure" },
        { name: "RÃ¨glement intÃ©rieur", date: "21/01/2024", type: "RÃ¨glement" }
      ]
    },
    {
      id: "lcb-ft",
      title: "5. LCB-FT",
      documents: [
        { name: "ProcÃ©dure - LAB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "ProcÃ©dure" },
        { name: "Questionnaire Risques LCB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "Questionnaire" },
        { name: "Note Veille Courtiers - Application du gel des avoirs", date: "10/07/2020", type: "Note" }
      ]
    },
    {
      id: "pca",
      title: "6. PCA",
      documents: [
        { name: "Plan de ContinuitÃ© d'ActivitÃ©", date: "28/01/2024", type: "Plan" },
        { name: "ProcÃ©dure de crise", date: "26/01/2024", type: "ProcÃ©dure" },
        { name: "Test PCA annuel", date: "24/01/2024", type: "ModÃ¨le" }
      ]
    },
    {
      id: "presentation-cabinet",
      title: "7. PRÃ‰SENTATION DU CABINET",
      documents: [
        { name: "Note mentions lÃ©gales obligatoires IAS (08 11 2019)", date: "10/07/2020", type: "Note" },
        { name: "PrÃ©sentation cabinet type", date: "30/01/2024", type: "PrÃ©sentation" },
        { name: "Brochure commerciale", date: "28/01/2024", type: "Brochure" }
      ]
    },
    {
      id: "rgpd",
      title: "8. RGPD",
      documents: [
        { name: "ProcÃ©dure RGPD cabinet", date: "02/02/2024", type: "ProcÃ©dure" },
        { name: "Registre des traitements", date: "31/01/2024", type: "ModÃ¨le" },
        { name: "Formulaire consentement client", date: "29/01/2024", type: "ModÃ¨le" }
      ]
    },
    {
      id: "traitement-reclamations",
      title: "9. TRAITEMENT DES RÃ‰CLAMATIONS",
      documents: [
        { name: "ProcÃ©dure de traitement des rÃ©clamations", date: "05/02/2024", type: "ProcÃ©dure" },
        { name: "Registre des rÃ©clamations", date: "03/02/2024", type: "ModÃ¨le" },
        { name: "ModÃ¨le de rÃ©ponse rÃ©clamation", date: "01/02/2024", type: "ModÃ¨le" }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">BibliothÃ¨que RÃ¨glementaire</h1>
        <p className="text-gray-600 text-lg">
          Documents types en version Word pour la mise en conformitÃ© de votre cabinet
        </p>
      </div>

      {/* Section Formations Obligatoires */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <h2 className="text-2xl font-bold text-white">MES FORMATIONS OBLIGATOIRES</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">IAS</div>
                  <div className="text-sm opacity-90">0h</div>
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">CIF</div>
              <div className="text-sm opacity-90">0h</div>
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">IOB</div>
              <div className="text-sm opacity-90">0h</div>
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">IMMOBILIER</div>
              <div className="text-sm opacity-90">0h</div>
            </button>
          </div>
        </div>
      </div>

      {/* Section Formations Validantes */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <h2 className="text-2xl font-bold text-white">MES FORMATIONS VALIDANTES 2025</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Statut</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nb d'heures</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">DÃ©livrÃ©e par</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nom document</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500" colSpan={6}>
                    Aucune formation enregistrÃ©e
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Ajouter une formation
            </button>
            <span className="text-gray-600 font-medium">TELECHARGEMENTS</span>
          </div>
        </div>
      </div>

      {/* Section BibliothÃ¨que ConformitÃ© */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <h2 className="text-2xl font-bold text-white">BIBLIOTHEQUE CONFORMITE</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {folders.map((folder) => (
              <div key={folder.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tÃªte du dossier */}
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
                            ðŸ“„
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

