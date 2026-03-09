import React, { useState, useEffect, useMemo } from 'react';
import { formationsAPI, notificationsAPI, buildAPIURL, buildFileURL } from './api';
import StructuredProductsCMSPage from './StructuredProductsCMSPage';
import RencontresCMSPage from './RencontresCMSPage';
import ReglementaireCMSPage from './ReglementaireCMSPage';
import GammeFinanciereCMSPage from './GammeFinanciereCMSPage';
import PartenairesCMSPage from './PartenairesCMSPage';
import { useAlert } from './contexts/AlertContext';

interface NewsItem {
  id?: number;
  title: string;
  content: string;
  date: string;
  color: 'indigo' | 'purple' | 'pink' | 'blue' | 'green' | 'yellow' | 'red' | 'orange';
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
  contact?: {
    phone: string;
    email: string;
  };
}

// Composant pour afficher les fichiers d'un produit dans le workflow
const ProductFilesListForWorkflow: React.FC<{
  productKey: string;
  clientType: string;
  productName: string;
}> = ({ productKey, clientType, productName }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadFiles();
  }, [productKey, refreshKey]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const encodedProductKey = encodeURIComponent(productKey);
      const response = await fetch(buildAPIURL(`/cms/gamme-produits/files/${encodedProductKey}`));
      if (response.ok) {
        const filesData = await response.json();
        const validFiles = filesData.filter((f: any) => f.file_size > 0);
        setFiles(validFiles);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Exposer la fonction de rechargement via window pour pouvoir l'appeler depuis le parent
  useEffect(() => {
    (window as any)[`reloadFiles_${productKey.replace(/[^a-zA-Z0-9]/g, '_')}`] = () => {
      setRefreshKey(prev => prev + 1);
    };
    return () => {
      delete (window as any)[`reloadFiles_${productKey.replace(/[^a-zA-Z0-9]/g, '_')}`];
    };
  }, [productKey]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-600">
        <p className="text-xs text-slate-400">Chargement des documents...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-600">
        <p className="text-sm text-slate-400">Aucun document ajouté pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-600">
      <h6 className="text-sm font-semibold text-slate-300 mb-2">📄 Documents ajoutés ({files.length})</h6>
      <div className="space-y-2">
        {files.map((file: any) => (
          <div key={file.id} className="flex items-center justify-between bg-slate-600/50 rounded-lg p-2">
            <span className="text-xs text-slate-300 truncate flex-1 mr-2">
              {file.file_name}
            </span>
            <span className="text-xs text-slate-400">
              {(file.file_size / 1024).toFixed(2)} KB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CMSManagementPage: React.FC = () => {
  const { showSuccess, showError, showWarning } = useAlert();
  
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
    ],
    contact: {
      phone: '07.45.06.43.88',
      email: 'contact@alliance-courtage.fr'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activePage, setActivePage] = useState<'home' | 'formations' | 'produits-structures' | 'rencontres' | 'reglementaire' | 'gamme-financiere' | 'partenaires' | 'notifications'>('home');
  const [activeSection, setActiveSection] = useState<'welcome' | 'news' | 'services' | 'contact'>('welcome');
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
  type ProductDocument = {
    id: string; // UUID ou timestamp pour identifier le document
    title: string;
    file_name: string;
    file_content: string; // base64
    file_size: number;
    file_type: string;
    uploaded_at: string;
  };
  type Product = {
    name: string;
    description: string;
    documents?: ProductDocument[];
  };
  type GPContent = { 
    products: Record<ClientId, Record<ProdId, Product[]>> 
  };

  const emptyGP: GPContent = {
    products: {
      particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
    }
  };

  const [gpContent, setGpContent] = useState<GPContent>(emptyGP);
  const [selectedClients, setSelectedClients] = useState<ClientId[]>(['particulier']); // Multi-sélection
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(['epargne']); // Multi-sélection
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingProductDocument, setEditingProductDocument] = useState<{productName: string, family: string, client?: string} | null>(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    files: [] as File[]
  });
  // État pour gérer l'expansion des cartes de produits dans la liste globale
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  // État pour le filtrage dans la vue "Tous les produits"
  const [clientFilter, setClientFilter] = useState<ClientId | 'all'>('all');
  // État pour gérer l'édition des produits dans la liste globale
  const [editingGlobalProduct, setEditingGlobalProduct] = useState<string | null>(null);
  // Workflow states for better UX
  const [workflowStep, setWorkflowStep] = useState<'select' | 'add-product' | 'manage-documents'>('select');
  const [newlyAddedProduct, setNewlyAddedProduct] = useState<{name: string, family: string, clients: string[]} | null>(null);
  
  // Track initial state for incremental saves (only save what changed!)
  const [initialGpContent, setInitialGpContent] = useState<GPContent>(emptyGP);

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

  // Gérer le scroll quand le modal de document s'ouvre
  useEffect(() => {
    if (showDocumentModal) {
      // Sauvegarder la position de scroll actuelle
      const scrollY = window.scrollY;
      
      // Désactiver le scroll du body et forcer le scroll vers le haut
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Scroll vers le haut de la page immédiatement
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      return () => {
        // Réactiver le scroll du body et restaurer la position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      };
    }
  }, [showDocumentModal]);

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
      showSuccess('Formation approuvée avec succès');
      loadFormations();
    } catch (error: any) {
      console.error('Error approving formation:', error);
      showError('Erreur: ' + (error.message || 'Erreur lors de l\'approbation de la formation'));
    }
  };

  const handleRejectFormation = async (id: number) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // User cancelled

    try {
      await formationsAPI.reject(id, reason || null);
      showSuccess('Formation rejetée');
      loadFormations();
    } catch (error: any) {
      console.error('Error rejecting formation:', error);
      showError('Erreur: ' + (error.message || 'Erreur lors du rejet de la formation'));
    }
  };

  const loadContent = async () => {
    try {
      const endpoint = 'home'; // CMSManagementPage gère uniquement le contenu HOME maintenant
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
            // Assurer que contact existe avec les valeurs par défaut
            if (!parsedContent.contact) {
              parsedContent.contact = {
                phone: '07.45.06.43.88',
                email: 'contact@alliance-courtage.fr'
              };
            }
            setContent(parsedContent);
          } else {
            const parsed = JSON.parse(data.content);
            console.log('📥 Contenu chargé depuis le serveur:', JSON.stringify(parsed, null, 2).substring(0, 1000));
            
            const loadedContent = {
              products: {
                particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.particulier || {}) },
                professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.professionnel || {}) },
                entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.entreprise || {}) }
              }
            };
            // Convertir les anciens produits (strings) en objets {name, description, documents}
            const convertProducts = (products: any): Product[] => {
              if (!Array.isArray(products)) return [];
              return products.map((p: any) => {
                if (typeof p === 'string') {
                  return { name: p, description: '', documents: [] };
                }
                const converted = { 
                  name: p.name || '', 
                  description: p.description || '',
                  documents: p.documents && Array.isArray(p.documents) ? p.documents : []
                };
                if (converted.documents.length > 0) {
                  console.log(`✅ Document restauré pour "${converted.name}": ${converted.documents.length} document(s)`);
                }
                return converted;
              });
            };
            // Convertir tous les produits
            let totalDocumentsLoaded = 0;
            Object.keys(loadedContent.products).forEach((clientKey) => {
              Object.keys(loadedContent.products[clientKey as ClientId]).forEach((familyKey) => {
                const products = loadedContent.products[clientKey as ClientId][familyKey as ProdId] as any;
                if (Array.isArray(products)) {
                  const converted = convertProducts(products);
                  (loadedContent.products[clientKey as ClientId] as any)[familyKey] = converted;
                  converted.forEach((p: Product) => {
                    if (p.documents && Array.isArray(p.documents)) {
                      totalDocumentsLoaded += p.documents.length;
                    }
                  });
                }
              });
            });
            console.log(`📊 Total documents chargés: ${totalDocumentsLoaded}`);
            
            // Log détaillé du contenu chargé pour le produit "test"
            if (loadedContent.products.particulier && loadedContent.products.particulier.epargne) {
              const testProduct = loadedContent.products.particulier.epargne.find((p: Product) => p.name === 'test');
              if (testProduct) {
                console.log('🔍 Produit "test" trouvé dans particulier/epargne:', {
                  name: testProduct.name,
                  description: testProduct.description,
                  hasDocuments: !!testProduct.documents,
                  isArray: Array.isArray(testProduct.documents),
                  documentsCount: testProduct.documents && Array.isArray(testProduct.documents) ? testProduct.documents.length : 0,
                  documents: testProduct.documents
                });
              } else {
                console.log('⚠️ Produit "test" NON trouvé dans particulier/epargne');
              }
            }
            
            console.log('📦 État complet gpContent après chargement:', JSON.stringify(loadedContent, null, 2).substring(0, 2000));
            
            setGpContent(loadedContent);
            // Sauvegarder l'état initial pour détecter les changements plus tard
            setInitialGpContent(JSON.parse(JSON.stringify(loadedContent))); // Deep copy
            
            // Initialiser la sélection avec la première famille disponible
            const firstFamily = Object.keys(loadedContent.products[selectedClients[0] || 'particulier'])[0];
            if (firstFamily) {
              setSelectedFamilies([firstFamily]);
            }
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
    // Protection: s'assurer que setSaving(false) est toujours appelé
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;
    let safetyTimeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Démarrer immédiatement l'UI de chargement
    setSaving(true);
    setSuccessMessage('');
    
      // Timeout de sécurité absolu (10 minutes max) pour éviter que le bouton reste bloqué indéfiniment
      safetyTimeoutId = setTimeout(() => {
        console.error('⚠️ Timeout de sécurité atteint - libération du bouton');
        setSaving(false);
        showError('La sauvegarde a pris trop de temps. Veuillez réessayer.');
      }, 600000); // 10 minutes
      
      const endpoint = 'home'; // CMSManagementPage gère uniquement le contenu HOME maintenant
      
      // Préparer le payload
      let payload: string;
      try {
        payload = JSON.stringify({ content: JSON.stringify(content) });
      } catch (error: any) {
        console.error('❌ Erreur lors de la sérialisation:', error);
        // S'assurer que setSaving(false) est appelé même en cas d'erreur
        setSaving(false);
        if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        throw new Error(error?.message || 'Erreur lors de la préparation des données. Le contenu est peut-être trop volumineux.');
      }

      // Vérifier la taille du payload rapidement
      const payloadSize = new Blob([payload]).size;
      const payloadSizeMB = payloadSize / 1024 / 1024;
      
      if (payloadSize > 100 * 1024 * 1024) { // 100MB
        throw new Error(`Le contenu est trop volumineux (${payloadSizeMB.toFixed(2)} MB, max 100MB)`);
      }

      // Créer un AbortController pour le timeout (5 minutes pour les gros contenus)
      controller = new AbortController();
      const timeoutDuration = payloadSizeMB > 10 ? 300000 : 120000; // 5 min si > 10MB, sinon 2 min
      timeoutId = setTimeout(() => {
        console.warn('⏱️ Timeout de requête atteint');
        controller?.abort();
      }, timeoutDuration);
      
      // Logs en arrière-plan (non bloquants)
      setTimeout(() => {
        console.log('💾 Sauvegarde en cours...');
        console.log(`📦 Taille du payload: ${payloadSizeMB.toFixed(2)} MB`);
      }, 0);

      // Lancer la requête IMMÉDIATEMENT après la préparation
      console.log(`🚀 Envoi de la requête PUT vers /cms/${endpoint}...`);
      try {
      const response = await fetch(buildAPIURL(`/cms/${endpoint}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
          body: payload,
          signal: controller.signal
      });
      
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!response.ok) {
          let errorData: any = { error: 'Erreur inconnue' };
          try {
            const text = await response.text();
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (e) {
            console.warn('Impossible de parser la réponse d\'erreur:', e);
          }
          console.error('❌ Erreur sauvegarde:', errorData);
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }
        
        let responseData: any = {};
        try {
          const text = await response.text();
          if (text) {
            responseData = JSON.parse(text);
          }
        } catch (e) {
          console.warn('Impossible de parser la réponse:', e);
        }
        
        console.log('✅ Sauvegarde réussie. Réponse serveur:', responseData);
        setSuccessMessage('✅ Contenu sauvegardé avec succès!');
        setTimeout(() => setSuccessMessage(''), 5000);
        
      } catch (fetchError: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.error('❌ Erreur fetch:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error(`La sauvegarde a pris trop de temps (timeout après ${timeoutDuration / 1000}s). Le contenu est peut-être trop volumineux.`);
        }
        
        if (fetchError.message) {
          throw fetchError;
        }
        
        // Gérer les erreurs réseau
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw new Error('Erreur de connexion. Vérifiez votre connexion internet et que le serveur est accessible.');
        }
        
        throw new Error('Erreur de connexion lors de la sauvegarde. Vérifiez votre connexion internet.');
      }
    } catch (error: any) {
      console.error('❌ Error saving CMS content:', error);
      const errorMessage = error?.message || 'Erreur lors de la sauvegarde';
      showError(errorMessage);
    } finally {
      // Nettoyer tous les timeouts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId);
      }
      
      // S'assurer que le bouton est toujours libéré
      console.log('🔓 Libération du bouton sauvegarder');
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

  // Optimized computation of existing documents for the modal
  const existingDocumentsForModal = useMemo(() => {
    if (!editingProductDocument) return [];
    
    const clientToUse = editingProductDocument.client || selectedClients[0];
    const products = gpContent.products[clientToUse as ClientId]?.[editingProductDocument.family as ProdId] || [];
    const product = products.find((p: Product) => p.name === editingProductDocument.productName);
    return product?.documents || [];
  }, [editingProductDocument, gpContent, selectedClients]);

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
              title="Sauvegarder le contenu"
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
            📅 Événements
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
              { id: 'services', label: '⚙️ Services' },
              { id: 'contact', label: '📞 Contact' }
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
                                        showError('Vous devez être connecté pour télécharger le document');
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
                                      showError('Erreur lors du téléchargement: ' + (error.message || 'Erreur inconnue'));
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
          <StructuredProductsCMSPage mode="content-only" />
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

            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">👤 Envoyer une notification individuelle</h3>
              
              <NotificationIndividualForm />
            </div>

            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">👥 Envoyer une notification à plusieurs utilisateurs</h3>
              
              <NotificationBulkForm />
            </div>

            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">📧 Envoyer un email personnalisé</h3>
              
              <PersonalizedEmailForm />
            </div>

            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">📋 Historique des notifications envoyées</h3>
              
              <NotificationHistory />
            </div>
          </div>
        )}

        {activePage === 'home' && activeSection === 'welcome' && (
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

        {activePage === 'home' && activeSection === 'news' && (
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
                      <option value="blue">Bleu</option>
                      <option value="green">Vert</option>
                      <option value="yellow">Jaune</option>
                      <option value="red">Rouge</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activePage === 'home' && activeSection === 'services' && (
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

        {activePage === 'home' && activeSection === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Téléphone</label>
                <input
                  type="text"
                  value={content.contact?.phone || ''}
                  onChange={(e) => setContent({ 
                    ...content, 
                    contact: { 
                      ...content.contact, 
                      phone: e.target.value 
                    } as any 
                  })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  placeholder="07.45.06.43.88"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={content.contact?.email || ''}
                  onChange={(e) => setContent({ 
                    ...content, 
                    contact: { 
                      ...content.contact, 
                      email: e.target.value 
                    } as any 
                  })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  placeholder="contact@alliance-courtage.fr"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview - Only for Home page */}
      {activePage === 'home' && (
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
            {activeSection === 'contact' && content.contact && (
              <div className="space-y-2">
                {content.contact.phone && (
                  <div className="flex items-center space-x-2 text-gray-700">
                    <span>📞</span>
                    <span>{content.contact.phone}</span>
                  </div>
                )}
                {content.contact.email && (
                  <div className="flex items-center space-x-2 text-gray-700">
                    <span>📧</span>
                    <span>{content.contact.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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

// Composant pour le formulaire de notification individuelle
const NotificationIndividualForm: React.FC = () => {
  const [type, setType] = useState<string>('info');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Charger la liste des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(buildAPIURL('/users'), {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filtrer pour ne garder que les utilisateurs non-admin
          const nonAdminUsers = data.filter((user: any) => user.role !== 'admin');
          setUsers(nonAdminUsers);
        } else {
          console.error('Erreur lors du chargement des utilisateurs');
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || !userId) {
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
      const result = await notificationsAPI.send(
        parseInt(userId),
        type, 
        title.trim(), 
        message.trim(), 
        link.trim() || null
      );
      const selectedUser = users.find(u => u.id === parseInt(userId));
      setSuccessMessage(`✅ Notification envoyée avec succès à ${selectedUser?.prenom} ${selectedUser?.nom} (${selectedUser?.email}) !`);
      setTitle('');
      setMessage('');
      setLink('');
      setUserId('');
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
      {/* Sélection utilisateur */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Utilisateur *</label>
        {loadingUsers ? (
          <div className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Chargement des utilisateurs...</span>
          </div>
        ) : (
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            required
          >
            <option value="">Sélectionner un utilisateur</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.denomination_sociale 
                  ? `${user.denomination_sociale} - ${user.prenom} ${user.nom}`
                  : `${user.prenom} ${user.nom}`
                } ({user.email})
              </option>
            ))}
          </select>
        )}
      </div>

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
          placeholder="Ex: Notification importante"
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
          disabled={sending || !title.trim() || !message.trim() || !userId}
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
              <span>Envoyer la notification</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Composant pour le formulaire d'envoi d'email personnalisé
const PersonalizedEmailForm: React.FC = () => {
  const [userIds, setUserIds] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [template, setTemplate] = useState<string>('default');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Charger la liste des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(buildAPIURL('/users'), {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filtrer pour ne garder que les utilisateurs non-admin avec email
          const validUsers = data.filter((user: any) => 
            user.role !== 'admin' && user.email
          );
          setUsers(validUsers);
        } else {
          console.error('Erreur lors du chargement des utilisateurs');
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleUserToggle = (userId: string) => {
    setUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (userIds.length === users.length) {
      setUserIds([]);
    } else {
      setUserIds(users.map(u => u.id.toString()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim() || userIds.length === 0) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires et sélectionner au moins un utilisateur');
      return;
    }

    setSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/emails/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          userIds: userIds.map(id => parseInt(id)),
          subject: subject.trim(),
          message: message.trim(),
          template: template
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(
          `✅ ${data.sent} email(s) envoyé(s) avec succès${data.failed > 0 ? `, ${data.failed} erreur(s)` : ''} !`
        );
        setSubject('');
        setMessage('');
        setUserIds([]);
        setTemplate('default');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      setErrorMessage(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sélection utilisateurs (multiple) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-300">Destinataires *</label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {userIds.length === users.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        {loadingUsers ? (
          <div className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Chargement des utilisateurs...</span>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-lg bg-slate-700 p-3">
            {users.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun utilisateur disponible</p>
            ) : (
              users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-2 p-2 hover:bg-slate-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={userIds.includes(user.id.toString())}
                    onChange={() => handleUserToggle(user.id.toString())}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-200">
                    {user.denomination_sociale 
                      ? `${user.denomination_sociale} - ${user.prenom} ${user.nom}`
                      : `${user.prenom} ${user.nom}`
                    } ({user.email})
                  </span>
                </label>
              ))
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          {userIds.length > 0 ? `${userIds.length} utilisateur(s) sélectionné(s)` : 'Sélectionnez un ou plusieurs utilisateurs'}
        </p>
      </div>

      {/* Sujet */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Sujet *</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Ex: Information importante concernant votre compte"
          required
        />
      </div>

      {/* Template */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Template</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="default">Par défaut</option>
          <option value="announcement">Annonce</option>
          <option value="info">Information</option>
          <option value="success">Succès</option>
          <option value="warning">Avertissement</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Message *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Écrivez votre message personnalisé ici...&#10;&#10;Vous pouvez utiliser plusieurs lignes. Le message sera formaté automatiquement dans l'email."
          required
        />
        <p className="mt-2 text-xs text-slate-400">
          Le message sera envoyé par email avec un template professionnel. Les retours à la ligne seront préservés.
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
          disabled={sending || !subject.trim() || !message.trim() || userIds.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Envoyer l'email{userIds.length > 0 ? ` (${userIds.length})` : ''}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Composant pour l'envoi groupé de notifications
const NotificationBulkForm: React.FC = () => {
  const [type, setType] = useState<string>('info');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(buildAPIURL('/users'), {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          const nonAdminUsers = data.filter((user: any) => user.role !== 'admin');
          setUsers(nonAdminUsers);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleUserToggle = (userId: string) => {
    setUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (userIds.length === users.length) {
      setUserIds([]);
    } else {
      setUserIds(users.map(u => u.id.toString()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || userIds.length === 0) {
      setErrorMessage('Veuillez remplir tous les champs et sélectionner au moins un utilisateur');
      return;
    }

    if (link.trim() && !link.trim().startsWith('http://') && !link.trim().startsWith('https://') && !link.trim().startsWith('#')) {
      setErrorMessage('Le lien doit commencer par http://, https:// ou # pour un lien interne');
      return;
    }

    setSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await notificationsAPI.sendBulk(
        userIds.map(id => parseInt(id)),
        type,
        title.trim(),
        message.trim(),
        link.trim() || null
      );
      setSuccessMessage(`✅ ${result.sent} notification(s) envoyée(s) avec succès${result.failed > 0 ? `, ${result.failed} échec(s)` : ''} !`);
      setTitle('');
      setMessage('');
      setLink('');
      setUserIds([]);
      setType('info');
    } catch (error: any) {
      console.error('Erreur envoi notification groupée:', error);
      setErrorMessage(error.message || 'Erreur lors de l\'envoi des notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sélection utilisateurs (multiple) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-300">Destinataires *</label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {userIds.length === users.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        {loadingUsers ? (
          <div className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Chargement des utilisateurs...</span>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-lg bg-slate-700 p-3">
            {users.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun utilisateur disponible</p>
            ) : (
              users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-2 p-2 hover:bg-slate-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={userIds.includes(user.id.toString())}
                    onChange={() => handleUserToggle(user.id.toString())}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-200">
                    {user.denomination_sociale 
                      ? `${user.denomination_sociale} - ${user.prenom} ${user.nom}`
                      : `${user.prenom} ${user.nom}`
                    } ({user.email})
                  </span>
                </label>
              ))
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          {userIds.length} utilisateur(s) sélectionné(s)
        </p>
      </div>

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
          placeholder="Ex: Notification importante"
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
          disabled={sending || !title.trim() || !message.trim() || userIds.length === 0}
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
              <span>Envoyer les notifications</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Composant pour l'historique des notifications
const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const limit = 20;
  const { showError: showAlertError } = useAlert();

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsAPI.getHistory(limit, page * limit);
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error('Erreur chargement historique:', error);
      const errorMessage = error?.error || error?.message || 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      showAlertError(errorMessage);
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'announcement': return '📢';
      case 'formation_pending': return '🎓';
      case 'document': return '📄';
      case 'product': return '📦';
      case 'reservation': return '💰';
      case 'reservation_public': return '💰';
      case 'email': return '📧';
      case 'password_reset': return '🔐';
      case 'user_created': return '👤';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'announcement': return 'text-purple-400';
      case 'email': return 'text-cyan-400';
      case 'password_reset': return 'text-orange-400';
      case 'user_created': return 'text-indigo-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-center">
            <span className="font-semibold">Erreur:</span> {error}
          </p>
          <button
            onClick={loadHistory}
            className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-slate-400 text-center py-8">Aucune notification envoyée</p>
      ) : (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-slate-700 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getTypeIcon(notif.type)}</span>
                      <h4 className={`font-semibold ${getTypeColor(notif.type)}`}>{notif.title}</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{notif.message}</p>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        <span className="font-semibold">Destinataire:</span> {notif.recipient_display}
                      </div>
                      <div>
                        <span className="font-semibold">Date:</span>{' '}
                        {new Date(notif.created_at).toLocaleString('fr-FR')}
                      </div>
                      {notif.link && (
                        <div>
                          <span className="font-semibold">Lien:</span>{' '}
                          <a href={notif.link} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {notif.link}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-600">
              <span className="text-sm text-slate-400">
                Page {page + 1} sur {Math.ceil(total / limit)} ({total} notification{total > 1 ? 's' : ''})
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / limit) - 1, page + 1))}
                  disabled={page >= Math.ceil(total / limit) - 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CMSManagementPage;

