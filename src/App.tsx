import React, { useState } from "react";

// Login Page Component
function LoginPage({ onLogin }: { onLogin: () => void }) {
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
        onLogin();
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
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-1">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded transform rotate-12"></div>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded transform -rotate-6"></div>
              <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-500 rounded transform rotate-6"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">ALLIANCE COURTAGE</h1>
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
            <h3 className="text-sm font-medium text-blue-800 mb-2">Mode Démo</h3>
            <p className="text-xs text-blue-600">
              Entrez n'importe quel email et mot de passe pour vous connecter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("accueil");

  const renderPage = () => {
    switch (currentPage) {
      case "accueil":
        return <HomePage />;
      case "gamme-produits":
        return <GammeProduitsPage />;
      case "partenaires":
        return <PartenairesPage />;
      case "rencontres":
        return <RencontresPage />;
      case "reglementaire":
        return <ReglementairePage />;
      case "produits-structures":
        return <ProduitsStructuresPage />;
      case "simulateurs":
        return <SimulateursPage />;
      case "comptabilite":
        return <ComptabilitePage />;
      default:
        return <HomePage />;
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher la page de login
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo et Branding */}
            <div className="flex items-center space-x-4">
              {/* Logo simple */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              
              {/* Texte de marque */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ALLIANCE COURTAGE</h1>
                <p className="text-sm text-gray-600">Courtier en Assurances & Conseil Financier</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">VALOSA</div>
                <div className="text-xs text-gray-500">Utilisateur</div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">V</span>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Déconnexion
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
                  onClick={() => setCurrentPage("accueil")}
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
                  onClick={() => setCurrentPage("gamme-produits")}
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
                    setCurrentPage("partenaires");
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
                <a href="#" className="flex items-center space-x-4 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-200">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-md"></div>
                  <span>Gamme Financière</span>
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage("produits-structures")}
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
                  onClick={() => setCurrentPage("simulateurs")}
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
                  onClick={() => setCurrentPage("rencontres")}
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
                  onClick={() => setCurrentPage("comptabilite")}
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
              <li>
                <button 
                  onClick={() => setCurrentPage("reglementaire")}
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenue chez Alliance Courtage</h1>
        <p className="text-gray-600 text-lg">
          Votre courtier en assurances et conseiller financier de confiance
        </p>
      </div>

      {/* News Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white">Actualités</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* News Item 1 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Nouvelle réglementation assurance-vie</h3>
              <p className="text-gray-600 text-sm mb-2">
                Découvrez les dernières modifications de la réglementation sur l'assurance-vie et leurs impacts sur vos contrats.
              </p>
              <span className="text-xs text-gray-500">15/01/2025</span>
            </div>
          </div>

          {/* News Item 2 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Évolution des taux d'intérêt</h3>
              <p className="text-gray-600 text-sm mb-2">
                Analyse des tendances actuelles des taux d'intérêt et conseils pour optimiser vos placements.
              </p>
              <span className="text-xs text-gray-500">12/01/2025</span>
            </div>
          </div>

          {/* News Item 3 */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-pink-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Nouveaux produits de prévoyance</h3>
              <p className="text-gray-600 text-sm mb-2">
                Présentation de nos nouveaux contrats de prévoyance adaptés aux besoins des entreprises.
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
            <li>• Assurance-vie et épargne</li>
            <li>• Retraite et prévoyance</li>
            <li>• Santé et protection</li>
            <li>• Assurance entreprise</li>
          </ul>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact</h3>
          <div className="space-y-2 text-gray-600">
            <p>📞 +33 1 23 45 67 89</p>
            <p>✉️ contact@alliance.com</p>
            <p>📍 Paris, France</p>
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
    { id: "sante", name: "Santé", icon: "🏥" }
  ];

  const getProducts = () => {
    const products = {
      particulier: {
        epargne: ["Assurance-vie", "PEA", "Livret A", "Compte épargne"],
        retraite: ["PER", "Madelin", "Retraite individuelle"],
        prevoyance: ["Invalidité", "Décès", "Perte d'autonomie"],
        sante: ["Mutuelle santé", "Hospitalisation", "Dentaire", "Optique"]
      },
      professionnel: {
        epargne: ["Épargne professionnelle", "PEE", "PERCO"],
        retraite: ["Retraite professionnelle", "PER professionnel"],
        prevoyance: ["Prévoyance professionnelle", "Protection sociale"],
        sante: ["Mutuelle professionnelle", "Santé au travail"]
      },
      entreprise: {
        epargne: ["Épargne salariale", "Intéressement", "Participation"],
        retraite: ["Retraite collective", "PER entreprise"],
        prevoyance: ["Prévoyance collective", "Protection sociale"],
        sante: ["Mutuelle d'entreprise", "Santé collective"]
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        id: 1,
        nom: "AXA France",
        logo: "🟦",
        site: "https://www.axa.fr",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "15/01/2024", type: "Protocole" },
          { nom: "Avenant n°1 - Tarifs 2024", date: "20/03/2024", type: "Avenant" },
          { nom: "Convention commerciale", date: "10/06/2023", type: "Convention" }
        ]
      },
      {
        id: 2,
        nom: "Allianz France",
        logo: "🔵",
        site: "https://www.allianz.fr",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "22/01/2024", type: "Protocole" },
          { nom: "Avenant produits santé", date: "15/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 3,
        nom: "Generali France",
        logo: "🟢",
        site: "https://www.generali.fr",
        documents: [
          { nom: "Protocole de partenariat 2024", date: "08/02/2024", type: "Protocole" },
          { nom: "Convention vie", date: "12/05/2024", type: "Convention" }
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
      }
    ],
    cif: [
      {
        id: 5,
        nom: "BNP Paribas",
        logo: "🟫",
        site: "https://www.bnpparibas.fr",
        documents: [
          { nom: "Convention de distribution 2024", date: "05/02/2024", type: "Convention" },
          { nom: "Avenant produits structurés", date: "25/03/2024", type: "Avenant" }
        ]
      },
      {
        id: 6,
        nom: "Crédit Agricole",
        logo: "🟩",
        site: "https://www.credit-agricole.fr",
        documents: [
          { nom: "Convention de distribution 2024", date: "12/02/2024", type: "Convention" },
          { nom: "Avenant assurance-vie", date: "28/03/2024", type: "Avenant" }
        ]
      },
      {
        id: 7,
        nom: "Société Générale",
        logo: "🔴",
        site: "https://www.societegenerale.fr",
        documents: [
          { nom: "Convention de distribution 2024", date: "19/02/2024", type: "Convention" },
          { nom: "Avenant épargne", date: "02/04/2024", type: "Avenant" }
        ]
      },
      {
        id: 8,
        nom: "LCL",
        logo: "🟠",
        site: "https://www.lcl.fr",
        documents: [
          { nom: "Convention de distribution 2024", date: "26/02/2024", type: "Convention" },
          { nom: "Avenant retraite", date: "09/04/2024", type: "Avenant" }
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
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-6xl">{partenaire.logo}</div>
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
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-6xl">{partenaire.logo}</div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">RENCONTRES ALLIANCE COURTAGE</h1>
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
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Délivrée par</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nom document</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500" colSpan={6}>
                    Aucune formation enregistrée
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
      enveloppeRestante: "0€"
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
      enveloppeRestante: "520 880€"
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
      enveloppeRestante: "150 000€"
    },
    {
      id: 4,
      logo: "🟥",
      company: "Garance",
      title: "Stratégie Patrimoine S Taux Juin 2025",
      sousJacent: "S&P 500",
      coupon: "4% / an",
      commercialisation: "10/08/2024 au 30/09/2025",
      finCommercialisation: "dans 34 jours",
      montantEnveloppe: "4 000 000€",
      enveloppeRestante: "800 000€"
    },
    {
      id: 5,
      logo: "🟪",
      company: "SwissLife",
      title: "Stratégie Patrimoine S Dividende Juillet 2025",
      sousJacent: "DAX",
      coupon: "2.8% / an",
      commercialisation: "25/08/2024 au 05/10/2025",
      finCommercialisation: "dans 39 jours",
      montantEnveloppe: "3 500 000€",
      enveloppeRestante: "1 200 000€"
    },
    {
      id: 6,
      logo: "🟧",
      company: "CARDIF",
      title: "Stratégie Patrimoine S Taux Août 2025",
      sousJacent: "FTSE 100",
      coupon: "3.2% / an",
      commercialisation: "01/09/2024 au 10/10/2025",
      finCommercialisation: "dans 44 jours",
      montantEnveloppe: "2 800 000€",
      enveloppeRestante: "950 000€"
    },
    {
      id: 7,
      logo: "🟦",
      company: "abeille ASSURANCES",
      title: "Stratégie Patrimoine S Dividende Septembre 2025",
      sousJacent: "Nikkei 225",
      coupon: "2.7% / an",
      commercialisation: "05/09/2024 au 15/10/2025",
      finCommercialisation: "dans 49 jours",
      montantEnveloppe: "3 200 000€",
      enveloppeRestante: "1 500 000€"
    }
  ];

  // Données des produits en cours de vie
  const produitsEnCours = [
    {
      id: 8,
      logo: "🟦",
      company: "SwissLife",
      title: "Stratégie Patrimoine S Taux Mai 2025",
      sousJacent: "Euro Stoxx 50",
      cours: "43.40",
      performance: "-7.56%",
      prochaineConstatation: "28/05/2026",
      prochaineConstatationDans: "275 jours"
    },
    {
      id: 9,
      logo: "🟩",
      company: "abeille ASSURANCES",
      title: "Stratégie Patrimoine S Dividende Avril 2025",
      sousJacent: "CAC 40",
      cours: "38.75",
      performance: "2.34%",
      prochaineConstatation: "15/06/2026",
      prochaineConstatationDans: "293 jours"
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

      {/* Section EN COURS DE COMMERCIALISATION */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">EN COURS DE COMMERCIALISATION</h2>
            <div className="flex space-x-2">
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {produitsCommercialisation.map((produit) => (
              <div key={produit.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                {/* En-tête avec logo et titre */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{produit.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{produit.company}</h3>
                    <h4 className="text-sm font-medium text-gray-700 leading-tight">{produit.title}</h4>
                  </div>
                </div>
                
                {/* Détails du produit */}
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
                
                {/* Boutons d'action */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                    Détails
                  </button>
                  <button className="flex-1 bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section EN COURS DE VIE */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">EN COURS DE VIE</h2>
            <div className="flex space-x-2">
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {produitsEnCours.map((produit) => (
              <div key={produit.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                {/* En-tête avec logo et titre */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{produit.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{produit.company}</h3>
                    <h4 className="text-sm font-medium text-gray-700 leading-tight">{produit.title}</h4>
                  </div>
                </div>
                
                {/* Détails du produit */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sous jacent:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.sousJacent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cours au 14/08/2025:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.cours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Performance au 14/08/2025:</span>
                    <span className={`text-sm font-medium ${produit.performance.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                      {produit.performance}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prochaine constatation le:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.prochaineConstatation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prochaine constatation dans:</span>
                    <span className="text-sm font-medium text-gray-800">{produit.prochaineConstatationDans}</span>
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                    Détails
                  </button>
                  <button className="flex-1 bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
function ComptabilitePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2025");

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
          Bordereaux {selectedYear} - Gestion par Marie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearlyFolders[selectedYear].months.map((month, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{month.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  month.files > 0 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {month.files} fichier{month.files > 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                Dernière mise à jour: {month.lastUpdate}
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium">
                  Voir les fichiers
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium">
                  Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Résumé {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {yearlyFolders[selectedYear].months.reduce((sum, month) => sum + month.files, 0)}
            </div>
            <div className="text-sm text-gray-600">Total bordereaux</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {yearlyFolders[selectedYear].months.filter(month => month.files > 0).length}
            </div>
            <div className="text-sm text-gray-600">Mois traités</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {yearlyFolders[selectedYear].months.filter(month => month.files === 0).length}
            </div>
            <div className="text-sm text-gray-600">Mois en attente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 