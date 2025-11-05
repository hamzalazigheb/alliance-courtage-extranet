import React, { useState, useEffect } from 'react';
import { formationsAPI, notificationsAPI, buildAPIURL, buildFileURL } from './api';
import StructuredProductsCMSPage from './StructuredProductsCMSPage';
import RencontresCMSPage from './RencontresCMSPage';
import ReglementaireCMSPage from './ReglementaireCMSPage';
import GammeFinanciereCMSPage from './GammeFinanciereCMSPage';
import PartenairesCMSPage from './PartenairesCMSPage';

interface NewsItem {
  id?: number;
  title: string;
  content: string;
  date: string;
  color: 'indigo' | 'purple' | 'pink';
}

interface NewsletterItem {
  title: string;
  badge: string;
  description: string;
  filePath: string;
  isRecent: boolean;
}

interface ServiceItem {
  name: string;
}

interface HomePageContent {
  welcomeTitle: string;
  news: NewsItem[];
  services: ServiceItem[];
}

const CMSManagementPage: React.FC = () => {
  const [content, setContent] = useState<HomePageContent>({
    welcomeTitle: 'Bienvenue chez Alliance Courtage',
    news: [
      {
        title: 'Nouvelle réglementation assurance-vie',
        content: 'Découvrez les dernières modifications de la réglementation sur l\'assurance-vie et leurs impacts sur vos contrats.',
        date: '15/01/2025',
        color: 'indigo'
      },
      {
        title: 'Évolution des taux d\'intérêt',
        content: 'Analyse des tendances actuelles des taux d\'intérêt et conseils pour optimiser vos placements.',
        date: '12/01/2025',
        color: 'purple'
      },
      {
        title: 'Nouveaux produits de prévoyance',
        content: 'Présentation de nos nouveaux contrats de prévoyance adaptés aux besoins des entreprises.',
        date: '10/01/2025',
        color: 'pink'
      }
    ],
    services: [
      { name: 'Epargne et retraite' },
      { name: 'Prévoyance et santé' },
      { name: 'Assurances collectives' },
      { name: 'Investissement financier (CIF)' }
    ]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activePage, setActivePage] = useState<'home' | 'gamme-produits' | 'formations' | 'produits-structures' | 'rencontres' | 'reglementaire' | 'gamme-financiere' | 'partenaires' | 'notifications'>('home');
  const [activeSection, setActiveSection] = useState<'welcome' | 'news' | 'services'>('welcome');
  const [pendingFormations, setPendingFormations] = useState<any[]>([]);
  const [allFormations, setAllFormations] = useState<any[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [formationFilter, setFormationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Gamme Produits structured content
  type ClientId = 'particulier' | 'professionnel' | 'entreprise';
  type ProdId = 'epargne' | 'retraite' | 'prevoyance' | 'sante' | 'cif';
  type GPContent = { 
    title?: string;
    subtitle?: string;
    catalogue?: {
      title?: string;
      badge?: string;
      description?: string;
      fileUrl?: string;
      updatedAtLabel?: string;
      downloadLabel?: string;
    };
    products: Record<ClientId, Record<ProdId, string[]>> 
  };

  const emptyGP: GPContent = {
    title: 'Gamme Produits',
    subtitle: 'Découvrez nos solutions adaptées à chaque type de client et de produit',
    catalogue: {
      title: 'Téléchargez notre catalogue produits',
      badge: 'Catalogue 2025',
      description: "Découvrez notre gamme complète de produits d'assurance et d'investissement pour tous vos besoins.",
      fileUrl: '/catalogue-produits-2025.pdf',
      updatedAtLabel: 'Mise à jour 2025',
      downloadLabel: 'Télécharger le PDF'
    },
    products: {
      particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
    }
  };

  const [gpContent, setGpContent] = useState<GPContent>(emptyGP);
  const [gpClient, setGpClient] = useState<ClientId>('particulier');
  const [gpProd, setGpProd] = useState<ProdId>('epargne');
  const [newProductName, setNewProductName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [catalogUploading, setCatalogUploading] = useState(false);

  useEffect(() => {
    loadContent();
    if (activePage === 'formations') {
      loadFormations();
    }
    loadNotifications();
    loadUnreadCount();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
      if (activePage === 'formations') {
        loadFormations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activePage, formationFilter]);
  
  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll(true); // Only unread
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };
  
  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  const handleNotificationClick = (notification: any) => {
    handleMarkAsRead(notification.id);
    setShowNotifications(false);
    if (notification.related_type === 'formation' && notification.related_id) {
      setActivePage('formations');
      loadFormations();
    }
  };
  
  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const loadFormations = async () => {
    setLoadingFormations(true);
    try {
      if (formationFilter === 'pending') {
        const data = await formationsAPI.getPending();
        setPendingFormations(data);
        setAllFormations(data);
      } else {
        const statut = formationFilter === 'all' ? null : formationFilter;
        const data = await formationsAPI.getAllAdmin(statut);
        setAllFormations(data);
        // Garder aussi pendingFormations pour le badge
        if (formationFilter === 'all') {
          const pendingData = await formationsAPI.getPending();
          setPendingFormations(pendingData);
        } else {
          setPendingFormations([]);
        }
      }
    } catch (error) {
      console.error('Error loading formations:', error);
    } finally {
      setLoadingFormations(false);
    }
  };

  const loadPendingFormations = async () => {
    setLoadingFormations(true);
    try {
      const data = await formationsAPI.getPending();
      setPendingFormations(data);
    } catch (error) {
      console.error('Error loading pending formations:', error);
    } finally {
      setLoadingFormations(false);
    }
  };

  const handleApproveFormation = async (id: number) => {
    try {
      await formationsAPI.approve(id);
      alert('✅ Formation approuvée avec succès');
      loadFormations();
    } catch (error: any) {
      console.error('Error approving formation:', error);
      alert('Erreur: ' + (error.message || 'Erreur lors de l\'approbation de la formation'));
    }
  };

  const handleRejectFormation = async (id: number) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // User cancelled

    try {
      await formationsAPI.reject(id, reason || null);
      alert('✅ Formation rejetée');
      loadFormations();
    } catch (error: any) {
      console.error('Error rejecting formation:', error);
      alert('Erreur: ' + (error.message || 'Erreur lors du rejet de la formation'));
    }
  };

  const loadContent = async () => {
    try {
      const endpoint = activePage === 'home' ? 'home' : 'gamme-produits';
      const response = await fetch(buildAPIURL(`/cms/${endpoint}`), {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.content) {
          if (activePage === 'home') {
            const parsedContent = JSON.parse(data.content);
            setContent(parsedContent);
          } else {
            const parsed = JSON.parse(data.content);
            setGpContent({
              products: {
                particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.particulier || {}) },
                professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.professionnel || {}) },
                entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.entreprise || {}) }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const endpoint = activePage === 'home' ? 'home' : 'gamme-produits';
      const payload = activePage === 'home'
        ? JSON.stringify({ content: JSON.stringify(content) })
        : JSON.stringify({ content: JSON.stringify(gpContent) });

      const response = await fetch(buildAPIURL(`/cms/${endpoint}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: payload
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Contenu sauvegardé avec succès!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving CMS content:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addNewsItem = () => {
    setContent({
      ...content,
      news: [
        ...content.news,
        {
          title: 'Nouvelle actualité',
          content: 'Description de l\'actualité...',
          date: new Date().toLocaleDateString('fr-FR'),
          color: 'indigo'
        }
      ]
    });
  };

  const removeNewsItem = (index: number) => {
    setContent({
      ...content,
      news: content.news.filter((_, i) => i !== index)
    });
  };

  const addService = () => {
    setContent({
      ...content,
      services: [...content.services, { name: 'Nouveau service' }]
    });
  };

  const removeService = (index: number) => {
    setContent({
      ...content,
      services: content.services.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">📝 Gestion du Contenu (CMS)</h2>
            <p className="text-slate-300">Gérez le contenu de la page d'accueil</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    loadNotifications();
                  }
                }}
                className="relative px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notifications-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              !notif.is_read ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{notif.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                              <div className="text-xs text-gray-400 mt-2">
                                {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {successMessage && (
              <div className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-300 rounded-lg">
                {successMessage}
              </div>
            )}
            <button
              onClick={saveContent}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? '💾 Sauvegarde...' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {/* Page selector */
      }
      <div className="bg-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setActivePage('home'); setActiveSection('welcome'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'home' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >🏠 Accueil</button>
          <button
            onClick={() => { setActivePage('gamme-produits'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'gamme-produits' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >📦 Gamme Produits</button>
          <button
            onClick={() => { setActivePage('formations'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all relative ${activePage === 'formations' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🎓 Formations
            {pendingFormations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingFormations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActivePage('produits-structures'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'produits-structures' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            📊 Produits Structurés
          </button>
          <button
            onClick={() => { setActivePage('rencontres'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'rencontres' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🤝 Rencontres
          </button>
          <button
            onClick={() => { setActivePage('reglementaire'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'reglementaire' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            📋 Réglementaire
          </button>
          <button
            onClick={() => { setActivePage('gamme-financiere'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'gamme-financiere' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            💰 Gamme Financière
          </button>
          <button
            onClick={() => { setActivePage('partenaires'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'partenaires' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🤝 Partenaires
          </button>
          <button
            onClick={() => { setActivePage('notifications'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'notifications' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            📢 Notifications
          </button>
        </div>
      </div>

      {/* Section tabs (only for Home) */}
      {activePage === 'home' && (
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex space-x-2">
            {[
              { id: 'welcome', label: '🏠 Accueil' },
              { id: 'news', label: '📰 Actualités' },
              { id: 'services', label: '⚙️ Services' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Editor */}
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
        {activePage === 'gamme-produits' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-2">Gamme Produits</h3>
            {/* Titre & Sous-titre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                <input
                  type="text"
                  value={gpContent.title || ''}
                  onChange={(e) => setGpContent({ ...gpContent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={gpContent.subtitle || ''}
                  onChange={(e) => setGpContent({ ...gpContent, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bloc Catalogue PDF */}
            <div className="bg-slate-700/40 rounded-lg p-4 space-y-4">
              <h4 className="text-white font-semibold">Bloc Catalogue PDF</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.title || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), title: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Badge</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.badge || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), badge: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.description || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), description: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">URL du PDF</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={gpContent.catalogue?.fileUrl || ''}
                      onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), fileUrl: e.target.value } })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                      placeholder="/path/to/catalogue.pdf (ou utilisez l'upload ci-dessous)"
                    />
                    <div className="flex items-center space-x-3">
                      <input
                        id="catalog-file-input"
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setCatalogUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const resp = await fetch(buildAPIURL('/archives'), {
                              method: 'POST',
                              headers: {
                                'x-auth-token': localStorage.getItem('token') || ''
                              },
                              body: formData
                            });
                            if (resp.ok) {
                              const data = await resp.json().catch(() => ({}));
                              const path = data.file_path || data.path || data.url;
                              if (path) {
                                setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), fileUrl: path } });
                              } else {
                                alert('Upload réussi mais chemin de fichier non retourné.');
                              }
                            } else {
                              const err = await resp.json().catch(() => ({}));
                              alert(err.error || 'Erreur lors de l\'upload du fichier PDF');
                            }
                          } catch (err) {
                            console.error('Upload catalog error:', err);
                            alert('Erreur lors de l\'upload');
                          } finally {
                            setCatalogUploading(false);
                          }
                        }}
                        className="flex-1 text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                      />
                      {catalogUploading && <span className="text-slate-300 text-sm">Upload...</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Libellé mise à jour</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.updatedAtLabel || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), updatedAtLabel: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Libellé bouton</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.downloadLabel || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), downloadLabel: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            {/* Choix client / type de produit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Type de client</label>
                <select
                  value={gpClient}
                  onChange={(e) => setGpClient(e.target.value as ClientId)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                >
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Famille de produit</label>
                <select
                  value={gpProd}
                  onChange={(e) => setGpProd(e.target.value as ProdId)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                >
                  {Object.keys(gpContent.products[gpClient]).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ajouter / supprimer une famille */}
            <div className="bg-slate-700/40 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nouvelle famille</label>
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    placeholder="Ex: Immobilier, Assurance emprunteur..."
                  />
                </div>
                <button
                  onClick={() => {
                    const name = newFamilyName.trim();
                    if (!name) return;
                    const next: GPContent = JSON.parse(JSON.stringify(gpContent));
                    ['particulier','professionnel','entreprise'].forEach((c) => {
                      if (!next.products[c as ClientId][name as ProdId]) {
                        (next.products[c as ClientId] as any)[name] = [];
                      }
                    });
                    setGpContent(next);
                    setGpProd(name as ProdId);
                    setNewFamilyName('');
                  }}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  + Ajouter la famille
                </button>
                <button
                  onClick={() => {
                    const families = Object.keys(gpContent.products[gpClient]);
                    if (families.length <= 1) return; // garder au moins une famille
                    const next: GPContent = JSON.parse(JSON.stringify(gpContent));
                    ['particulier','professionnel','entreprise'].forEach((c) => {
                      delete (next.products[c as ClientId] as any)[gpProd];
                    });
                    const remaining = Object.keys(next.products[gpClient]) as ProdId[];
                    setGpContent(next);
                    setGpProd((remaining[0] || 'epargne') as ProdId);
                  }}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Supprimer la famille
                </button>
              </div>
            </div>

            {/* Liste des produits */}
            <div className="bg-slate-700/40 rounded-lg p-4">
              <div className="flex items-end space-x-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Ajouter un produit</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    placeholder="Nom du produit"
                  />
                </div>
                <button
                  onClick={() => {
                    const name = newProductName.trim();
                    if (!name) return;
                    const next = { ...gpContent };
                    next.products[gpClient][gpProd] = [...next.products[gpClient][gpProd], name];
                    setGpContent(next);
                    setNewProductName('');
                  }}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  + Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {gpContent.products[gpClient][gpProd].length === 0 && (
                  <div className="text-slate-300 text-sm">Aucun produit. Ajoutez un élément ci-dessus.</div>
                )}
                {gpContent.products[gpClient][gpProd].map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const next = { ...gpContent };
                        next.products[gpClient][gpProd][idx] = e.target.value;
                        setGpContent(next);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const next = { ...gpContent };
                        next.products[gpClient][gpProd] = next.products[gpClient][gpProd].filter((_, i) => i !== idx);
                        setGpContent(next);
                      }}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePage === 'formations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Gestion des formations</h3>
              <button
                onClick={loadFormations}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
              >
                🔄 Actualiser
              </button>
            </div>

            {/* Filtres par statut */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex space-x-2">
                {[
                  { id: 'all' as const, label: 'Toutes', count: null },
                  { id: 'pending' as const, label: 'En attente', count: pendingFormations.length },
                  { id: 'approved' as const, label: 'Approuvées', count: null },
                  { id: 'rejected' as const, label: 'Rejetées', count: null }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setFormationFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                      formationFilter === filter.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {filter.label}
                    {filter.count !== null && filter.count > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {loadingFormations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-slate-300 mt-4">Chargement...</p>
              </div>
            ) : allFormations.length === 0 ? (
              <div className="bg-slate-700/40 rounded-lg p-8 text-center">
                <p className="text-slate-300 text-lg">
                  {formationFilter === 'all' 
                    ? 'Aucune formation trouvée' 
                    : formationFilter === 'pending'
                    ? '✅ Aucune formation en attente'
                    : formationFilter === 'approved'
                    ? 'Aucune formation approuvée'
                    : 'Aucune formation rejetée'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allFormations.map((formation: any) => {
                  const dateStr = formation.date ? new Date(formation.date).toLocaleDateString('fr-FR') : '';
                  const categories = Array.isArray(formation.categories) ? formation.categories : JSON.parse(formation.categories || '[]');
                  const statutColor = {
                    pending: 'bg-yellow-500',
                    approved: 'bg-green-500',
                    rejected: 'bg-red-500'
                  }[formation.statut] || 'bg-gray-500';
                  
                  return (
                    <div key={formation.id} className="bg-slate-700/40 rounded-lg p-6 border border-slate-600">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-bold text-white">{formation.nom_document}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statutColor}`}>
                              {formation.statut === 'pending' ? 'En attente' : formation.statut === 'approved' ? 'Approuvée' : 'Rejetée'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-slate-300 text-sm">
                            <div>
                              <span className="font-semibold">Utilisateur:</span> {formation.user_name || formation.userName || 'N/A'}
                            </div>
                            <div>
                              <span className="font-semibold">Date:</span> {dateStr}
                            </div>
                            <div>
                              <span className="font-semibold">Heures:</span> {formation.heures}h
                            </div>
                            <div>
                              <span className="font-semibold">Année:</span> {formation.year}
                            </div>
                            <div>
                              <span className="font-semibold">Délivrée par:</span> {formation.delivree_par || '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Soumis le:</span> {formation.created_at ? new Date(formation.created_at).toLocaleDateString('fr-FR') : '-'}
                            </div>
                            {formation.approved_at && (
                              <div>
                                <span className="font-semibold">Approuvée le:</span> {new Date(formation.approved_at).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            {formation.rejected_reason && (
                              <div className="col-span-2">
                                <span className="font-semibold">Raison du rejet:</span> <span className="text-red-400">{formation.rejected_reason}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className="font-semibold text-slate-300 text-sm">Catégories:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {categories.map((cat: string) => (
                                <span key={cat} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          {(formation.fileUrl || formation.file_path || formation.hasFileContent || formation.file_content) && (
                            <div className="mt-4 p-4 bg-slate-800/60 rounded-lg border border-slate-500">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold text-sm">Document uploadé</p>
                                    {formation.file_type && (
                                      <p className="text-slate-400 text-xs mt-1">
                                        {formation.file_type} • {formation.file_size ? `${(formation.file_size / 1024).toFixed(2)} KB` : 'Taille inconnue'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                      const token = localStorage.getItem('token');
                                      if (!token) {
                                        alert('❌ Vous devez être connecté pour télécharger le document');
                                        return;
                                      }

                                      const downloadUrl = formation.fileUrl || buildFileURL(formation.file_path);
                                      
                                      // Si c'est un fichier base64 (via API), utiliser fetch avec token
                                      if (formation.fileUrl && formation.fileUrl.includes('/api/formations/')) {
                                        const response = await fetch(downloadUrl, {
                                          headers: {
                                            'x-auth-token': token
                                          }
                                        });

                                        if (!response.ok) {
                                          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                                        }

                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        
                                        // Récupérer le nom du fichier depuis les headers ou utiliser le nom de la formation
                                        const contentDisposition = response.headers.get('Content-Disposition');
                                        let fileName = formation.nom_document || 'formation';
                                        if (contentDisposition) {
                                          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                          if (fileNameMatch && fileNameMatch[1]) {
                                            fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
                                          }
                                        }
                                        
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      } else {
                                        // Pour les fichiers statiques (file_path), ouvrir directement
                                        window.open(downloadUrl, '_blank');
                                      }
                                    } catch (error: any) {
                                      console.error('Erreur téléchargement:', error);
                                      alert('❌ Erreur lors du téléchargement: ' + (error.message || 'Erreur inconnue'));
                                    }
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-md hover:shadow-lg"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Télécharger
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-600">
                        {formation.statut === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRejectFormation(formation.id)}
                              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                              ❌ Rejeter
                            </button>
                            <button
                              onClick={() => handleApproveFormation(formation.id)}
                              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                            >
                              ✅ Approuver
                            </button>
                          </>
                        )}
                        {formation.statut !== 'pending' && (
                          <div className="text-slate-400 text-sm">
                            {formation.statut === 'approved' ? '✅ Formation approuvée' : '❌ Formation rejetée'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activePage === 'produits-structures' && (
          <StructuredProductsCMSPage />
        )}

        {activePage === 'rencontres' && (
          <RencontresCMSPage />
        )}

        {activePage === 'reglementaire' && (
          <ReglementaireCMSPage />
        )}

        {activePage === 'gamme-financiere' && (
          <GammeFinanciereCMSPage />
        )}

        {activePage === 'partenaires' && (
          <PartenairesCMSPage />
        )}

        {activePage === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">📢 Envoyer une notification à tous les utilisateurs</h3>
              
              <NotificationBroadcastForm />
            </div>
          </div>
        )}

        {activeSection === 'welcome' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Titre de Bienvenue</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
              <input
                type="text"
                value={content.welcomeTitle}
                onChange={(e) => setContent({ ...content, welcomeTitle: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Titre de bienvenue"
              />
            </div>
          </div>
        )}

        {activeSection === 'news' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Actualités</h3>
              <button
                onClick={addNewsItem}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
              >
                + Ajouter une actualité
              </button>
            </div>
            
            {content.news.map((item, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">Actualité #{index + 1}</h4>
                  <button
                    onClick={() => removeNewsItem(index)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
                  >
                    Supprimer
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const newNews = [...content.news];
                      newNews[index].title = e.target.value;
                      setContent({ ...content, news: newNews });
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Contenu</label>
                  <textarea
                    value={item.content}
                    onChange={(e) => {
                      const newNews = [...content.news];
                      newNews[index].content = e.target.value;
                      setContent({ ...content, news: newNews });
                    }}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                    <input
                      type="text"
                      value={item.date}
                      onChange={(e) => {
                        const newNews = [...content.news];
                        newNews[index].date = e.target.value;
                        setContent({ ...content, news: newNews });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Couleur</label>
                    <select
                      value={item.color}
                      onChange={(e) => {
                        const newNews = [...content.news];
                        newNews[index].color = e.target.value as any;
                        setContent({ ...content, news: newNews });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    >
                      <option value="indigo">Indigo</option>
                      <option value="purple">Violet</option>
                      <option value="pink">Rose</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Services</h3>
              <button
                onClick={addService}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
              >
                + Ajouter un service
              </button>
            </div>
            
            {content.services.map((service, index) => (
              <div key={index} className="flex items-center space-x-3 bg-slate-700/50 rounded-lg p-4">
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => {
                    const newServices = [...content.services];
                    newServices[index].name = e.target.value;
                    setContent({ ...content, services: newServices });
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
                <button
                  onClick={() => removeService(index)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">👁️ Aperçu en temps réel</h3>
        <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
          <p className="text-gray-600 text-sm mb-2">Aperçu de la page d'accueil...</p>
          {activeSection === 'welcome' && (
            <h2 className="text-2xl font-bold text-gray-800">{content.welcomeTitle}</h2>
          )}
          {activeSection === 'news' && content.news.map((item, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-100 rounded">
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.content}</p>
              <span className="text-xs text-gray-500">{item.date}</span>
            </div>
          ))}
          {activeSection === 'services' && (
            <ul className="space-y-1">
              {content.services.map((service, index) => (
                <li key={index} className="text-gray-700">• {service.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour le formulaire de notification globale
const NotificationBroadcastForm: React.FC = () => {
  const [type, setType] = useState<string>('info');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du lien si fourni
    if (link.trim() && !link.trim().startsWith('http://') && !link.trim().startsWith('https://') && !link.trim().startsWith('#')) {
      setErrorMessage('Le lien doit commencer par http://, https:// ou # pour un lien interne');
      return;
    }

    setSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await notificationsAPI.broadcast(
        type, 
        title.trim(), 
        message.trim(), 
        link.trim() || null
      );
      setSuccessMessage(`✅ Notification envoyée avec succès à ${result.recipientCount || 'tous les'} utilisateur(s) !`);
      setTitle('');
      setMessage('');
      setLink('');
      setType('info');
    } catch (error: any) {
      console.error('Erreur envoi notification:', error);
      setErrorMessage(error.message || 'Erreur lors de l\'envoi de la notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type de notification */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Type de notification</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="info">ℹ️ Information</option>
          <option value="success">✅ Succès</option>
          <option value="warning">⚠️ Avertissement</option>
          <option value="error">❌ Erreur</option>
          <option value="announcement">📢 Annonce</option>
        </select>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Titre *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Ex: Nouvelle fonctionnalité disponible"
          required
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Message *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Ex: Nous avons le plaisir de vous informer que..."
          required
        />
      </div>

      {/* Lien */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Lien (optionnel)</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Ex: https://example.com ou #produits-structures"
        />
        <p className="mt-2 text-xs text-slate-400">
          Lien externe (http:// ou https://) ou lien interne (commence par #, ex: #produits-structures)
        </p>
      </div>

      {/* Messages d'erreur/succès */}
      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-300">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-300">{successMessage}</p>
        </div>
      )}

      {/* Bouton d'envoi */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Envoyer à tous les utilisateurs</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CMSManagementPage;

