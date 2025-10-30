import React, { useState } from 'react';
import FileManagementPage from './FileManagementPage';
import PartnerManagementPage from './PartnerManagementPage';
import FinancialDocumentsPage from './FinancialDocumentsPage';
import UserManagementPage from './UserManagementPage';
import CMSManagementPage from './CMSManagementPage';

const ManagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'archives' | 'partenaires' | 'documents' | 'utilisateurs' | 'cms'>('archives');

  const tabs = [
    { id: 'archives' as const, label: 'Archives', icon: '📁' },
    { id: 'partenaires' as const, label: 'Partenaires', icon: '🤝' },
    { id: 'documents' as const, label: 'Documents Financiers', icon: '📄' },
    { id: 'utilisateurs' as const, label: 'Utilisateurs', icon: '👥' },
    { id: 'cms' as const, label: 'CMS', icon: '✏️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600">Centre de gestion Alliance Courtage</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                window.location.href = '/';
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
          {activeTab === 'archives' && <FileManagementPage />}
          {activeTab === 'partenaires' && <PartnerManagementPage />}
          {activeTab === 'documents' && <FinancialDocumentsPage />}
          {activeTab === 'utilisateurs' && <UserManagementPage />}
          {activeTab === 'cms' && <CMSManagementPage />}
        </div>
      </div>
    </div>
  );
};

export default ManagePage;
