import React, { useState } from "react";
import { authAPI, buildAPIURL } from '../api';

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

interface ExtranetLoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export default function ExtranetLoginPage({ onLogin, users }: ExtranetLoginPageProps) {
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

