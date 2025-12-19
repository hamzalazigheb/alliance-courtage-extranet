import React, { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (!element) {
      // Element not found, skip to next
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    const position = step.position || 'bottom';
    const padding = 12;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    // Spotlight style
    setSpotlightStyle({
      position: 'fixed',
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
      zIndex: 9998,
      pointerEvents: 'none',
      transition: 'all 0.3s ease-in-out',
    });

    // Tooltip position
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setTooltipStyle({
      position: 'fixed',
      top,
      left,
      width: tooltipWidth,
      zIndex: 9999,
      transition: 'all 0.3s ease-in-out',
    });

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentStep, steps]);

  useEffect(() => {
    if (isOpen) {
      positionTooltip();
      window.addEventListener('resize', positionTooltip);
      window.addEventListener('scroll', positionTooltip);
      return () => {
        window.removeEventListener('resize', positionTooltip);
        window.removeEventListener('scroll', positionTooltip);
      };
    }
  }, [isOpen, positionTooltip]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9997]" onClick={handleSkip} />

      {/* Spotlight */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">{step?.title}</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step?.content}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Passer le tour
            </button>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Précédent
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
              >
                {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Tour steps configuration
export const manageTourSteps: TourStep[] = [
  {
    target: 'logo',
    title: '🏠 Bienvenue sur Alliance Courtage',
    content: 'Cliquez sur le logo pour retourner à l\'accueil à tout moment.',
    position: 'bottom',
  },
  {
    target: 'search',
    title: '🔍 Recherche Globale',
    content: 'Recherchez rapidement des utilisateurs, documents ou bordereaux. Utilisez Ctrl+K pour un accès rapide.',
    position: 'bottom',
  },
  {
    target: 'dark-mode',
    title: '🌙 Mode Sombre',
    content: 'Basculez entre le thème clair et sombre selon vos préférences.',
    position: 'bottom',
  },
  {
    target: 'nav-dashboard',
    title: '📊 Tableau de Bord',
    content: 'Vue d\'ensemble de votre activité : statistiques, graphiques et alertes importantes.',
    position: 'bottom',
  },
  {
    target: 'nav-utilisateurs',
    title: '👥 Gestion des Utilisateurs',
    content: 'Créez, modifiez et gérez les comptes utilisateurs. Définissez les dates de validité et exportez en CSV.',
    position: 'bottom',
  },
  {
    target: 'nav-documents',
    title: '📁 Documents Financiers',
    content: 'Gérez les bordereaux et documents comptables. Import en masse avec sélection d\'année.',
    position: 'bottom',
  },
  {
    target: 'nav-reservations',
    title: '📦 Réservations Produits',
    content: 'Suivez les réservations de produits effectuées par les utilisateurs.',
    position: 'bottom',
  },
  {
    target: 'nav-simulateurs',
    title: '📈 Statistiques Simulateurs',
    content: 'Analysez les données du simulateur et les tendances d\'utilisation.',
    position: 'bottom',
  },
  {
    target: 'nav-cms',
    title: '✏️ Gestion de Contenu',
    content: 'Modifiez les événements, formations et actualités affichés sur la plateforme.',
    position: 'bottom',
  },
  {
    target: 'stats-cards',
    title: '📊 Statistiques Clés',
    content: 'Visualisez en un coup d\'œil : utilisateurs actifs, documents, bordereaux et tendances.',
    position: 'bottom',
  },
  {
    target: 'charts',
    title: '📈 Graphiques d\'Activité',
    content: 'Suivez l\'évolution mensuelle de votre activité avec des graphiques interactifs.',
    position: 'top',
  },
  {
    target: 'activity-feed',
    title: '🕐 Activité Récente',
    content: 'Consultez les dernières actions effectuées sur la plateforme.',
    position: 'top',
  },
  {
    target: 'quick-actions',
    title: '⚡ Actions Rapides',
    content: 'Accédez rapidement aux fonctions les plus utilisées.',
    position: 'top',
  },
];

export default GuidedTour;
