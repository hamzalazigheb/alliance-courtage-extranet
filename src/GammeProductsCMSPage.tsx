import React, { useState, useEffect } from 'react';
import { gammeProductsAPI, GammeProduct, GammeProductFile, GammeFamily } from './api/gammeProductsAPI';
import { useAlert } from './contexts/AlertContext';

type ClientType = 'particulier' | 'professionnel' | 'entreprise';
type Family = 'epargne' | 'retraite' | 'prevoyance' | 'sante' | 'cif';

const GammeProductsCMSPage: React.FC = () => {
  const { showSuccess, showError } = useAlert();
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientType, setSelectedClientType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showManageClientsModal, setShowManageClientsModal] = useState(false);
  const [showManageFamiliesModal, setShowManageFamiliesModal] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<GammeProduct | null>(null);
  const [productFiles, setProductFiles] = useState<GammeProductFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productFilesCount, setProductFilesCount] = useState<Record<string, number>>({});
  
  // États pour la gestion multi-clients
  const [managedProductName, setManagedProductName] = useState('');
  const [currentClientTypes, setCurrentClientTypes] = useState<ClientType[]>([]);

  // Formulaire d'ajout (workflow 2 étapes)
  const [addProductStep, setAddProductStep] = useState<1 | 2>(1);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [newProduct, setNewProduct] = useState({
    client_types: ['particulier'] as string[],
    families: ['epargne'] as string[],
    product_name: '',
    description: ''
  });

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    product_name: '',
    description: ''
  });

  const clientTypes = [
    { value: 'particulier', label: 'Particulier', icon: '👤' },
    { value: 'professionnel', label: 'Professionnel', icon: '💼' },
    { value: 'entreprise', label: 'Entreprise', icon: '🏢' }
  ];

  // Familles dynamiques (stockées dans la base de données)
  const defaultFamilies: GammeFamily[] = [
    { value: 'epargne', label: 'Épargne', icon: '💰' },
    { value: 'retraite', label: 'Retraite', icon: '👴' },
    { value: 'prevoyance', label: 'Prévoyance', icon: '🛡️' },
    { value: 'sante', label: 'Santé', icon: '❤️' },
    { value: 'cif', label: 'CIF', icon: '📊' }
  ];

  const [families, setFamilies] = useState<GammeFamily[]>(defaultFamilies);
  const [familiesLoading, setFamiliesLoading] = useState(false);

  const [newFamilyLabel, setNewFamilyLabel] = useState('');

  // Charger les familles depuis la base de données
  const loadFamilies = async () => {
    try {
      setFamiliesLoading(true);
      const data = await gammeProductsAPI.getFamilies();
      // Filtrer les familles vides/invalides
      const validFamilies = (data || []).filter((f: GammeFamily) => 
        f.value && f.value.trim() && f.label && f.label.trim()
      );
      if (validFamilies.length > 0) {
        setFamilies(validFamilies);
      } else {
        setFamilies(defaultFamilies);
      }
    } catch (error) {
      console.error('Erreur chargement familles:', error);
      setFamilies(defaultFamilies);
    } finally {
      setFamiliesLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadFamilies(); // Charger les familles depuis la DB
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await gammeProductsAPI.getAll();
      setProducts(data);
      
      // Charger le nombre de documents pour chaque produit
      await loadProductFilesCount(data);
    } catch (error: any) {
      showError(error.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadProductFilesCount = async (productsList: GammeProduct[]) => {
    try {
      const counts: Record<string, number> = {};
      
      // Grouper par nom de produit pour éviter de compter plusieurs fois
      const uniqueProducts = productsList.reduce((acc, product) => {
        if (!acc[product.product_name]) {
          acc[product.product_name] = product;
        }
        return acc;
      }, {} as Record<string, GammeProduct>);
      
      // Charger le nombre de fichiers pour chaque produit unique
      for (const productName in uniqueProducts) {
        const product = uniqueProducts[productName];
        let fileCount = 0;
        
        try {
          // D'abord essayer avec le produit sélectionné
          const files = await gammeProductsAPI.getFiles(product.id);
          fileCount = files.length;
          
          // Si ce produit n'a pas de fichiers, vérifier les autres produits avec le même nom
          if (fileCount === 0) {
            const productsWithSameName = productsList.filter(p => p.product_name === productName);
            for (const p of productsWithSameName) {
              try {
                const pFiles = await gammeProductsAPI.getFiles(p.id);
                if (pFiles.length > 0) {
                  fileCount = pFiles.length;
                  console.log(`✅ Fichiers trouvés pour "${productName}" via produit ${p.id} (${p.family})`);
                  break; // Prendre le premier qui a des fichiers
                }
              } catch (e) {
                // Ignorer les erreurs et continuer
              }
            }
          }
          
          counts[productName] = fileCount;
        } catch (error) {
          // Si erreur, essayer les autres produits avec le même nom
          const productsWithSameName = productsList.filter(p => p.product_name === productName);
          let found = false;
          for (const p of productsWithSameName) {
            try {
              const pFiles = await gammeProductsAPI.getFiles(p.id);
              if (pFiles.length > 0) {
                counts[productName] = pFiles.length;
                found = true;
                break;
              }
            } catch (e) {
              // Continuer
            }
          }
          if (!found) {
            counts[productName] = 0;
          }
        }
      }
      
      setProductFilesCount(counts);
    } catch (error) {
      console.error('Erreur chargement compteurs fichiers:', error);
    }
  };

  // Grouper les produits par nom (pour identifier les produits multi-clients)
  const groupedByName = products.reduce((acc, product) => {
    if (!acc[product.product_name]) {
      acc[product.product_name] = [];
    }
    acc[product.product_name].push(product);
    return acc;
  }, {} as Record<string, GammeProduct[]>);

  // Filtrer par type de client
  const filteredProducts = selectedClientType === 'all' 
    ? Object.entries(groupedByName)
    : Object.entries(groupedByName).filter(([_, prods]) => 
        prods.some(p => p.client_type === selectedClientType)
      );

  // Filtrer par terme de recherche (nom de produit ou catégorie)
  const searchFilteredProducts = searchTerm.trim() === ''
    ? filteredProducts
    : filteredProducts.filter(([productName, prods]) => {
        const searchLower = searchTerm.toLowerCase();
        // Rechercher dans le nom du produit
        const matchesName = productName.toLowerCase().includes(searchLower);
        // Rechercher dans les familles/catégories
        const matchesFamily = prods.some(p => {
          const familyInfo = families.find(f => f.value === p.family);
          return familyInfo?.label.toLowerCase().includes(searchLower) || 
                 familyInfo?.value.toLowerCase().includes(searchLower);
        });
        return matchesName || matchesFamily;
      });

  // Grouper par famille
  const productsByFamily = searchFilteredProducts.reduce((acc, [productName, prods]) => {
    prods.forEach(product => {
      if (!selectedClientType || selectedClientType === 'all' || product.client_type === selectedClientType) {
        if (!acc[product.family]) {
          acc[product.family] = [];
        }
        const existing = acc[product.family].find(p => p.name === productName);
        if (!existing) {
          acc[product.family].push({
            name: productName,
            products: prods,
            description: product.description || ''
          });
        }
      }
    });
    return acc;
  }, {} as Record<string, Array<{ name: string; products: GammeProduct[]; description: string }>>);

  // WORKFLOW AJOUT - Étape suivante
  const handleNextStep = () => {
    if (!newProduct.product_name.trim()) {
      showError('Le nom du produit est requis');
      return;
    }
    if (newProduct.client_types.length === 0) {
      showError('Sélectionnez au moins un type de client');
      return;
    }
    if (newProduct.families.length === 0) {
      showError('Sélectionnez au moins une famille');
      return;
    }
    setAddProductStep(2);
  };

  // WORKFLOW AJOUT - Finaliser (OPTIMISÉ: Une seule requête pour tout)
  const handleAddProduct = async () => {
    try {
      setUploading(true);
      
      // 🚀 NOUVELLE MÉTHODE OPTIMISÉE: Tout en une seule requête
      const result = await gammeProductsAPI.createWithFiles({
        client_types: newProduct.client_types,
        families: newProduct.families,
        product_name: newProduct.product_name,
        description: newProduct.description,
        files: pendingFiles
      });

      const totalCreated = result.products.length;
      const totalFiles = result.files_uploaded;

      if (totalFiles > 0) {
        showSuccess(`✅ ${totalCreated} produit(s) créé(s) avec ${totalFiles} document(s) uploadé(s) !`);
      } else {
        showSuccess(`✅ ${totalCreated} produit(s) créé(s) avec succès !`);
      }

      console.log(`✅ Résultat:`, result);

      setShowAddModal(false);
      setAddProductStep(1);
      setPendingFiles([]);
      setNewProduct({
        client_types: ['particulier'],
        families: ['epargne'],
        product_name: '',
        description: ''
      });
      loadProducts();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la création du produit');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPendingFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    setPendingFiles(prev => [...prev, ...newFiles]);
    showSuccess(`✅ ${newFiles.length} fichier(s) ajouté(s)`);
    e.target.value = '';
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // GÉRER LES TYPES DE CLIENTS
  const handleManageClients = (productName: string) => {
    const productsWithName = groupedByName[productName];
    setManagedProductName(productName);
    setCurrentClientTypes(productsWithName.map(p => p.client_type as ClientType));
    setShowManageClientsModal(true);
  };

  const handleSaveClientTypes = async () => {
    try {
      setUploading(true);
      const productsWithName = groupedByName[managedProductName];
      const oldClientTypes = productsWithName.map(p => p.client_type);
      
      // Types à ajouter
      const toAdd = currentClientTypes.filter(ct => !oldClientTypes.includes(ct));
      // Types à supprimer
      const toRemove = oldClientTypes.filter(ct => !currentClientTypes.includes(ct));
      
      // Ajouter les nouveaux types
      for (const clientType of toAdd) {
        const firstProduct = productsWithName[0];
        await gammeProductsAPI.create({
          client_type: clientType,
          family: firstProduct.family,
          product_name: managedProductName,
          description: firstProduct.description || ''
        });
      }
      
      // Supprimer les types non sélectionnés
      for (const clientType of toRemove) {
        const product = productsWithName.find(p => p.client_type === clientType);
        if (product) {
          await gammeProductsAPI.delete(product.id);
        }
      }
      
      const addedCount = toAdd.length;
      const deletedCount = toRemove.length;
      if (addedCount > 0 || deletedCount > 0) {
        showSuccess(`✅ ${addedCount} type(s) ajouté(s), ${deletedCount} type(s) retiré(s) !`);
      } else {
        showSuccess('✅ Types de clients mis à jour !');
      }
      
      setShowManageClientsModal(false);
      loadProducts();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setUploading(false);
    }
  };

  // ÉDITER UN PRODUIT
  const handleEditProduct = (productName: string) => {
    const productsWithName = groupedByName[productName];
    setManagedProductName(productName);
    setEditForm({
      product_name: productName,
      description: productsWithName[0].description || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setUploading(true);
      const productsWithName = groupedByName[managedProductName];
      
      // Mettre à jour tous les produits avec ce nom
      for (const product of productsWithName) {
        await gammeProductsAPI.update(product.id, {
          product_name: editForm.product_name,
          description: editForm.description
        });
      }
      
      showSuccess('✅ Produit mis à jour !');
      setShowEditModal(false);
      loadProducts();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setUploading(false);
    }
  };

  // GÉRER LES DOCUMENTS
  const handleManageFiles = async (productName: string) => {
    const productsWithName = groupedByName[productName];
    setManagedProductName(productName);
    setSelectedProduct(productsWithName[0]);
    setShowFilesModal(true);
    
    try {
      // Essayer de charger les fichiers du premier produit
      let files = await gammeProductsAPI.getFiles(productsWithName[0].id);
      
      // Si aucun fichier trouvé, vérifier les autres produits avec le même nom
      if (files.length === 0 && productsWithName.length > 1) {
        for (let i = 1; i < productsWithName.length; i++) {
          try {
            const otherFiles = await gammeProductsAPI.getFiles(productsWithName[i].id);
            if (otherFiles.length > 0) {
              files = otherFiles;
              setSelectedProduct(productsWithName[i]); // Utiliser le produit qui a des fichiers
              console.log(`✅ Fichiers trouvés pour "${productName}" via produit ${productsWithName[i].id} (${productsWithName[i].family})`);
              break;
            }
          } catch (e) {
            // Continuer avec le produit suivant
          }
        }
      }
      
      setProductFiles(files);
    } catch (error: any) {
      // Si erreur sur le premier, essayer les autres
      let filesFound = false;
      for (const product of productsWithName) {
        try {
          const files = await gammeProductsAPI.getFiles(product.id);
          if (files.length > 0) {
            setProductFiles(files);
            setSelectedProduct(product);
            filesFound = true;
            console.log(`✅ Fichiers trouvés pour "${productName}" via produit ${product.id} (${product.family})`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }
      if (!filesFound) {
        showError(error.message || 'Erreur lors du chargement des fichiers');
        setProductFiles([]);
      }
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct || !e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const productsWithName = groupedByName[managedProductName];
    const multipleProducts = productsWithName.length > 1;

    // Si le produit existe dans plusieurs familles, demander où uploader
    let uploadToAll = !multipleProducts; // Par défaut, uploader partout si un seul produit
    
    if (multipleProducts) {
      uploadToAll = confirm(
        `📎 Vous allez uploader ${files.length} fichier(s).\n\n` +
        `Ce produit existe dans ${productsWithName.length} famille(s).\n\n` +
        `Voulez-vous ajouter ces fichiers à TOUTES les familles ?\n\n` +
        `• OK = Ajouter à TOUTES les familles\n` +
        `• Annuler = Ajouter UNIQUEMENT à la famille actuelle (${selectedProduct.family})`
      );
    }

    try {
      setUploading(true);
      
      if (uploadToAll) {
        // Uploader pour TOUS les produits
        let uploadedCount = 0;
        for (const product of productsWithName) {
          try {
            await gammeProductsAPI.uploadFiles(product.id, files);
            uploadedCount++;
          } catch (error: any) {
            console.error(`Erreur upload pour produit ${product.id}:`, error);
          }
        }
        showSuccess(`✅ ${files.length} fichier(s) uploadé(s) pour ${uploadedCount} famille(s) !`);
      } else {
        // Uploader UNIQUEMENT pour le produit actuel
        await gammeProductsAPI.uploadFiles(selectedProduct.id, files);
        showSuccess(`✅ ${files.length} fichier(s) uploadé(s) pour la famille "${selectedProduct.family}" !`);
      }
      
      // Recharger les fichiers
      const updatedFiles = await gammeProductsAPI.getFiles(selectedProduct.id);
      setProductFiles(updatedFiles);
      
      // Mettre à jour le compteur
      setProductFilesCount(prev => ({
        ...prev,
        [managedProductName]: updatedFiles.length
      }));
      
      e.target.value = '';
    } catch (error: any) {
      showError(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!selectedProduct) return;

    const productsWithName = groupedByName[managedProductName];
    const multipleProducts = productsWithName.length > 1;

    // Si le produit existe dans plusieurs familles, demander confirmation
    if (multipleProducts) {
      const deleteAll = confirm(
        `⚠️ Ce produit existe dans ${productsWithName.length} famille(s).\n\n` +
        `Voulez-vous supprimer "${fileName}" de TOUTES les familles ?\n\n` +
        `• OK = Supprimer de TOUTES les familles\n` +
        `• Annuler = Supprimer UNIQUEMENT de la famille actuelle (${selectedProduct.family})`
      );
      
      try {
        // Utiliser le paramètre deleteFromAllFamilies pour indiquer au backend
        await gammeProductsAPI.deleteFile(selectedProduct.id, fileId, deleteAll);
        
        if (deleteAll) {
          showSuccess(`✅ Fichier supprimé de ${productsWithName.length} famille(s) !`);
        } else {
          showSuccess(`✅ Fichier supprimé de la famille "${selectedProduct.family}" !`);
        }
        
        const updatedFiles = await gammeProductsAPI.getFiles(selectedProduct.id);
        setProductFiles(updatedFiles);
        
        // Mettre à jour le compteur
        setProductFilesCount(prev => ({
          ...prev,
          [managedProductName]: updatedFiles.length
        }));
      } catch (error: any) {
        showError(error.message || 'Erreur lors de la suppression');
      }
    } else {
      // Un seul produit, supprimer directement
      if (!confirm(`Supprimer "${fileName}" ?`)) return;
      
      try {
        await gammeProductsAPI.deleteFile(selectedProduct.id, fileId, false);
        showSuccess('✅ Fichier supprimé !');
        const updatedFiles = await gammeProductsAPI.getFiles(selectedProduct.id);
        setProductFiles(updatedFiles);
        
        // Mettre à jour le compteur
        setProductFilesCount(prev => ({
          ...prev,
          [managedProductName]: updatedFiles.length
        }));
      } catch (error: any) {
        showError(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  // GÉRER LES FAMILLES (sauvegardées dans la base de données)
  const handleAddFamily = async () => {
    if (!newFamilyLabel.trim()) {
      showError('Veuillez saisir un nom de famille');
      return;
    }

    try {
      setFamiliesLoading(true);
      
      // Appeler l'API pour créer la famille (juste le nom suffit!)
      const result = await gammeProductsAPI.createFamily({
        nom: newFamilyLabel.trim()  // Le backend génère automatiquement value et icon
      });
      
      // Recharger les familles depuis la DB
      await loadFamilies();
      
      setNewFamilyLabel('');
      showSuccess('✅ Famille ajoutée et sauvegardée en base de données !');
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la création de la famille');
    } finally {
      setFamiliesLoading(false);
    }
  };

  const handleDeleteFamily = async (familyValue: string) => {
    // Vérifier localement d'abord
    const productsUsingFamily = products.filter(p => p.family === familyValue);
    if (productsUsingFamily.length > 0) {
      showError(`Impossible de supprimer : ${productsUsingFamily.length} produit(s) utilise(nt) cette famille`);
      return;
    }

    if (!confirm(`Supprimer la famille "${families.find(f => f.value === familyValue)?.label}" ?`)) return;

    try {
      setFamiliesLoading(true);
      
      // Appeler l'API pour supprimer la famille
      await gammeProductsAPI.deleteFamily(familyValue);
      
      // Recharger les familles depuis la DB
      await loadFamilies();
      
      showSuccess('✅ Famille supprimée de la base de données !');
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la suppression de la famille');
    } finally {
      setFamiliesLoading(false);
    }
  };

  // SUPPRIMER UN PRODUIT
  const handleDeleteProduct = async (productName: string) => {
    if (!confirm(`Supprimer "${productName}" et tous ses fichiers ?`)) return;

    try {
      const productsWithName = groupedByName[productName];
      
      for (const product of productsWithName) {
        await gammeProductsAPI.delete(product.id);
      }
      
      showSuccess(`✅ Produit "${productName}" supprimé !`);
      loadProducts();
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la suppression');
    }
  };

  const totalProducts = Object.keys(groupedByName).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              📦 Tous les produits
            </h1>
            <p className="text-slate-400 mt-1">{totalProducts} produits au total</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowManageFamiliesModal(true)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              title="Gérer les familles de produits"
            >
              <span>📁</span>
              <span>Familles</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Nouveau produit</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit par nom ou catégorie (ex: FIP CORSE, CIF, Épargne...)"
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                title="Effacer la recherche"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-slate-400 mt-2">
              {Object.values(productsByFamily).reduce((sum, prods) => sum + prods.length, 0)} produit(s) trouvé(s)
            </p>
          )}
        </div>

        {/* Onglets de filtrage */}
        <div className="flex space-x-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
          <button
            onClick={() => setSelectedClientType('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedClientType === 'all'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Tous les types
          </button>
          {clientTypes.map(ct => (
            <button
              key={ct.value}
              onClick={() => setSelectedClientType(ct.value)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedClientType === ct.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des produits groupés par famille */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(productsByFamily).length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">
                {searchTerm ? 'Aucun produit trouvé pour votre recherche' : 'Aucun produit'}
              </p>
            </div>
          ) : (
            Object.entries(productsByFamily).map(([family, familyProducts]) => {
            const familyInfo = families.find(f => f.value === family);
            return (
              <div key={family} className="bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <span className="text-2xl mr-3">{familyInfo?.icon}</span>
                      Famille: {familyInfo?.label}
                    </h2>
                    <span className="text-slate-400 text-sm">{familyProducts.length} produit{familyProducts.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyProducts.map(({ name, products: prods, description }) => (
                    <div key={name} className="bg-slate-900/50 rounded-xl border border-slate-700 p-5 hover:border-emerald-500/50 transition-all">
                      <h3 className="font-bold text-white text-base mb-3">{name}</h3>
                      
                      {description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{description}</p>
                      )}
                      
                      {/* Gérer les types de clients */}
                      <button
                        onClick={() => handleManageClients(name)}
                        className="w-full mb-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-between border border-slate-600 hover:border-slate-500 transition-all"
                      >
                        <span className="flex items-center space-x-2">
                          <span>👥</span>
                          <span>Gérer les types de clients</span>
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Badges types clients */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Array.from(new Set(prods.map(p => p.client_type))).map(clientType => {
                          const ct = clientTypes.find(c => c.value === clientType);
                          return (
                            <span key={clientType} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700">
                              {ct?.icon} {ct?.label}
                            </span>
                          );
                        })}
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(name)}
                          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleManageFiles(name)}
                          className="relative flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>Documents</span>
                          {productFilesCount[name] > 0 && (
                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-800 shadow-lg">
                              {productFilesCount[name]}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(name)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }))}
        </div>
      )}

      {/* MODAL: Ajouter Produit (2 étapes) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 my-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">➕ Nouveau produit</h2>
              <p className="text-emerald-100 text-sm mt-2">
                {addProductStep === 1 
                  ? '📝 Étape 1/2 : Définir le produit'
                  : '📎 Étape 2/2 : Ajouter des documents (optionnel)'}
              </p>
              <div className="flex items-center space-x-2 mt-4">
                <div className={`flex-1 h-2 rounded-full transition-colors ${addProductStep >= 1 ? 'bg-white' : 'bg-emerald-300/30'}`}></div>
                <div className={`flex-1 h-2 rounded-full transition-colors ${addProductStep >= 2 ? 'bg-white' : 'bg-emerald-300/30'}`}></div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {addProductStep === 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Type(s) de client *</label>
                      <div className="space-y-2 bg-slate-700 rounded-lg p-3 border border-slate-600">
                        {clientTypes.map(ct => (
                          <label key={ct.value} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-600 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={newProduct.client_types.includes(ct.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewProduct({...newProduct, client_types: [...newProduct.client_types, ct.value]});
                                } else {
                                  setNewProduct({...newProduct, client_types: newProduct.client_types.filter(c => c !== ct.value)});
                                }
                              }}
                              className="w-4 h-4 text-emerald-500 rounded"
                            />
                            <span className="text-white text-sm">{ct.icon} {ct.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Famille(s) *</label>
                      <div className="space-y-2 bg-slate-700 rounded-lg p-3 border border-slate-600">
                        {families.map(f => (
                          <label key={f.value} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-600 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={newProduct.families.includes(f.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewProduct({...newProduct, families: [...newProduct.families, f.value]});
                                } else {
                                  setNewProduct({...newProduct, families: newProduct.families.filter(fam => fam !== f.value)});
                                }
                              }}
                              className="w-4 h-4 text-emerald-500 rounded"
                            />
                            <span className="text-white text-sm">{f.icon} {f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nom du produit *</label>
                    <input
                      type="text"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: NORMA CAPITAL NCAP CONTINENT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      placeholder="Description du produit..."
                    />
                  </div>
                  {newProduct.client_types.length > 0 && newProduct.families.length > 0 && newProduct.product_name && (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-emerald-300 mb-2">
                        📋 {newProduct.client_types.length * newProduct.families.length} produit(s) seront créés
                      </h4>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-sm font-semibold text-white mb-2">📦 Produit : {newProduct.product_name}</h4>
                    <p className="text-xs text-slate-400">Dans {newProduct.client_types.length * newProduct.families.length} catégorie(s)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">📎 Documents (optionnel)</label>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-emerald-500 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={handleAddPendingFiles}
                        className="hidden"
                        id="pending-files-upload"
                      />
                      <label htmlFor="pending-files-upload" className="flex flex-col items-center cursor-pointer">
                        <svg className="w-12 h-12 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-slate-300 text-sm font-medium">Ajouter des fichiers</span>
                      </label>
                    </div>
                    {pendingFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {pendingFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                            <span className="text-sm text-white truncate">{file.name}</span>
                            <button onClick={() => handleRemovePendingFile(i)} className="text-red-400 hover:text-red-300">🗑️</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between p-6 bg-slate-900/50 border-t border-slate-700">
              <button
                onClick={() => {
                  if (addProductStep === 2) {
                    setAddProductStep(1);
                  } else {
                    setShowAddModal(false);
                    setAddProductStep(1);
                    setPendingFiles([]);
                    setNewProduct({ client_types: ['particulier'], families: ['epargne'], product_name: '', description: '' });
                  }
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                {addProductStep === 2 ? '← Précédent' : 'Annuler'}
              </button>
              <div>
                {addProductStep === 1 ? (
                  <button onClick={handleNextStep} disabled={!newProduct.product_name.trim()} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">
                    Suivant →
                  </button>
                ) : (
                  <button onClick={handleAddProduct} disabled={uploading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">
                    {uploading ? '⏳ Création...' : `✅ Créer`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Éditer Produit */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">✏️ Modifier le produit</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  value={editForm.product_name}
                  onChange={(e) => setEditForm({...editForm, product_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-900/50 border-t border-slate-700">
              <button onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Annuler</button>
              <button onClick={handleSaveEdit} disabled={uploading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">
                {uploading ? '⏳' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gérer Types Clients */}
      {showManageClientsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">👥 Gérer les types de clients</h2>
              <p className="text-blue-100 text-sm mt-1">{managedProductName}</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {clientTypes.map(ct => (
                  <label key={ct.value} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600">
                    <input
                      type="checkbox"
                      checked={currentClientTypes.includes(ct.value as ClientType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCurrentClientTypes([...currentClientTypes, ct.value as ClientType]);
                        } else {
                          setCurrentClientTypes(currentClientTypes.filter(c => c !== ct.value));
                        }
                      }}
                      className="w-5 h-5 text-blue-500 rounded"
                    />
                    <span className="text-white font-medium">{ct.icon} {ct.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-900/50 border-t border-slate-700">
              <button onClick={() => setShowManageClientsModal(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Annuler</button>
              <button onClick={handleSaveClientTypes} disabled={uploading || currentClientTypes.length === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                {uploading ? '⏳' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gérer Familles */}
      {showManageFamiliesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-700 my-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">📁 Gérer les familles de produits</h2>
              <p className="text-blue-100 text-sm mt-2">Ajoutez ou supprimez des familles de produits</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Formulaire d'ajout */}
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <span className="mr-2">➕</span>
                  Ajouter une nouvelle famille
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la famille *</label>
                    <input
                      type="text"
                      value={newFamilyLabel}
                      onChange={(e) => setNewFamilyLabel(e.target.value)}
                      placeholder="ex: Assurance Auto"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFamily()}
                    />
                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      L'identifiant sera généré automatiquement (ex: "assurance_auto")
                    </p>
                  </div>
                  <button
                    onClick={handleAddFamily}
                    disabled={!newFamilyLabel.trim()}
                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Ajouter la famille</span>
                  </button>
                </div>
              </div>

              {/* Liste des familles existantes */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Familles existantes ({families.length})
                </h3>
                <div className="space-y-2">
                  {families.map(family => {
                    const productsCount = products.filter(p => p.family === family.value).length;
                    return (
                      <div key={family.value} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl">{family.icon}</span>
                          <div>
                            <p className="text-white font-medium">{family.label}</p>
                            <p className="text-sm text-slate-400">
                              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded">{family.value}</span>
                              {productsCount > 0 && (
                                <span className="ml-2 text-blue-400">• {productsCount} produit{productsCount > 1 ? 's' : ''}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFamily(family.value)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={productsCount > 0}
                          title={productsCount > 0 ? `Impossible de supprimer : ${productsCount} produit(s) utilise(nt) cette famille` : 'Supprimer cette famille'}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => {
                  setShowManageFamiliesModal(false);
                  setNewFamilyLabel('');
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gérer Documents */}
      {showFilesModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-700 my-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">📄 Documents - {managedProductName}</h2>
              <div className="mt-3 flex items-center space-x-4 text-blue-100 text-sm">
                <span className="bg-blue-500/30 px-3 py-1 rounded-lg">
                  👤 {clientTypes.find(ct => ct.value === selectedProduct.client_type)?.label}
                </span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-lg">
                  {families.find(f => f.value === selectedProduct.family)?.icon} {families.find(f => f.value === selectedProduct.family)?.label}
                </span>
              </div>
              {groupedByName[managedProductName]?.length > 1 && (
                <div className="mt-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-yellow-100 text-sm">
                  ⚠️ Ce produit existe dans {groupedByName[managedProductName].length} famille(s). Les documents peuvent être gérés séparément pour chaque famille.
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <input type="file" multiple onChange={handleUploadFiles} className="hidden" id="files-upload" />
                <label htmlFor="files-upload" className="flex flex-col items-center cursor-pointer">
                  <svg className="w-12 h-12 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-slate-300 text-sm font-medium">Cliquez pour ajouter des fichiers</span>
                </label>
              </div>
              <div className="space-y-2">
                {productFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white truncate">{file.file_name}</span>
                      <span className="text-slate-400 text-sm">({(file.file_size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="flex space-x-2">
                      <a href={gammeProductsAPI.getFileDownloadUrl(selectedProduct.id, file.id)} download className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">📥</a>
                      <button onClick={() => handleDeleteFile(file.id, file.file_name)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">🗑️</button>
                    </div>
                  </div>
                ))}
                {productFiles.length === 0 && <p className="text-slate-400 text-center py-8">Aucun document</p>}
              </div>
            </div>
            <div className="flex justify-end p-6 bg-slate-900/50 border-t border-slate-700">
              <button onClick={() => setShowFilesModal(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GammeProductsCMSPage;
