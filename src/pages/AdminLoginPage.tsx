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

interface AdminLoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export default function AdminLoginPage({ onLogin, users }: AdminLoginPageProps) {
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

