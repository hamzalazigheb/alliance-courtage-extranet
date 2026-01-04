import React, { useState } from "react";
import { authAPI, buildAPIURL } from '../api';

// Premium Alert Modal Component
const AlertModal: React.FC<{
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}> = ({ show, type, title, message, onClose }) => {
  if (!show) return null;

  const styles = {
    success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', buttonBg: 'bg-emerald-600 hover:bg-emerald-700' },
    error: { iconBg: 'bg-red-50', iconColor: 'text-red-600', buttonBg: 'bg-red-600 hover:bg-red-700' },
    warning: { iconBg: 'bg-slate-100', iconColor: 'text-slate-700', buttonBg: 'bg-slate-700 hover:bg-slate-800' },
    info: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', buttonBg: 'bg-indigo-600 hover:bg-indigo-700' }
  };

  const style = styles[type];

  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto w-20 h-20 ${style.iconBg} rounded-full flex items-center justify-center mb-5`}>
            <svg className={`w-12 h-12 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icons[type]}
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white ${style.buttonBg} transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirm Modal Component
const ConfirmModal: React.FC<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Alert state
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });

  // Confirm state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertModal({ show: true, type, title, message });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response: LoginResponse = await authAPI.login(email, password);
      
      // Vérifier que l'utilisateur est admin avant de permettre l'accès à /manage
      if (response.user.role !== 'admin') {
        setIsLoading(false);
        showAlert('error', 'Accès refusé', 'Seuls les administrateurs peuvent accéder à cette page.');
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
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion";
      
      if (errorMessage.includes('inactif') || errorMessage.includes('inactive') || error?.code === 'ACCOUNT_INACTIVE') {
        showAlert('warning', 'Compte désactivé', 'Votre compte est actuellement inactif.\n\nVeuillez contacter l\'administration pour réactiver votre accès.');
      } else {
        showAlert('error', 'Erreur de connexion', errorMessage);
      }
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      showAlert('warning', 'Email requis', 'Veuillez d\'abord entrer votre email dans le champ ci-dessus.');
      return;
    }
    
    setConfirmModal({
      show: true,
      title: 'Réinitialisation mot de passe',
      message: `Réinitialiser le mot de passe administrateur pour ${email} ?\n\nVous recevrez un email avec le nouveau mot de passe.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          const adminResponse = await fetch(buildAPIURL('/admin-password-reset/request'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const adminData = await adminResponse.json();
          
          if (adminResponse.ok) {
            showAlert('success', 'Email envoyé', adminData.message + '\n\nVérifiez votre boîte de réception (et les spams).\n\nImportant : Changez votre mot de passe après la première connexion !');
          } else {
            showAlert('error', 'Erreur', adminData.error || 'Erreur lors de la réinitialisation');
          }
        } catch (error) {
          console.error('Error:', error);
          showAlert('error', 'Erreur de connexion', 'Impossible de contacter le serveur. Veuillez réessayer plus tard.');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
      {/* Alert Modal */}
      <AlertModal
        show={alertModal.show}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
      />

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
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
                onClick={handleForgotPassword}
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
