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
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-5">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
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

interface ExtranetLoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export default function ExtranetLoginPage({ onLogin }: ExtranetLoginPageProps) {
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
      localStorage.setItem('token', response.token);
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
      
      const user: User = {
        id: response.user.id.toString(),
        name: `${response.user.prenom} ${response.user.nom}`,
        email: response.user.email,
        role: response.user.role === 'admin' ? 'admin' : 'user',
        nom: response.user.nom,
        prenom: response.user.prenom,
        must_change_password: response.user.must_change_password || false
      };
      
      setIsLoading(false);
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
      title: 'Réinitialisation du mot de passe',
      message: `Demander une réinitialisation de mot de passe pour ${email} ?\n\nUne notification sera envoyée à l'administrateur.\nVous recevrez un email avec votre nouveau mot de passe une fois la demande traitée.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          const response = await fetch(buildAPIURL('/password-reset/request'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const data = await response.json();
          if (response.ok) {
            showAlert('success', 'Demande envoyée', data.message + '\n\nVous recevrez un email avec votre nouveau mot de passe une fois que l\'administrateur aura traité votre demande.');
          } else {
            showAlert('error', 'Erreur', data.error || 'Erreur lors de la demande de réinitialisation');
          }
        } catch (error) {
          console.error('Error:', error);
          showAlert('error', 'Erreur de connexion', 'Impossible de contacter le serveur. Veuillez réessayer plus tard.');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
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
                onClick={handleForgotPassword}
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
