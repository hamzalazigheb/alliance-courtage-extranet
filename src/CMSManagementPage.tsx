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
  contact?: {
    phone: string;
    email: string;
  };
}

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
  const [activePage, setActivePage] = useState<'home' | 'gamme-produits' | 'formations' | 'produits-structures' | 'rencontres' | 'reglementaire' | 'gamme-financiere' | 'partenaires' | 'notifications'>('home');
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
    file: null as File | null
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
    
    // Réinitialiser le workflow quand on change de page
    if (activePage === 'gamme-produits') {
      setWorkflowStep('select');
      setNewlyAddedProduct(null);
    }
    
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
      
      const endpoint = activePage === 'home' ? 'home' : 'gamme-produits';
      
      // Préparer le payload de manière optimisée
      // Afficher un indicateur de progression pour les gros contenus
      let payload: string;
      try {
        if (activePage === 'home') {
          payload = JSON.stringify({ content: JSON.stringify(content) });
        } else {
          // Pour gamme-produits, vérifier la taille avant de stringify
          console.log('🔄 Préparation du payload pour gamme-produits...');
          payload = JSON.stringify({ content: JSON.stringify(gpContent) });
          console.log('✅ Payload préparé avec succès');
        }
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
      if (activePage === 'gamme-produits') {
        // Faire les logs de manière asynchrone pour ne pas bloquer
        setTimeout(() => {
          console.log('💾 Sauvegarde Gamme Produits en cours...');
          console.log(`📦 Taille du payload: ${payloadSizeMB.toFixed(2)} MB`);
        
          // Compter les documents en arrière-plan
        let totalDocuments = 0;
        Object.keys(gpContent.products).forEach((clientKey) => {
          Object.keys(gpContent.products[clientKey as ClientId]).forEach((familyKey) => {
            const products = gpContent.products[clientKey as ClientId][familyKey as ProdId];
            if (Array.isArray(products)) {
              products.forEach((p: Product) => {
                if (p.documents && Array.isArray(p.documents)) {
                  totalDocuments += p.documents.length;
                }
              });
            }
          });
        });
        console.log(`📊 Total documents à sauvegarder: ${totalDocuments}`);
        }, 0);
      }

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

  // Détecter SEULEMENT les changements (nouveau/modifié/supprimé)
  const detectChanges = () => {
    const changes: {
      clientType: ClientId;
      family: ProdId;
      products: Product[];
    }[] = [];

    // Comparer chaque famille
    (['particulier', 'professionnel', 'entreprise'] as ClientId[]).forEach(clientType => {
      (['epargne', 'retraite', 'prevoyance', 'sante', 'cif'] as ProdId[]).forEach(family => {
        const currentProducts = gpContent.products[clientType]?.[family] || [];
        const initialProducts = initialGpContent.products[clientType]?.[family] || [];

        // Vérifier si cette famille a changé
        const currentJson = JSON.stringify(currentProducts);
        const initialJson = JSON.stringify(initialProducts);

        if (currentJson !== initialJson) {
          changes.push({
            clientType,
            family,
            products: currentProducts
          });
          console.log(`🔄 Changement détecté: ${clientType}/${family} (${currentProducts.length} produits)`);
        }
      });
    });

    return changes;
  };

  // Sauvegarder SEULEMENT les changements (incremental save!)
  const saveChangesOnly = async () => {
    if (activePage !== 'gamme-produits') {
      return saveContent(); // Fallback pour autres pages
    }

    try {
      setSaving(true);
      setSuccessMessage('');

      const changes = detectChanges();

      if (changes.length === 0) {
        showSuccess('✅ Aucun changement à sauvegarder');
        setSaving(false);
        return;
      }

      console.log(`💾 Sauvegarde incrémentale: ${changes.length} famille(s) modifiée(s)`);

      let totalSize = 0;
      for (const change of changes) {
        const changeSize = JSON.stringify(change.products).length / 1024 / 1024;
        totalSize += changeSize;

        console.log(`💾 Sauvegarde ${change.clientType}/${change.family} (${changeSize.toFixed(2)} MB)...`);

        const response = await fetch(buildAPIURL('/cms/gamme-produits/family'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: JSON.stringify({
            clientType: change.clientType,
            family: change.family,
            products: change.products
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Erreur sauvegarde ${change.family}`);
        }

        console.log(`✅ ${change.clientType}/${change.family} sauvegardé`);
      }

      // Mettre à jour l'état initial après sauvegarde réussie
      setInitialGpContent(JSON.parse(JSON.stringify(gpContent)));

      const message = changes.length === 1
        ? `✅ 1 famille sauvegardée (${totalSize.toFixed(2)} MB)`
        : `✅ ${changes.length} familles sauvegardées (${totalSize.toFixed(2)} MB total)`;

      setSuccessMessage(message);
      showSuccess(message);

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde incrémentale:', error);
      showError(error.message || 'Erreur lors de la sauvegarde');
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
              onClick={activePage === 'gamme-produits' ? saveChangesOnly : saveContent}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              title={activePage === 'gamme-produits' ? 'Sauvegarder uniquement les changements (rapide!)' : 'Sauvegarder le contenu'}
            >
              {saving ? '💾 Sauvegarde...' : (activePage === 'gamme-produits' ? '💾 Enregistrer les changements' : '💾 Enregistrer')}
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
        {activePage === 'gamme-produits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Gamme Produits</h3>
              <button
                onClick={() => {
                  setWorkflowStep('select');
                  setNewlyAddedProduct(null);
                }}
                className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                + Ajouter un produit
              </button>
            </div>
            
            {/* Indicateur d'étapes - seulement visible quand on ajoute un produit */}
            {workflowStep !== 'select' && (
              <div className="flex items-center justify-center space-x-4 mb-6 bg-slate-800 rounded-lg p-4">
                <div className={`flex items-center ${workflowStep === 'select' ? 'text-emerald-400' : workflowStep === 'add-product' || workflowStep === 'manage-documents' ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'select' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    1
                  </div>
                  <span className="ml-2 font-medium">Sélection</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-600"></div>
                <div className={`flex items-center ${workflowStep === 'add-product' ? 'text-emerald-400' : workflowStep === 'manage-documents' ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'add-product' ? 'bg-emerald-500 text-white' : workflowStep === 'manage-documents' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Produit</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-600"></div>
                <div className={`flex items-center ${workflowStep === 'manage-documents' ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'manage-documents' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    3
                  </div>
                  <span className="ml-2 font-medium">Documents</span>
                </div>
              </div>
            )}

            {/* ÉTAPE 1: Sélection */}
            {workflowStep === 'select' && (
              <div className="bg-slate-800 rounded-xl p-6 space-y-6">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-white mb-2">Ajouter un nouveau produit</h4>
                  <p className="text-sm text-slate-400">Sélectionnez pour qui et dans quelle catégorie vous voulez ajouter ce produit</p>
                </div>
            
            {/* Choix client / type de produit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-300">Type(s) de client (multi-sélection)</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClients(['particulier', 'professionnel', 'entreprise']);
                      }}
                      className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClients([]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <label className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes('particulier')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClients([...selectedClients, 'particulier']);
                        } else {
                          setSelectedClients(selectedClients.filter(c => c !== 'particulier'));
                        }
                        // Réinitialiser les familles si aucun client n'est sélectionné
                        if (selectedClients.length === 1 && selectedClients[0] === 'particulier' && !e.target.checked) {
                          setSelectedFamilies([]);
                        } else if (e.target.checked && selectedFamilies.length === 0) {
                          const firstFamily = Object.keys(gpContent.products['particulier'])[0];
                          if (firstFamily) {
                            setSelectedFamilies([firstFamily]);
                          }
                        }
                      }}
                      className="w-4 h-4 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-slate-300 text-sm">Particulier</span>
                  </label>
                  <label className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes('professionnel')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClients([...selectedClients, 'professionnel']);
                        } else {
                          setSelectedClients(selectedClients.filter(c => c !== 'professionnel'));
                        }
                        // Réinitialiser les familles si aucun client n'est sélectionné
                        if (selectedClients.length === 1 && selectedClients[0] === 'professionnel' && !e.target.checked) {
                          setSelectedFamilies([]);
                        } else if (e.target.checked && selectedFamilies.length === 0) {
                          const firstFamily = Object.keys(gpContent.products['professionnel'])[0];
                          if (firstFamily) {
                            setSelectedFamilies([firstFamily]);
                          }
                        }
                      }}
                      className="w-4 h-4 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-slate-300 text-sm">Professionnel</span>
                  </label>
                  <label className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes('entreprise')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClients([...selectedClients, 'entreprise']);
                        } else {
                          setSelectedClients(selectedClients.filter(c => c !== 'entreprise'));
                        }
                        // Réinitialiser les familles si aucun client n'est sélectionné
                        if (selectedClients.length === 1 && selectedClients[0] === 'entreprise' && !e.target.checked) {
                          setSelectedFamilies([]);
                        } else if (e.target.checked && selectedFamilies.length === 0) {
                          const firstFamily = Object.keys(gpContent.products['entreprise'])[0];
                          if (firstFamily) {
                            setSelectedFamilies([firstFamily]);
                          }
                        }
                      }}
                      className="w-4 h-4 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-slate-300 text-sm">Entreprise</span>
                  </label>
                </div>
                {selectedClients.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Sélectionnez au moins un type de client</p>
                )}
                {selectedClients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400">Sélectionnés:</span>
                    {selectedClients.map((client) => (
                      <span key={client} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded capitalize">
                        {client}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-300">Famille(s) de produit (multi-sélection)</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedClients.length > 0) {
                          const allFamilies = Object.keys(gpContent.products[selectedClients[0]]);
                          setSelectedFamilies(allFamilies);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFamilies([]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600 max-h-48 overflow-y-auto">
                  {selectedClients.length > 0 && Object.keys(gpContent.products[selectedClients[0]]).map((k) => (
                    <label key={k} className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                      <input
                        type="checkbox"
                        checked={selectedFamilies.includes(k)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFamilies([...selectedFamilies, k]);
                          } else {
                            setSelectedFamilies(selectedFamilies.filter(f => f !== k));
                          }
                        }}
                        className="w-4 h-4 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-slate-300 text-sm">{k}</span>
                    </label>
                  ))}
                </div>
                {selectedFamilies.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Sélectionnez au moins une famille pour ajouter des produits</p>
                )}
                {selectedFamilies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400">Sélectionnées:</span>
                    {selectedFamilies.map((fam) => (
                      <span key={fam} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                        {fam}
                      </span>
                    ))}
                  </div>
                )}
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
                    // Ajouter la nouvelle famille à la sélection si aucune n'est sélectionnée
                    if (selectedFamilies.length === 0) {
                      setSelectedFamilies([name]);
                    }
                    setNewFamilyName('');
                  }}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  + Ajouter la famille
                </button>
                <button
                  onClick={() => {
                    const families = selectedClients.length > 0 
                      ? Object.keys(gpContent.products[selectedClients[0]])
                      : [];
                    if (families.length <= 1) {
                      showWarning('Il doit rester au moins une famille de produit');
                      return; // garder au moins une famille
                    }
                        if (selectedFamilies.length === 0) {
                          showWarning('Veuillez sélectionner la famille à supprimer');
                          return;
                        }
                        if (selectedFamilies.length > 1) {
                          showWarning('Veuillez sélectionner une seule famille à supprimer');
                          return;
                        }
                        const familyToDelete = selectedFamilies[0];
                        const next: GPContent = JSON.parse(JSON.stringify(gpContent));
                        ['particulier','professionnel','entreprise'].forEach((c) => {
                          delete (next.products[c as ClientId] as any)[familyToDelete];
                        });
                        const remaining = selectedClients.length > 0 
                          ? Object.keys(next.products[selectedClients[0]]) as ProdId[]
                          : [];
                    setGpContent(next);
                    // Sélectionner la première famille restante
                    if (remaining.length > 0) {
                      setSelectedFamilies([remaining[0]]);
                    } else {
                      setSelectedFamilies([]);
                    }
                  }}
                  disabled={selectedFamilies.length !== 1}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                >
                  Supprimer la famille sélectionnée
                </button>
              </div>
            </div>

                {/* Bouton continuer */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      if (selectedClients.length === 0) {
                        showWarning('Veuillez sélectionner au moins un type de client');
                        return;
                      }
                      if (selectedFamilies.length === 0) {
                        showWarning('Veuillez sélectionner au moins une famille');
                        return;
                      }
                      setWorkflowStep('add-product');
                    }}
                    disabled={selectedClients.length === 0 || selectedFamilies.length === 0}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                  >
                    Continuer → Ajouter le produit
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2: Ajouter le produit */}
            {workflowStep === 'add-product' && (
              <div className="bg-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">Informations du produit</h4>
                    <p className="text-sm text-slate-400 mt-1">Remplissez les détails du produit à ajouter</p>
                  </div>
                  <button
                    onClick={() => setWorkflowStep('select')}
                    className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    ← Retour
                  </button>
                </div>

                {/* Afficher les sélections */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm text-slate-300 font-medium">Type(s) de client:</span>
                    {selectedClients.map(c => (
                      <span key={c} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded capitalize">{c}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-300 font-medium">Famille(s):</span>
                    {selectedFamilies.map(f => (
                      <span key={f} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Formulaire produit */}
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Nom du produit *</label>
                      <input
                        type="text"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                        placeholder="Ex: Assurance vie, PERP..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                      <textarea
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                      rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 resize-none"
                        placeholder="Décrivez le produit, ses avantages, caractéristiques..."
                      />
                    </div>
                    <button
                      onClick={() => {
                      try {
                        const name = newProductName.trim();
                        if (!name) {
                          showWarning('Le nom du produit est obligatoire');
                          return;
                        }
                        if (selectedClients.length === 0) {
                          showWarning('Veuillez sélectionner au moins un type de client');
                          return;
                        }
                        if (selectedFamilies.length === 0) {
                          showWarning('Veuillez sélectionner au moins une famille de produit');
                          return;
                        }
                        
                        // Créer une copie profonde pour éviter les mutations
                        const next = JSON.parse(JSON.stringify(gpContent));
                        const newProduct: Product = {
                          name: name,
                          description: newProductDescription.trim(),
                          documents: [] // Initialiser les documents comme tableau vide
                        };
                        
                        let productAdded = false;
                        let productUpdated = false;
                        
                        // Ajouter le produit à tous les clients sélectionnés et toutes les familles sélectionnées
                        selectedClients.forEach((client) => {
                          if (!next.products[client]) {
                            next.products[client] = {} as any;
                          }
                          selectedFamilies.forEach((fam) => {
                            if (!next.products[client][fam as ProdId]) {
                              next.products[client][fam as ProdId] = [];
                            }
                            
                            // Vérifier si le produit existe déjà (par nom et description)
                            const existingIndex = next.products[client][fam as ProdId].findIndex(
                              (p: Product) => p.name === name && (p.description || '') === (newProduct.description || '')
                            );
                            
                            if (existingIndex === -1) {
                              // Ajouter un nouveau produit (créer une copie pour éviter les références partagées)
                              next.products[client][fam as ProdId] = [
                                ...next.products[client][fam as ProdId], 
                                { ...newProduct }
                              ];
                              productAdded = true;
                            } else {
                              // Mettre à jour le produit existant
                              next.products[client][fam as ProdId][existingIndex] = {
                                ...next.products[client][fam as ProdId][existingIndex],
                                ...newProduct,
                                // Préserver les documents existants
                                documents: next.products[client][fam as ProdId][existingIndex].documents || []
                              };
                              productUpdated = true;
                            }
                          });
                        });
                        
                        setGpContent(next);
                        
                        // Après ajout réussi
                        setNewlyAddedProduct({
                          name: name,
                          family: selectedFamilies[0], // Prendre la première famille
                          clients: selectedClients
                        });
                        setNewProductName('');
                        setNewProductDescription('');
                        setWorkflowStep('manage-documents'); // Passer à l'étape 3
                        
                        if (productUpdated && !productAdded) {
                          showSuccess('Produit mis à jour ! Vous pouvez maintenant gérer ses documents.');
                        } else {
                          showSuccess('Produit ajouté ! Vous pouvez maintenant ajouter des documents.');
                        }
                      } catch (error) {
                        console.error('Erreur lors de l\'ajout du produit:', error);
                        showError('Erreur lors de l\'ajout du produit');
                      }
                    }}
                    disabled={!newProductName.trim()}
                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 text-white rounded-lg font-medium"
                    >
                    ✓ Ajouter le produit
                    </button>
                  </div>
              </div>
            )}

            {/* ÉTAPE 3: Gérer les documents */}
            {workflowStep === 'manage-documents' && (
              <div className="bg-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">Ajouter des documents</h4>
                    <p className="text-sm text-slate-400 mt-1">Gérez les documents associés à vos produits</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setNewlyAddedProduct(null);
                        setWorkflowStep('select');
                      }}
                      className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                      ← Nouveau produit
                    </button>
                    <button
                      onClick={() => setWorkflowStep('add-product')}
                      className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                      ← Retour
                    </button>
                </div>
              </div>

                {/* Si un produit vient d'être ajouté, le mettre en évidence */}
                {newlyAddedProduct && (
                  <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-4">
                    <p className="text-emerald-300 font-medium mb-2">✓ Produit "{newlyAddedProduct.name}" ajouté avec succès !</p>
                    <p className="text-sm text-slate-300">Vous pouvez maintenant ajouter des documents à ce produit.</p>
                  </div>
                )}

                {/* Résumé des sélections */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-sm text-slate-400">Type(s) de client:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedClients.map(c => (
                          <span key={c} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded capitalize">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Famille(s):</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFamilies.map(f => (
                          <span key={f} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des produits avec gestion de documents */}
              <div className="space-y-4">
                {selectedClients.length === 0 ? (
                  <div className="text-slate-300 text-sm">⚠️ Sélectionnez au moins un type de client pour voir les produits</div>
                ) : selectedFamilies.length === 0 ? (
                  <div className="text-slate-300 text-sm">⚠️ Sélectionnez au moins une famille pour voir les produits</div>
                ) : (
                  selectedFamilies.map((fam) => {
                    const products = selectedClients.length > 0 
                      ? gpContent.products[selectedClients[0]][fam as ProdId] || []
                      : [];
                    // Debug: vérifier les documents
                    console.log(`🔍 Affichage produits pour ${selectedClients[0]}/${fam}:`, products.length, 'produit(s)');
                    console.log(`🔍 État complet de gpContent.products[${selectedClients[0]}][${fam}]:`, JSON.stringify(gpContent.products[selectedClients[0]]?.[fam as ProdId], null, 2));
                    products.forEach((p: Product, idx: number) => {
                      console.log(`  📦 Produit ${idx}: "${p.name}"`, {
                        hasDocuments: !!p.documents,
                        isArray: Array.isArray(p.documents),
                        documentsLength: p.documents && Array.isArray(p.documents) ? p.documents.length : 0,
                        documents: p.documents,
                        fullProduct: JSON.stringify(p, null, 2).substring(0, 500)
                      });
                      if (p.documents && Array.isArray(p.documents) && p.documents.length > 0) {
                        console.log(`  ✅ Produit "${p.name}" a ${p.documents.length} document(s):`, p.documents.map((d: ProductDocument) => ({ id: d.id, title: d.title, file_name: d.file_name })));
                      } else {
                        console.warn(`  ⚠️ Produit "${p.name}" n'a PAS de documents ou tableau vide`);
                      }
                    });
                    return (
                      <div key={fam} className="border border-slate-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-semibold text-sm">Famille: <span className="text-emerald-400">{fam}</span></h4>
                            {selectedClients.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedClients.map((client) => (
                                  <span key={client} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded capitalize">
                                    {client}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                        </div>
                        {products.length === 0 ? (
                          <div className="text-slate-400 text-sm italic">Aucun produit dans cette famille</div>
                        ) : (
                          <div className="space-y-3">
                            {products.map((p, idx) => {
                              // Log pour chaque produit lors du rendu
                              console.log(`🎨 Rendu produit "${p.name}" (idx: ${idx}):`, {
                                hasDocuments: !!p.documents,
                                isArray: Array.isArray(p.documents),
                                documentsCount: p.documents && Array.isArray(p.documents) ? p.documents.length : 0
                              });
                              return (
                              <div key={`${p.name}-${fam}-${idx}`} data-product={`${p.name}-${fam}`} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                {/* En-tête du produit avec actions */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="text-white font-semibold text-base mb-1">{p.name}</h5>
                                    {p.description && (
                                      <p className="text-sm text-slate-400 mb-2">{p.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <span>Famille: <span className="text-emerald-400">{fam}</span></span>
                                      <span>•</span>
                                      <span>{p.documents && Array.isArray(p.documents) ? p.documents.length : 0} document{p.documents && Array.isArray(p.documents) && p.documents.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 ml-4">
                                    <button
                                      onClick={() => {
                                        console.log('🔍 Ouvrir modal pour produit:', p.name, 'Famille:', fam, 'Documents actuels:', p.documents);
                                        setEditingProductDocument({ 
                                          productName: p.name, 
                                          family: fam,
                                          client: selectedClients[0]
                                        });
                                        setShowDocumentModal(true);
                                      }}
                                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2"
                                      title="Attacher/Détacher des documents"
                                    >
                                      <span>📎 Attacher Documents</span>
                                      <span className="bg-blue-400 text-white px-2 py-0.5 rounded-full text-xs font-bold">{p.documents?.length || 0}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                                          return;
                                        }
                                        try {
                                      const next = JSON.parse(JSON.stringify(gpContent)); // Deep copy
                                          // Supprimer uniquement le produit à l'index idx dans les clients sélectionnés
                                      selectedClients.forEach((client) => {
                                            if (next.products[client] && next.products[client][fam as ProdId] && Array.isArray(next.products[client][fam as ProdId])) {
                                              // Vérifier que l'index existe et correspond au produit
                                              if (idx >= 0 && idx < next.products[client][fam as ProdId].length) {
                                                const productAtIdx = next.products[client][fam as ProdId][idx];
                                                // Double vérification : s'assurer que c'est le bon produit
                                                if (productAtIdx && productAtIdx.name === p.name) {
                                                  next.products[client][fam as ProdId].splice(idx, 1);
                                                }
                                              }
                                        }
                                      });
                                      setGpContent(next);
                                          showSuccess('Produit supprimé avec succès');
                                        } catch (error) {
                                          console.error('Erreur lors de la suppression:', error);
                                          showError('Erreur lors de la suppression du produit');
                                        }
                                    }}
                                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                                    >
                                      🗑️ Supprimer
                                    </button>
                                  </div>
                                </div>

                                {/* Section édition (collapsible ou toujours visible) */}
                                <div className="mt-4 pt-4 border-t border-slate-600">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="text-sm font-semibold text-slate-300">✏️ Modifier le produit</h6>
                                  <button
                                    onClick={() => {
                                        setWorkflowStep('select');
                                        showSuccess('Modifications enregistrées ! N\'oubliez pas de sauvegarder le contenu.');
                                      }}
                                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      ✓ Terminé
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-300 mb-1">Modifier le nom</label>
                                      <input
                                        type="text"
                                        defaultValue={p.name}
                                        onBlur={(e) => {
                                          try {
                                            const newName = e.target.value.trim();
                                            if (!newName) {
                                              showWarning('Le nom du produit ne peut pas être vide');
                                              e.target.value = p.name;
                                        return;
                                      }
                                            if (newName === p.name) {
                                              return; // Pas de changement
                                      }
                                      const next = JSON.parse(JSON.stringify(gpContent)); // Deep copy
                                            // Mettre à jour le produit dans TOUS les clients
                                            ['particulier', 'professionnel', 'entreprise'].forEach((client) => {
                                              if (next.products[client] && next.products[client][fam as ProdId] && Array.isArray(next.products[client][fam as ProdId])) {
                                                if (idx >= 0 && idx < next.products[client][fam as ProdId].length) {
                                                  const productAtIdx = next.products[client][fam as ProdId][idx];
                                                  if (productAtIdx && productAtIdx.name === p.name) {
                                                    next.products[client][fam as ProdId][idx] = {
                                                      ...productAtIdx,
                                                      name: newName
                                                    };
                                                  }
                                                }
                                        }
                                      });
                                      setGpContent(next);
                                            showSuccess('Nom du produit modifié');
                                          } catch (error) {
                                            console.error('Erreur lors de la mise à jour du nom:', error);
                                            showError('Erreur lors de la mise à jour du nom');
                                          }
                                    }}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                                        placeholder="Nom du produit"
                                      />
                                </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-300 mb-1">Modifier la description</label>
                                <textarea
                                        defaultValue={p.description}
                                        onBlur={(e) => {
                                          try {
                                            const newDescription = e.target.value.trim();
                                            if (newDescription === p.description) {
                                              return; // Pas de changement
                                            }
                                      const next = JSON.parse(JSON.stringify(gpContent)); // Deep copy
                                            // Mettre à jour le produit dans TOUS les clients
                                            ['particulier', 'professionnel', 'entreprise'].forEach((client) => {
                                              if (next.products[client] && next.products[client][fam as ProdId] && Array.isArray(next.products[client][fam as ProdId])) {
                                                if (idx >= 0 && idx < next.products[client][fam as ProdId].length) {
                                                  const productAtIdx = next.products[client][fam as ProdId][idx];
                                                  if (productAtIdx && productAtIdx.name === p.name) {
                                          next.products[client][fam as ProdId][idx] = {
                                                      ...productAtIdx,
                                            description: newDescription
                                          };
                                                  }
                                                }
                                        }
                                      });
                                      setGpContent(next);
                                            showSuccess('Description du produit modifiée');
                                          } catch (error) {
                                            console.error('Erreur lors de la mise à jour de la description:', error);
                                            showError('Erreur lors de la mise à jour de la description');
                                          }
                                    }}
                                        rows={3}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm resize-none"
                                  placeholder="Description du produit..."
                                />
                                    </div>
                                    <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                                      <label className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-3">
                                        <span className="text-lg">👥</span>
                                        <span>Types de clients associés</span>
                                      </label>
                                      <div className="grid grid-cols-1 gap-2">
                                        {[
                                          { id: 'particulier', label: 'Particulier', icon: '👤', color: 'blue' },
                                          { id: 'professionnel', label: 'Professionnel', icon: '💼', color: 'purple' },
                                          { id: 'entreprise', label: 'Entreprise', icon: '🏢', color: 'orange' }
                                        ].map(({ id: clientType, label, icon, color }) => {
                                          // Vérifier si le produit existe pour ce type de client
                                          const existsInClient = gpContent.products[clientType as ClientId]?.[fam as ProdId]?.some(
                                            (prod: Product) => {
                                              return prod.name === p.name && 
                                                     (prod.description || '') === (p.description || '');
                                            }
                                          );
                                          
                                          const bgColor = existsInClient 
                                            ? `bg-${color}-500/20 border-${color}-500/40` 
                                            : 'bg-slate-700/50 border-slate-600/50';
                                          
                                          return (
                                            <label 
                                              key={clientType} 
                                              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${bgColor} ${existsInClient ? 'hover:bg-' + color + '-500/30' : 'hover:bg-slate-600/50'}`}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <input
                                                  type="checkbox"
                                                  checked={existsInClient || false}
                                                  onChange={(e) => {
                                                    try {
                                                      const next = JSON.parse(JSON.stringify(gpContent));
                                                      const currentClientProducts = next.products[selectedClients[0] as ClientId]?.[fam as ProdId] || [];
                                                      
                                                      if (idx >= 0 && idx < currentClientProducts.length) {
                                                        const productToModify = { ...currentClientProducts[idx] };
                                                        
                                                        if (e.target.checked) {
                                                          if (!next.products[clientType as ClientId]) {
                                                            next.products[clientType as ClientId] = {} as any;
                                                          }
                                                          if (!next.products[clientType as ClientId][fam as ProdId]) {
                                                            next.products[clientType as ClientId][fam as ProdId] = [];
                                                          }
                                                          
                                                          const existingIndex = next.products[clientType as ClientId][fam as ProdId].findIndex(
                                                            (prod: Product) => prod.name === productToModify.name && 
                                                            (prod.description || '') === (productToModify.description || '')
                                                          );
                                                          
                                                          if (existingIndex === -1) {
                                                            next.products[clientType as ClientId][fam as ProdId].push({
                                                              ...productToModify,
                                                              documents: productToModify.documents ? [...productToModify.documents] : []
                                                            });
                                                          }
                                                        } else {
                                                          if (next.products[clientType as ClientId]?.[fam as ProdId]) {
                                                            const productIndex = next.products[clientType as ClientId][fam as ProdId].findIndex(
                                                              (prod: Product) => prod.name === productToModify.name && 
                                                              (prod.description || '') === (productToModify.description || '')
                                                            );
                                                            
                                                            if (productIndex !== -1) {
                                                              next.products[clientType as ClientId][fam as ProdId].splice(productIndex, 1);
                                                            }
                                                          }
                                                        }
                                                        
                                                        setGpContent(next);
                                                      }
                                                    } catch (error) {
                                                      console.error('Erreur lors de la modification du type de client:', error);
                                                      showError('❌ Erreur lors de la modification');
                                                    }
                                                  }}
                                                  className="w-5 h-5 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500 focus:ring-2"
                                                />
                                                <span className="text-xl">{icon}</span>
                                                <span className="text-sm font-medium text-white">{label}</span>
                                              </div>
                                              {existsInClient && (
                                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                                                  ✓ Actif
                                                </span>
                                              )}
                                            </label>
                                          );
                                        })}
                                      </div>
                                      <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <p className="text-xs text-blue-200 flex items-start gap-2">
                                          <span className="text-sm">💡</span>
                                          <span>Cochez pour rendre ce produit disponible aux différents types de clients. Les documents seront copiés automatiquement.</span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Section Documents */}
                                <div className="mt-4 pt-4 border-t border-slate-600">
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-slate-300">
                                      Documents associés
                                      {p.documents && (
                                        <span className="ml-2 text-xs text-slate-400">
                                          ({Array.isArray(p.documents) ? p.documents.length : 0})
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                  {(() => {
                                    // Vérifier et afficher les documents
                                    if (!p.documents || !Array.isArray(p.documents) || p.documents.length === 0) {
                                      return (
                                        <div className="bg-slate-600/20 rounded-lg p-3 text-center">
                                          <p className="text-sm text-slate-400">Aucun document associé</p>
                                          <p className="text-xs text-slate-500 mt-1">Cliquez sur "📎 Attacher Documents" pour en ajouter</p>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="space-y-2">
                                        {p.documents.map((doc: ProductDocument) => {
                                          if (!doc || !doc.id) {
                                            console.error('Document invalide:', doc);
                                            return null;
                                          }
                                          return (
                                            <div key={doc.id} className="flex items-center justify-between bg-slate-600/30 rounded-lg p-3 border border-slate-600">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{doc.title || doc.file_name || 'Document sans nom'}</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                  {(doc.file_size / 1024).toFixed(1)} KB • {doc.file_type || 'Type inconnu'}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2 ml-3">
                                                <a
                                                  href={`data:${doc.file_type || 'application/octet-stream'};base64,${doc.file_content}`}
                                                  download={doc.file_name}
                                                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                                                  title="Télécharger"
                                                >
                                                  📥 Télécharger
                                                </a>
                                                <button
                                                  onClick={() => {
                                                    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                                                      return;
                                                    }
                                                    try {
                                                    const next = JSON.parse(JSON.stringify(gpContent)); // Deep copy
                                                      // Supprimer le document dans tous les clients sélectionnés en utilisant l'index
                                                    selectedClients.forEach((client) => {
                                                        if (next.products[client] && next.products[client][fam as ProdId] && Array.isArray(next.products[client][fam as ProdId])) {
                                                          // Utiliser l'index idx pour trouver le produit exact
                                                          if (idx >= 0 && idx < next.products[client][fam as ProdId].length) {
                                                            const productAtIdx = next.products[client][fam as ProdId][idx];
                                                            // Double vérification : s'assurer que c'est le bon produit
                                                            if (productAtIdx && productAtIdx.name === p.name) {
                                                              if (!productAtIdx.documents) {
                                                                productAtIdx.documents = [];
                                                              }
                                                              // Supprimer le document par son ID
                                                              productAtIdx.documents = productAtIdx.documents.filter(
                                                            (d: ProductDocument) => d.id !== doc.id
                                                              );
                                                            }
                                                          }
                                                      }
                                                    });
                                                    setGpContent(next);
                                                      showSuccess('Document supprimé avec succès');
                                                    } catch (error) {
                                                      console.error('Erreur lors de la suppression du document:', error);
                                                      showError('Erreur lors de la suppression du document');
                                                    }
                                                  }}
                                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                                                  title="Supprimer"
                                                >
                                                  🗑️ Supprimer
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              </div>
            )}

            {/* LISTE DE TOUS LES PRODUITS - Toujours visible */}
            <div className="bg-slate-800 rounded-xl p-6 space-y-6 mt-8">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">📦 Tous les produits</h4>
                <div className="text-sm text-slate-400">
                  {(() => {
                    let totalProducts = 0;
                    ['particulier', 'professionnel', 'entreprise'].forEach((client) => {
                      Object.keys(gpContent.products[client as ClientId] || {}).forEach((fam) => {
                        const products = gpContent.products[client as ClientId][fam as ProdId] || [];
                        totalProducts += products.length;
                      });
                    });
                    return `${totalProducts} produit${totalProducts > 1 ? 's' : ''} au total`;
                  })()}
                </div>
              </div>

              {/* Filtres rapides */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setClientFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    clientFilter === 'all'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  📦 Tous les types
                </button>
                <button
                  onClick={() => setClientFilter('particulier')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    clientFilter === 'particulier'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  👤 Particulier
                </button>
                <button
                  onClick={() => setClientFilter('professionnel')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    clientFilter === 'professionnel'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  💼 Professionnel
                </button>
                <button
                  onClick={() => setClientFilter('entreprise')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    clientFilter === 'entreprise'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  🏢 Entreprise
                </button>
              </div>

              {/* Liste de tous les produits par client et famille */}
              <div className="space-y-6">
                {['particulier', 'professionnel', 'entreprise']
                  .filter(client => clientFilter === 'all' || clientFilter === client)
                  .map((client) => {
                  const clientProducts = gpContent.products[client as ClientId] || {};
                  const families = Object.keys(clientProducts);
                  const hasProducts = families.some(fam => {
                    const products = clientProducts[fam as ProdId] || [];
                    return products.length > 0;
                  });

                  if (!hasProducts) return null;
                  
                  // Icône et couleur selon le type de client
                  const clientConfig = {
                    particulier: { icon: '👤', color: 'bg-blue-500' },
                    professionnel: { icon: '💼', color: 'bg-purple-500' },
                    entreprise: { icon: '🏢', color: 'bg-orange-500' }
                  }[client] || { icon: '📦', color: 'bg-blue-500' };

                  return (
                    <div key={client} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h5 className="text-white font-semibold mb-4 capitalize flex items-center">
                        <span className={`w-2 h-2 ${clientConfig.color} rounded-full mr-2`}></span>
                        <span className="text-lg mr-2">{clientConfig.icon}</span>
                        {client}
                      </h5>
                      <div className="space-y-4">
                        {families.map((fam) => {
                          const products = clientProducts[fam as ProdId] || [];
                          if (products.length === 0) return null;

                          return (
                            <div key={fam} className="bg-slate-600/20 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-emerald-400 font-medium text-sm">Famille: {fam}</h6>
                                <span className="text-xs text-slate-400">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {products.map((p: Product, idx: number) => {
                                  // Créer un identifiant unique pour ce produit dans ce contexte
                                  const productKey = `${client}-${fam}-${idx}`;
                                  const isExpanded = expandedProducts[productKey] || false;
                                  
                                  return (
                                  <div key={productKey} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                                    <div className="mb-3">
                                      <h6 className="text-white font-semibold text-base mb-1">{p.name}</h6>
                                      {p.description && (
                                        <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                                      <span>📄 {p.documents && Array.isArray(p.documents) ? p.documents.length : 0} document{p.documents && Array.isArray(p.documents) && p.documents.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    
                                    {/* Section d'édition pour la liste globale */}
                                    {editingGlobalProduct === productKey && (
                                      <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30 space-y-3">
                                        <div>
                                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du produit</label>
                                          <input
                                            type="text"
                                            defaultValue={p.name}
                                            onBlur={(e) => {
                                              try {
                                                const newName = e.target.value.trim();
                                                if (!newName) {
                                                  showWarning('Le nom du produit ne peut pas être vide');
                                                  e.target.value = p.name;
                                                  return;
                                                }
                                                if (newName === p.name) return;
                                                
                                                const next = JSON.parse(JSON.stringify(gpContent));
                                                ['particulier', 'professionnel', 'entreprise'].forEach((c) => {
                                                  if (next.products[c as ClientId]?.[fam as ProdId]) {
                                                    const products = next.products[c as ClientId][fam as ProdId];
                                                    if (idx >= 0 && idx < products.length && products[idx].name === p.name) {
                                                      products[idx] = { ...products[idx], name: newName };
                                                    }
                                                  }
                                                });
                                                setGpContent(next);
                                                showSuccess('Nom modifié');
                                              } catch (error) {
                                                console.error('Erreur:', error);
                                                showError('Erreur lors de la modification');
                                              }
                                            }}
                                            className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                                          <textarea
                                            defaultValue={p.description}
                                            onBlur={(e) => {
                                              try {
                                                const newDesc = e.target.value.trim();
                                                if (newDesc === p.description) return;
                                                
                                                const next = JSON.parse(JSON.stringify(gpContent));
                                                ['particulier', 'professionnel', 'entreprise'].forEach((c) => {
                                                  if (next.products[c as ClientId]?.[fam as ProdId]) {
                                                    const products = next.products[c as ClientId][fam as ProdId];
                                                    if (idx >= 0 && idx < products.length && products[idx].name === p.name) {
                                                      products[idx] = { ...products[idx], description: newDesc };
                                                    }
                                                  }
                                                });
                                                setGpContent(next);
                                                showSuccess('Description modifiée');
                                              } catch (error) {
                                                console.error('Erreur:', error);
                                                showError('Erreur lors de la modification');
                                              }
                                            }}
                                            rows={2}
                                            className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-xs resize-none"
                                          />
                                        </div>
                                        <button
                                          onClick={() => setEditingGlobalProduct(null)}
                                          className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium"
                                        >
                                          ✓ Terminé
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Section pliable pour gérer les types de clients */}
                                    <div className="mb-3">
                                      <button
                                        onClick={() => setExpandedProducts(prev => ({
                                          ...prev,
                                          [productKey]: !prev[productKey]
                                        }))}
                                        className="w-full flex items-center justify-between p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-colors"
                                      >
                                        <span className="text-xs font-medium text-blue-300 flex items-center gap-2">
                                          <span>👥</span>
                                          <span>Gérer les types de clients</span>
                                        </span>
                                        <span className="text-blue-300 text-sm">{isExpanded ? '▼' : '▶'}</span>
                                      </button>
                                      
                                      {isExpanded && (
                                        <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600 space-y-2">
                                          {[
                                            { id: 'particulier', label: 'Particulier', icon: '👤' },
                                            { id: 'professionnel', label: 'Professionnel', icon: '💼' },
                                            { id: 'entreprise', label: 'Entreprise', icon: '🏢' }
                                          ].map(({ id: clientType, label, icon }) => {
                                            const existsInClient = gpContent.products[clientType as ClientId]?.[fam as ProdId]?.some(
                                              (prod: Product) => prod.name === p.name && (prod.description || '') === (p.description || '')
                                            );
                                            
                                            return (
                                              <label 
                                                key={clientType}
                                                className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${existsInClient ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-slate-700/50 border-slate-600'}`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="checkbox"
                                                    checked={existsInClient || false}
                                                    onChange={(e) => {
                                                      try {
                                                        const next = JSON.parse(JSON.stringify(gpContent));
                                                        const currentClientProducts = next.products[client as ClientId]?.[fam as ProdId] || [];
                                                        
                                                        if (idx >= 0 && idx < currentClientProducts.length) {
                                                          const productToModify = { ...currentClientProducts[idx] };
                                                          
                                                          if (e.target.checked) {
                                                            if (!next.products[clientType as ClientId]) {
                                                              next.products[clientType as ClientId] = {} as any;
                                                            }
                                                            if (!next.products[clientType as ClientId][fam as ProdId]) {
                                                              next.products[clientType as ClientId][fam as ProdId] = [];
                                                            }
                                                            
                                                            const existingIndex = next.products[clientType as ClientId][fam as ProdId].findIndex(
                                                              (prod: Product) => prod.name === productToModify.name && 
                                                              (prod.description || '') === (productToModify.description || '')
                                                            );
                                                            
                                                            if (existingIndex === -1) {
                                                              next.products[clientType as ClientId][fam as ProdId].push({
                                                                ...productToModify,
                                                                documents: productToModify.documents ? [...productToModify.documents] : []
                                                              });
                                                            }
                                                          } else {
                                                            if (next.products[clientType as ClientId]?.[fam as ProdId]) {
                                                              const productIndex = next.products[clientType as ClientId][fam as ProdId].findIndex(
                                                                (prod: Product) => prod.name === productToModify.name && 
                                                                (prod.description || '') === (productToModify.description || '')
                                                              );
                                                              
                                                              if (productIndex !== -1) {
                                                                next.products[clientType as ClientId][fam as ProdId].splice(productIndex, 1);
                                                              }
                                                            }
                                                          }
                                                          
                                                          setGpContent(next);
                                                        }
                                                      } catch (error) {
                                                        console.error('Erreur:', error);
                                                        showError('❌ Erreur lors de la modification');
                                                      }
                                                    }}
                                                    className="w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded"
                                                  />
                                                  <span className="text-sm">{icon}</span>
                                                  <span className="text-xs text-white">{label}</span>
                                                </div>
                                                {existsInClient && (
                                                  <span className="text-xs font-semibold text-emerald-400">✓</span>
                                                )}
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-600">
                                      <button
                                        onClick={() => {
                                          setEditingGlobalProduct(editingGlobalProduct === productKey ? null : productKey);
                                        }}
                                        className={`flex-1 px-3 py-2 ${editingGlobalProduct === productKey ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded text-xs font-medium text-center`}
                                      >
                                        ✏️ Modifier
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedClients([client as ClientId]);
                                          setSelectedFamilies([fam]);
                                          setEditingProductDocument({ 
                                            productName: p.name, 
                                            family: fam,
                                            client: client
                                          });
                                          setShowDocumentModal(true);
                                        }}
                                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium text-center"
                                        title="Attacher/Détacher des documents"
                                      >
                                        📎 Documents ({p.documents?.length || 0})
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${p.name}" ?`)) {
                                            return;
                                          }
                                          try {
                                            const next = JSON.parse(JSON.stringify(gpContent));
                                            // Supprimer uniquement du client actuellement affiché
                                            if (next.products[client as ClientId] && next.products[client as ClientId][fam as ProdId] && Array.isArray(next.products[client as ClientId][fam as ProdId])) {
                                              const products = next.products[client as ClientId][fam as ProdId];
                                              if (idx >= 0 && idx < products.length) {
                                                const productAtIdx = products[idx];
                                                if (productAtIdx && productAtIdx.name === p.name && 
                                                    (productAtIdx.description || '') === (p.description || '')) {
                                                  products.splice(idx, 1);
                                                } else {
                                                  const foundIndex = products.findIndex(
                                                    (prod: Product) => prod.name === p.name && 
                                                    (prod.description || '') === (p.description || '')
                                                  );
                                                  if (foundIndex !== -1) {
                                                    products.splice(foundIndex, 1);
                                                  }
                                                }
                                              }
                                            }
                                            setGpContent(next);
                                            showSuccess('Produit supprimé avec succès');
                                          } catch (error) {
                                            console.error('Erreur lors de la suppression:', error);
                                            showError('Erreur lors de la suppression du produit');
                                          }
                                        }}
                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message si aucun produit */}
              {(() => {
                let totalProducts = 0;
                ['particulier', 'professionnel', 'entreprise'].forEach((client) => {
                  Object.keys(gpContent.products[client as ClientId] || {}).forEach((fam) => {
                    const products = gpContent.products[client as ClientId][fam as ProdId] || [];
                    totalProducts += products.length;
                  });
                });
                if (totalProducts === 0) {
                  return (
                    <div className="text-center py-8 bg-slate-700/30 rounded-lg">
                      <p className="text-slate-400 mb-2">Aucun produit pour le moment</p>
                      <button
                        onClick={() => setWorkflowStep('select')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
                      >
                        + Ajouter votre premier produit
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Modal pour ajouter un document */}
            {showDocumentModal && editingProductDocument && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowDocumentModal(false);
                    setEditingProductDocument(null);
                    setDocumentForm({ title: '', file: null });
                  }
                }}
              >
                <div 
                  ref={(el) => {
                    if (el && showDocumentModal) {
                      // S'assurer que le modal est centré dans la viewport
                      requestAnimationFrame(() => {
                        el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
                      });
                    }
                  }}
                  className="bg-slate-800 rounded-xl shadow-2xl border border-slate-600 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">📎 Gérer les documents - {editingProductDocument.productName}</h3>
                    <button
                      onClick={() => {
                        setShowDocumentModal(false);
                        setEditingProductDocument(null);
                        setDocumentForm({ title: '', file: null });
                      }}
                      className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Liste des documents existants - Optimisé avec useMemo */}
                  {existingDocumentsForModal.length > 0 ? (
                    <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span>📄 Documents attachés ({existingDocumentsForModal.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {existingDocumentsForModal.map((doc: ProductDocument) => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between p-3 bg-slate-600/50 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                              <p className="text-xs text-slate-400">
                                {doc.file_name} • {(doc.file_size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                onClick={() => {
                                  // Télécharger le document
                                  const link = document.createElement('a');
                                  link.href = `data:${doc.file_type};base64,${doc.file_content}`;
                                  link.download = doc.file_name;
                                  link.click();
                                }}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                                title="Télécharger"
                              >
                                📥
                              </button>
                              <button
                                onClick={() => {
                                  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${doc.title}" ?`)) {
                                    return;
                                  }
                                  // Supprimer le document de tous les clients
                                  const next = JSON.parse(JSON.stringify(gpContent));
                                  ['particulier', 'professionnel', 'entreprise'].forEach((client) => {
                                    const products = next.products[client as ClientId]?.[editingProductDocument!.family as ProdId];
                                    if (products && Array.isArray(products)) {
                                      const productIndex = products.findIndex(
                                        (p: Product) => p.name === editingProductDocument!.productName
                                      );
                                      if (productIndex !== -1 && products[productIndex].documents) {
                                        products[productIndex].documents = products[productIndex].documents.filter(
                                          (d: ProductDocument) => d.id !== doc.id
                                        );
                                      }
                                    }
                                  });
                                  setGpContent(next);
                                  showSuccess(`Document "${doc.title}" supprimé. N'oubliez pas de sauvegarder !`);
                                }}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 text-center">
                      <p className="text-sm text-slate-400">📄 Aucun document attaché pour le moment</p>
                    </div>
                  )}
                  
                  {/* Formulaire d'ajout */}
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <h4 className="text-sm font-bold text-emerald-400 mb-3">➕ Ajouter un nouveau document</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Titre du document</label>
                      <input
                        type="text"
                        value={documentForm.title}
                        onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Ex: Notice produit, Conditions générales..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Fichier</label>
                      <input
                        type="file"
                        onChange={(e) => setDocumentForm({...documentForm, file: e.target.files?.[0] || null})}
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                      <p className="text-xs text-slate-400 mt-1">Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX</p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setShowDocumentModal(false);
                          setEditingProductDocument(null);
                          setDocumentForm({ title: '', file: null });
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={async () => {
                          if (!documentForm.file) {
                            showWarning('Veuillez sélectionner un fichier');
                            return;
                          }
                          // Convertir le fichier en base64
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const fileContent = e.target?.result as string;
                            const base64Content = fileContent.split(',')[1]; // Retirer le préfixe data:...
                            const newDocument: ProductDocument = {
                              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                              title: documentForm.title || documentForm.file!.name,
                              file_name: documentForm.file!.name,
                              file_content: base64Content,
                              file_size: documentForm.file!.size,
                              file_type: documentForm.file!.type,
                              uploaded_at: new Date().toISOString()
                            };
                            // Ajouter le document au produit dans tous les clients sélectionnés
                            const next = JSON.parse(JSON.stringify(gpContent)); // Deep copy
                            let documentAdded = false;
                            selectedClients.forEach((client) => {
                              const products = next.products[client][editingProductDocument.family as ProdId];
                              if (!products || !Array.isArray(products)) {
                                console.error('Products array not found for', client, editingProductDocument.family);
                                return;
                              }
                              const productIndex = products.findIndex(
                                (p: Product) => p.name === editingProductDocument.productName
                              );
                              if (productIndex !== -1) {
                                if (!products[productIndex].documents) {
                                  products[productIndex].documents = [];
                                }
                                // Vérifier si le document existe déjà (par nom de fichier)
                                const existingDocIndex = products[productIndex].documents.findIndex(
                                  (d: ProductDocument) => d.file_name === newDocument.file_name
                                );
                                if (existingDocIndex === -1) {
                                  products[productIndex].documents = [...(products[productIndex].documents || []), newDocument];
                                  documentAdded = true;
                                  console.log('✅ Document ajouté au produit:', editingProductDocument.productName, 'dans', client, editingProductDocument.family, 'Total documents:', products[productIndex].documents.length);
                                  console.log('📄 Document ajouté:', newDocument);
                                } else {
                                  console.warn('⚠️ Document déjà existant:', newDocument.file_name);
                                  showWarning('Ce document existe déjà pour ce produit');
                                }
                              } else {
                                console.warn('⚠️ Produit non trouvé:', editingProductDocument.productName, 'dans', client, editingProductDocument.family, 'Produits disponibles:', products.map((p: Product) => p.name));
                              }
                            });
                            if (documentAdded) {
                              console.log('💾 Sauvegarde du contenu avec documents. Produit:', editingProductDocument.productName);
                              console.log('📦 État complet après ajout:', JSON.stringify(next, null, 2));
                              setGpContent(next);
                              showSuccess('Document ajouté avec succès ! N\'oubliez pas de sauvegarder le contenu.');
                              setShowDocumentModal(false);
                              setEditingProductDocument(null);
                              setDocumentForm({ title: '', file: null });
                            } else {
                              console.error('❌ Échec ajout document. Produit:', editingProductDocument.productName, 'Famille:', editingProductDocument.family, 'Clients sélectionnés:', selectedClients);
                              showWarning('Produit non trouvé. Veuillez réessayer.');
                            }
                          };
                          reader.readAsDataURL(documentForm.file);
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                      >
                        ➕ Ajouter
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <h3 className="text-xl font-bold text-white mb-4">📧 Envoyer un email personnalisé</h3>
              
              <PersonalizedEmailForm />
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
                {user.prenom} {user.nom} ({user.email})
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
                    {user.prenom} {user.nom} ({user.email})
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

export default CMSManagementPage;

