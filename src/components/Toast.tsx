import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Icons
const SuccessIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Toast Item Component
const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
      icon: 'text-white',
      border: 'border-emerald-500'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-600 to-red-700',
      icon: 'text-white',
      border: 'border-red-500'
    },
    warning: {
      bg: 'bg-gradient-to-r from-slate-600 to-slate-700',
      icon: 'text-white',
      border: 'border-slate-500'
    },
    info: {
      bg: 'bg-gradient-to-r from-indigo-600 to-indigo-700',
      icon: 'text-white',
      border: 'border-indigo-500'
    }
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        rounded-xl shadow-2xl border-l-4 overflow-hidden
        min-w-[320px] max-w-md
      `}
    >
      <div className="p-4 flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.icon}`}>
          {toast.type === 'success' && <SuccessIcon />}
          {toast.type === 'error' && <ErrorIcon />}
          {toast.type === 'warning' && <WarningIcon />}
          {toast.type === 'info' && <InfoIcon />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {toast.title}
          </p>
          <p className="mt-1 text-sm text-white/90 whitespace-pre-line">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/20">
        <div
          className="h-full bg-white/50 transition-all ease-linear"
          style={{
            animation: `shrink ${toast.duration || 5000}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message: string) => {
    showToast('error', title, message, 7000);
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast('warning', title, message, 6000);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast('info', title, message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContainer');
  }
  return context;
};

// Global toast instance for use outside React components
let globalShowToast: ToastContextType['showToast'] | null = null;

export const setGlobalToast = (showToast: ToastContextType['showToast']) => {
  globalShowToast = showToast;
};

export const toast = {
  success: (title: string, message: string) => globalShowToast?.('success', title, message),
  error: (title: string, message: string) => globalShowToast?.('error', title, message, 7000),
  warning: (title: string, message: string) => globalShowToast?.('warning', title, message, 6000),
  info: (title: string, message: string) => globalShowToast?.('info', title, message),
};

export default ToastContainer;

