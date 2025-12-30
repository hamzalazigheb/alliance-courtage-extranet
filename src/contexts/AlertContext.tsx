import React, { createContext, useContext, useState, useCallback } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
}

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

// Alert Modal Component
const AlertModal: React.FC<{
  show: boolean;
  type: AlertType;
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

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<(AlertConfig & { show: boolean }) | null>(null);

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlertConfig({ show: true, type, title, message });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showAlert('success', 'Succès', message);
  }, [showAlert]);

  const showError = useCallback((message: string) => {
    showAlert('error', 'Erreur', message);
  }, [showAlert]);

  const showWarning = useCallback((message: string) => {
    showAlert('warning', 'Attention', message);
  }, [showAlert]);

  const showInfo = useCallback((message: string) => {
    showAlert('info', 'Information', message);
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {alertConfig && (
        <AlertModal
          show={alertConfig.show}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};




