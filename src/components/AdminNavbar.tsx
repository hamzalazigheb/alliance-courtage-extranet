import React, { useState, useEffect, useCallback, useMemo } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
  notification?: boolean;
}

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole?: string;
  items: NavItem[];
  className?: string;
}

/**
 * Professional Admin Navigation Bar Component
 * Features:
 * - Modern fintech/enterprise design
 * - Fully responsive (desktop, tablet, mobile)
 * - Role-based visibility
 * - Smooth animations and transitions
 * - Accessibility compliant
 * - Badge/notification support
 */
const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab,
  onTabChange,
  userRole = 'user',
  items,
  className = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter items based on user role
  const visibleItems = useMemo(() => {
    return items.filter(item => !item.adminOnly || userRole === 'admin');
  }, [items, userRole]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tabId);
      setIsMobileMenuOpen(false);
    }
  }, [onTabChange]);

  // Handle tab navigation with arrow keys
  const handleArrowNavigation = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % visibleItems.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    }
    
    if (newIndex !== currentIndex) {
      onTabChange(visibleItems[newIndex].id);
      // Focus the new tab
      const tabElement = document.querySelector(`[data-tab-id="${visibleItems[newIndex].id}"]`) as HTMLElement;
      tabElement?.focus();
    }
  }, [visibleItems, onTabChange]);

  return (
    <>
      {/* Desktop Navigation - Fixed Header */}
      <nav
        className={`hidden md:block bg-white border-b border-gray-200 shadow-sm transition-shadow duration-200 z-40 ${className}`}
        role="navigation"
        aria-label="Navigation principale"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0.5 py-2">
            {visibleItems.map((item, index) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  data-tour={`nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  onKeyDown={(e) => {
                    handleKeyDown(e, item.id);
                    handleArrowNavigation(e, index);
                  }}
                  className={`
                    relative flex items-center space-x-1 px-2 py-1.5 
                    font-medium text-xs transition-all duration-200 ease-in-out
                    whitespace-nowrap rounded-lg flex-shrink-0
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isActive
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                >
                  {/* Left indicator bar (2-3px) */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                      aria-hidden="true"
                    />
                  )}
                  
                  {/* Icon */}
                  <span className={`
                    flex-shrink-0 transition-colors duration-200
                    ${isActive ? 'text-blue-600' : 'text-gray-500'}
                  `}>
                    {item.icon}
                  </span>
                  
                  {/* Label */}
                  <span className="font-medium text-xs">{item.label}</span>
                  
                  {/* Badge/Notification */}
                  {(item.badge || item.notification) && (
                    <span className={`
                      flex items-center justify-center
                      min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-semibold ml-1
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-500 text-white'
                      }
                      ${item.badge ? '' : 'w-2 h-2 p-0'}
                    `}>
                      {item.badge && item.badge > 0 ? (item.badge > 99 ? '99+' : item.badge) : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Sticky Header */}
      <nav
        className={`md:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 ${className}`}
        role="navigation"
        aria-label="Navigation principale"
      >
        <div className="px-4 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">
                {visibleItems.find(item => item.id === activeTab)?.label || 'Menu'}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mobile Menu Dropdown */}
          <div
            id="mobile-menu"
            className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {visibleItems.map((item, index) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(e, item.id);
                    handleArrowNavigation(e, index);
                  }}
                  className={`
                    relative w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  role="tab"
                  tabIndex={0}
                >
                  {/* Left indicator bar for mobile */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
                      aria-hidden="true"
                    />
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <span className={`
                      flex-shrink-0 transition-colors duration-200
                      ${isActive ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  
                  {(item.badge || item.notification) && (
                    <span className={`
                      flex items-center justify-center
                      min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-semibold
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-500 text-white'
                      }
                      ${item.badge ? '' : 'w-2.5 h-2.5 p-0'}
                    `}>
                      {item.badge && item.badge > 0 ? (item.badge > 99 ? '99+' : item.badge) : ''}
                    </span>
                  )}
                  
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile (Alternative) */}
      {false && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
          role="navigation"
          aria-label="Navigation mobile"
        >
          <div className="flex justify-around items-center px-2 py-2">
            {visibleItems.slice(0, 5).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex flex-col items-center justify-center px-3 py-2 rounded-lg
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isActive ? 'text-blue-600' : 'text-gray-600'}
                  `}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="mb-1">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

export default AdminNavbar;

