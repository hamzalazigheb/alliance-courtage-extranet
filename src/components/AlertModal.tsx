import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Types
type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

// Icons
const SuccessIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Alert Modal Component
const AlertModalContent: React.FC<{
  config: AlertConfig | null;
  onClose: () => void;
}> = ({ config, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (config) {
      setIsVisible(true);
    }
  }, [config]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      config?.onConfirm?.();
      onClose();
    }, 200);
  };

  if (!config) return null;

  const styles = {
    success: {
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      ring: 'focus:ring-emerald-500'
    },
    error: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      ring: 'focus:ring-red-500'
    },
    warning: {
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      buttonBg: 'bg-slate-700 hover:bg-slate-800',
      ring: 'focus:ring-slate-500'
    },
    info: {
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      ring: 'focus:ring-indigo-500'
    }
  };

  const style = styles[config.type];

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        transition-all duration-200
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl max-w-md w-full
          transform transition-all duration-200
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`mx-auto w-20 h-20 ${style.iconBg} rounded-full flex items-center justify-center mb-5`}>
            <div className={style.iconColor}>
              {config.type === 'success' && <SuccessIcon />}
              {config.type === 'error' && <ErrorIcon />}
              {config.type === 'warning' && <WarningIcon />}
              {config.type === 'info' && <InfoIcon />}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {config.title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6">
            {config.message}
          </p>

          {/* Button */}
          <button
            onClick={handleClose}
            className={`
              w-full py-3 px-6 rounded-xl font-semibold text-white
              ${style.buttonBg}
              transform transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 ${style.ring} focus:ring-offset-2
            `}
          >
            {config.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Alert Provider
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showAlert({ type: 'success', title, message });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string) => {
    showAlert({ type: 'error', title, message });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string) => {
    showAlert({ type: 'warning', title, message });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string) => {
    showAlert({ type: 'info', title, message });
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <AlertModalContent config={alertConfig} onClose={closeAlert} />
    </AlertContext.Provider>
  );
};

// Hook to use alert
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Global alert instance
let globalShowAlert: AlertContextType['showAlert'] | null = null;

export const setGlobalAlert = (showAlert: AlertContextType['showAlert']) => {
  globalShowAlert = showAlert;
};

export const alert = {
  success: (title: string, message: string) => globalShowAlert?.({ type: 'success', title, message }),
  error: (title: string, message: string) => globalShowAlert?.({ type: 'error', title, message }),
  warning: (title: string, message: string) => globalShowAlert?.({ type: 'warning', title, message }),
  info: (title: string, message: string) => globalShowAlert?.({ type: 'info', title, message }),
  show: (config: AlertConfig) => globalShowAlert?.(config),
};

export default AlertProvider;

