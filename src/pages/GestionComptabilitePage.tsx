import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { buildAPIURL } from '../api';
import { useAlert } from '../contexts/AlertContext';

// Gestion Comptabilité Page Component - Display all users for admin
function GestionComptabilitePage({ currentUser }: { currentUser: User | null }) {
  const { showSuccess, showError, showWarning } = useAlert();
  const [users, setUsers] = useState<Array<{
    id: number;
    email: string;
    nom: string;
    prenom: string;
    denomination_sociale?: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [invalidNamedFiles, setInvalidNamedFiles] = useState<string[]>([]);
  const [fileUserMapping, setFileUserMapping] = useState<{fileIndex: number, userId: number, score: number}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedUserIdForBulk, setSelectedUserIdForBulk] = useState<number | ''>('');
  const [recentUploads, setRecentUploads] = useState<Array<{ archiveId: number; fileUrl: string | null; title: string; userId: number | null; userLabel: string; createdAt: string; hasFileContent?: boolean; periodYear?: number | null; periodMonth?: number | null }>>([]);
  const [uploadMode, setUploadMode] = useState<'auto' | 'manual'>('auto'); // 'auto' = direct upload, 'manual' = preview first
  const [bulkUploadDate, setBulkUploadDate] = useState<string>(new Date().toISOString().split('T')[0]); // Date configurable pour l'affichage
  const [bulkUploadYear, setBulkUploadYear] = useState<number>(new Date().getFullYear()); // Année du dossier destination
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set()); // Track which files are being deleted
  const [editingBordereau, setEditingBordereau] = useState<number | null>(null);
  const [editPeriodYear, setEditPeriodYear] = useState<string>('');
  const [editPeriodMonth, setEditPeriodMonth] = useState<string>('');
  const [editPeriodDay, setEditPeriodDay] = useState<string>('');
  
  // Filtres pour les derniers fichiers uploadés
  const [recentUploadsFilter, setRecentUploadsFilter] = useState({
    search: '',
    userId: '' as number | '',
    year: '' as number | '',
    month: '' as number | ''
  });
  
  // Upload results modal
  const [uploadResultsModal, setUploadResultsModal] = useState<{
    show: boolean;
    success: Array<{fileName: string; userName: string}>;
    notMatched: Array<{fileName: string}>;
    failed: Array<{fileName: string; userName: string; error: string}>;
  }>({ show: false, success: [], notMatched: [], failed: [] });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      // Load recent bordereaux uploads from backend so they persist across sessions
      (async () => {
        try {
          const res = await fetch(buildAPIURL('/bordereaux/recent?limit=1000'), {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          });
          if (res.ok) {
            const data = await res.json();
            // Filtrer les valeurs null/undefined et s'assurer que chaque objet a un title
            const validUploads = Array.isArray(data) 
              ? data.filter((r: any) => r && r.title && typeof r.title === 'string')
              : [];
            setRecentUploads(validUploads);
          }
        } catch {}
      })();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildAPIURL('/users'), {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utilities for smart matching
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[-_.()\s]+/g, ' ') // unify separators
      .trim();

  // Helper function to get user label (prioritizes denomination_sociale)
  const getUserLabel = (user: { nom: string; prenom: string; denomination_sociale?: string | null }): string => {
    if (user.denomination_sociale && user.denomination_sociale.trim()) {
      return user.denomination_sociale.trim();
    }
    return `${user.prenom} ${user.nom}`.trim();
  };

  // Return best userId and a confidence score [0..100]
  // NEW LOGIC: Prioritizes denomination_sociale, then prefixes at the beginning of filename
  const matchFileToUser = (fileName: string): { userId: number | null, score: number } => {
    // Extract prefix BEFORE normalization to preserve delimiters
    const fileNameLower = fileName.toLowerCase();
    
    // Extract prefix from beginning: either before delimiter (_ - space) or first 2-15 characters
    const prefixWithDelimiter = fileNameLower.match(/^([a-zà-ÿ0-9]{2,30})[_-\s\.]/);
    const prefixDelimited = prefixWithDelimiter ? prefixWithDelimiter[1] : null;
    const prefix2 = fileNameLower.substring(0, 2);
    const prefix3 = fileNameLower.substring(0, 3);
    const prefix5 = fileNameLower.substring(0, 5);
    const prefix10 = fileNameLower.substring(0, 10);
    
    const fileNorm = normalize(fileName);
    
    // Liste des mots communs à ignorer (mots qui ne sont pas des noms d'utilisateurs)
    const commonWords = ['bordereau', 'document', 'fichier', 'file', 'upload', 'facture', 'invoice', 'releve', 'relevé'];
    const prefixLower = prefixDelimited ? prefixDelimited.toLowerCase() : '';
    const isCommonWord = commonWords.includes(prefixLower) || commonWords.some(word => fileNameLower.startsWith(word + ' ') || fileNameLower.startsWith(word + '_') || fileNameLower.startsWith(word + '-'));
    
    // Helper function to check if prefix is a subsequence of name (e.g., "ai" in "amir")
    const isSubsequence = (prefix: string, name: string): boolean => {
      let nameIndex = 0;
      for (let i = 0; i < prefix.length; i++) {
        const char = prefix[i];
        const found = name.indexOf(char, nameIndex);
        if (found === -1) return false;
        nameIndex = found + 1;
      }
      return true;
    };
    
    let best: { userId: number | null, score: number } = { userId: null, score: 0 };

    users.forEach((u) => {
      const nom = normalize(u.nom || '');
      const prenom = normalize(u.prenom || '');
      const denominationSociale = u.denomination_sociale ? normalize(u.denomination_sociale) : null;
      const full1 = `${prenom} ${nom}`.trim();
      const full2 = `${nom} ${prenom}`.trim();
      const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toLowerCase();
      const emailLocal = normalize((u.email || '').split('@')[0] || '');

      let score = 0;
      
      // ============================================
      // PRIORITÉ MAXIMALE : DÉNOMINATION SOCIALE
      // ============================================
      if (denominationSociale && denominationSociale.length > 0) {
        const denomLower = denominationSociale.toLowerCase();
        const denomLen = denomLower.length;
        
        // PRIORITY 0: Si le préfixe est un mot commun, chercher directement la dénomination sociale dans tout le fichier
        if (isCommonWord) {
          // La dénomination sociale trouvée dans le fichier (même si pas au début) = score très élevé
          if (fileNorm.includes(denomLower)) {
            score = Math.max(score, 98); // Score très élevé pour dénomination sociale trouvée après un mot commun
          } else {
            // Chercher des parties de la dénomination sociale
            const denomWords = denomLower.split(/\s+/).filter(w => w.length >= 3);
            let foundWords = 0;
            denomWords.forEach(word => {
              if (fileNorm.includes(word)) foundWords++;
            });
            if (foundWords === denomWords.length && denomWords.length > 0) {
              score = Math.max(score, 96); // Tous les mots de la dénomination trouvés
            } else if (foundWords > 0) {
              score = Math.max(score, 92); // Au moins un mot trouvé
            }
          }
        }
        
        // PRIORITY 1: Exact match with denomination sociale at the beginning (with delimiter)
        if (prefixDelimited && !isCommonWord) {
          const prefixLower = prefixDelimited.toLowerCase();
          
          // Exact match with beginning of denomination sociale
          if (prefixLower === denomLower.substring(0, Math.min(prefixDelimited.length, denomLen))) {
            score = Math.max(score, 100); // Score maximum pour dénomination sociale exacte
          } else if (denomLower.startsWith(prefixLower) || prefixLower.startsWith(denomLower.substring(0, Math.min(prefixLower.length, denomLen)))) {
            score = Math.max(score, 98);
          } else {
            // Check if prefix is a subsequence in denomination sociale
            const checkLength = Math.min(prefixLower.length + 5, denomLen);
            const denomStart = denomLower.substring(0, checkLength);
            if (isSubsequence(prefixLower, denomStart)) {
              score = Math.max(score, 95);
            } else if (denomLower.includes(prefixLower.substring(0, Math.min(3, prefixLower.length)))) {
              score = Math.max(score, 90);
            }
          }
        }
        
        // PRIORITY 2: Match with first characters of filename (without delimiter)
        if (prefix5.length >= 3) {
          const prefix5Lower = prefix5.toLowerCase();
          if (denomLower.startsWith(prefix5Lower) || prefix5Lower.startsWith(denomLower.substring(0, Math.min(prefix5Lower.length, denomLen)))) {
            score = Math.max(score, 97);
          } else if (denomLower.includes(prefix5Lower)) {
            score = Math.max(score, 92);
          }
        }
        
        if (prefix10.length >= 5) {
          const prefix10Lower = prefix10.toLowerCase();
          if (denomLower.startsWith(prefix10Lower) || prefix10Lower.startsWith(denomLower.substring(0, Math.min(prefix10Lower.length, denomLen)))) {
            score = Math.max(score, 99);
          } else if (denomLower.includes(prefix10Lower)) {
            score = Math.max(score, 94);
          }
        }
        
        // PRIORITY 3: Full denomination sociale in filename (augmenté pour prioriser sur nom/prénom)
        if (fileNorm.includes(denomLower)) {
          score = Math.max(score, 95); // Score élevé pour dénomination sociale trouvée dans le fichier
        }
        
        // PRIORITY 4: Partial match (at least 3 characters)
        if (denomLower.length >= 3) {
          const denomStart3 = denomLower.substring(0, 3);
          if (fileNorm.includes(denomStart3)) {
            score = Math.max(score, 80);
          }
        }
      }
      
      // ============================================
      // FALLBACK : NOM/PRÉNOM (si pas de dénomination sociale ou score faible)
      // ============================================
      // Only use nom/prenom matching if denomination sociale didn't give a good match
      // Augmenté le seuil à 90 pour que la dénomination sociale soit toujours prioritaire
      if (score < 90) {
        // PRIORITY 0: Check if prefix matches initials (first letter of firstname + first letter of lastname)
        if (prefixDelimited && prefixDelimited.length === 2) {
          if (prefixDelimited.toLowerCase() === initials) {
            score = Math.max(score, 85);
          }
        }
        if (prefix2.length === 2 && !prefixDelimited) {
          if (prefix2.toLowerCase() === initials) {
            score = Math.max(score, 83);
          }
        }
        
        // LEVEL 1: Prefix with delimiter (ex: "ai_", "mi-", "jean ")
        if (prefixDelimited) {
          const prefixLower = prefixDelimited.toLowerCase();
          const prenomLower = prenom.toLowerCase();
          const nomLower = nom.toLowerCase();
          const prenomLen = prenomLower.length;
          const nomLen = nomLower.length;
          
          // Exact match with beginning of firstname or lastname
          if (prefixLower === prenomLower.substring(0, Math.min(prefixDelimited.length, prenomLen)) ||
              prefixLower === nomLower.substring(0, Math.min(prefixDelimited.length, nomLen)) ||
              prefixLower === `${prenomLower}${nomLower}`.substring(0, Math.min(prefixDelimited.length, prenomLen + nomLen)) ||
              prefixLower === `${nomLower}${prenomLower}`.substring(0, Math.min(prefixDelimited.length, prenomLen + nomLen))) {
            score = Math.max(score, 85);
          } else {
            // Flexible match: check if prefix is a subsequence in first 5-6 characters
            const checkLength = Math.min(prefixLower.length + 4, 6);
            const prenomStart = prenomLower.substring(0, checkLength);
            const nomStart = nomLower.substring(0, checkLength);
            
            if (isSubsequence(prefixLower, prenomStart) || isSubsequence(prefixLower, nomStart)) {
              score = Math.max(score, 75);
            } else if (prenomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length))) || 
                       nomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length)))) {
              score = Math.max(score, 70);
            }
          }
        }
        
        // LEVEL 2: Simple prefix at beginning (2-3 first letters)
        const prenomPrefix2 = prenom.substring(0, 2).toLowerCase();
        const prenomPrefix3 = prenom.substring(0, 3).toLowerCase();
        const nomPrefix2 = nom.substring(0, 2).toLowerCase();
        const nomPrefix3 = nom.substring(0, 3).toLowerCase();
        
        if (prefix2.toLowerCase() === prenomPrefix2 || prefix2.toLowerCase() === nomPrefix2 || prefix2.toLowerCase() === initials) {
          score = Math.max(score, 80);
        }
        if (prefix3.toLowerCase() === prenomPrefix3 || prefix3.toLowerCase() === nomPrefix3) {
          score = Math.max(score, 80);
        }
        
        // LEVEL 3: Full name at the beginning
        if (fileNorm.startsWith(full1) || fileNorm.startsWith(full2)) {
          score = Math.max(score, 75);
        }
        
        // LEVEL 4: Search in entire filename (fallback)
        if (fileNorm === full1 || fileNorm === full2) score = Math.max(score, 70);
        if (fileNorm.includes(full1) || fileNorm.includes(full2)) score = Math.max(score, 65);
        if (fileNorm.includes(prenom) && fileNorm.includes(nom)) score = Math.max(score, 60);
      }

      if (score > best.score) best = { userId: u.id, score };
    });

    // Threshold: accept matches with score >= 60 (lowered to include denomination sociale matches)
    if (best.score < 60) return { userId: null, score: best.score };
    return best;
  };

  // NEW LOGIC: Auto-match and upload directly
  const handleBulkFileSelectAndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Enforce: filename must begin with a letter
    const valid = files.filter(f => /^[A-Za-zÀ-ÿ]/.test(f.name));
    const invalid = files.filter(f => !/^[A-Za-zÀ-ÿ]/.test(f.name)).map(f => f.name);
    
    if (valid.length === 0) {
      showWarning('Aucun fichier valide sélectionné. Les fichiers doivent commencer par une lettre.');
      return;
    }

    // Show invalid files warning
    if (invalid.length > 0) {
      const shouldContinue = window.confirm(
        `⚠️ ${invalid.length} fichier(s) ignoré(s) car leur nom ne commence pas par une lettre:\n${invalid.slice(0, 5).join('\n')}${invalid.length > 5 ? '\n...' : ''}\n\nContinuer avec ${valid.length} fichier(s) valide(s) ?`
      );
      if (!shouldContinue) return;
    }

    setUploading(true);
    setSelectedFiles(valid);

    try {
      // Auto-match each file with a user
      const uploadResults: Array<{fileName: string, userId: number | null, userName: string, success: boolean, error?: string}> = [];
      let successCount = 0;
      let failCount = 0;
      let noMatchCount = 0;

      // Process each file
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        let targetUserId: number | null = null;
        let targetUserName = '';
        let uploadSuccess = false;
        let uploadError = '';

        // If a user is preselected, use that user
        if (selectedUserIdForBulk) {
          targetUserId = Number(selectedUserIdForBulk);
          const user = users.find(u => u.id === targetUserId);
          targetUserName = user ? getUserLabel(user) : `#${targetUserId}`;
        } else {
          // Auto-match with user based on filename
          const matchResult = matchFileToUser(file.name);
          if (matchResult.userId) {
            targetUserId = matchResult.userId;
            const user = users.find(u => u.id === targetUserId);
            targetUserName = user ? getUserLabel(user) : `#${targetUserId}`;
          } else {
            // No match found
            uploadResults.push({
              fileName: file.name,
              userId: null,
              userName: 'Non associé',
              success: false,
              error: 'Aucun utilisateur trouvé pour ce fichier'
            });
            noMatchCount++;
            continue;
          }
        }

        // Upload the file to the matched user
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('user_id', targetUserId.toString());
          formData.append('title', file.name);
          formData.append('bulk_upload', 'true'); // Indiquer que c'est un upload en masse
          // Ajouter la date configurée pour l'affichage
          if (bulkUploadDate) {
            formData.append('display_date', bulkUploadDate);
          }
          // Ajouter l'année du dossier destination
          formData.append('period_year', bulkUploadYear.toString());

          const response = await fetch(buildAPIURL('/bordereaux'), {
            method: 'POST',
            headers: {
              'x-auth-token': localStorage.getItem('token') || ''
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            uploadSuccess = true;
            successCount++;
            
            // Add to recent uploads
            setRecentUploads(prev => [
              {
                archiveId: data.bordereauId || data.id,
                fileUrl: data.fileUrl || data.filePath,
                title: data.title || file.name,
                userId: targetUserId!,
                userLabel: targetUserName,
                createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString(),
                periodYear: data.periodYear || null,
                periodMonth: data.periodMonth || null
              },
              ...prev
            ]);
          } else {
            const errorData = await response.json().catch(() => ({}));
            uploadError = errorData.error || 'Erreur lors de l\'upload';
            uploadSuccess = false;
            failCount++;
          }
        } catch (error) {
          uploadError = error instanceof Error ? error.message : 'Erreur inconnue';
          uploadSuccess = false;
          failCount++;
        }

        uploadResults.push({
          fileName: file.name,
          userId: targetUserId,
          userName: targetUserName,
          success: uploadSuccess,
          error: uploadError || undefined
        });
      }

      // Prepare detailed results for modal
      const successFiles = uploadResults.filter(r => r.success).map(r => ({ fileName: r.fileName, userName: r.userName }));
      const notMatchedFiles = uploadResults.filter(r => !r.success && r.userId === null).map(r => ({ fileName: r.fileName }));
      const failedFiles = uploadResults.filter(r => !r.success && r.userId !== null).map(r => ({ fileName: r.fileName, userName: r.userName, error: r.error || 'Erreur inconnue' }));

      // Show modal with detailed results
      setUploadResultsModal({
        show: true,
        success: successFiles,
        notMatched: notMatchedFiles,
        failed: failedFiles
      });

      if (successCount > 0) {
        showSuccess(`${successCount} fichier(s) uploadé(s) avec succès!`);
      }

      // Reset form
      setSelectedFiles([]);
      setFileUserMapping([]);
      setSelectedUserIdForBulk('');
      setShowBulkUpload(false);
      
      // Reset file input
      const input = e.target;
      if (input) input.value = '';

      // Reload users data
      await loadUsers();
    } catch (error) {
      console.error('Error during bulk upload:', error);
      showError('Erreur lors de l\'upload en masse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour ouvrir/télécharger un bordereau
  const handleOpenBordereau = async (fileUrl: string | null, title: string, bordereauId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Non authentifié');
        return;
      }

      // Si fileUrl est null, construire l'URL depuis l'ID
      if (!fileUrl) {
        // Construire l'URL de téléchargement depuis l'ID
        const apiPath = `/bordereaux/${bordereauId}/download`;
        fileUrl = buildAPIURL(apiPath);
      }

      // Si l'URL contient /download, utiliser fetch avec authentification
      if (fileUrl.includes('/bordereaux/') && fileUrl.includes('/download')) {
        let apiPath: string;
        
        // Extraire le chemin de l'URL complète
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          const urlObj = new URL(fileUrl);
          apiPath = urlObj.pathname; // Ex: /api/bordereaux/29/download
          // Retirer /api si présent pour que buildAPIURL puisse l'ajouter
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', ''); // Ex: /bordereaux/29/download
          }
        } else {
          apiPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', '');
          }
        }
        
        const apiUrl = buildAPIURL(apiPath);
        
        const response = await fetch(apiUrl, {
          headers: {
            'x-auth-token': token
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        // Obtenir le blob
        const blob = await response.blob();
        
        // Nettoyer le nom du fichier (enlever les caractères spéciaux)
        const cleanTitle = (title || 'bordereau')
          .replace(/[<>:"/\\|?*]/g, '_') // Remplacer les caractères invalides
          .replace(/\s+/g, '_') // Remplacer les espaces
          .substring(0, 200); // Limiter la longueur
        
        // Créer une URL blob pour ouvrir dans un nouvel onglet
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Essayer d'ouvrir dans un nouvel onglet (pour les PDF)
        const fileType = blob.type || 'application/pdf';
        if (fileType.includes('pdf') || fileType.includes('image')) {
          // Ouvrir dans un nouvel onglet
          const newWindow = window.open(blobUrl, '_blank');
          if (!newWindow) {
            // Si popup bloquée, télécharger
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = cleanTitle;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          // Nettoyer l'URL après un délai
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        } else {
          // Pour les autres types, télécharger directement
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = cleanTitle;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        }
      } else {
        // Pour les anciens fichiers avec file_path, ouvrir dans un nouvel onglet
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      showError('Erreur lors de l\'ouverture du fichier: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  // Fonction pour supprimer un bordereau
  // Fonction pour modifier la période d'un bordereau
  const handleUpdateBordereauPeriod = async (bordereauId: number) => {
    if (!editPeriodYear || !editPeriodMonth || !editPeriodDay) {
      showWarning('Veuillez sélectionner une année, un mois et un jour');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Non authentifié');
        return;
      }

      const response = await fetch(buildAPIURL(`/bordereaux/${bordereauId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          period_year: parseInt(editPeriodYear),
          period_month: parseInt(editPeriodMonth),
          display_date: `${editPeriodYear}-${editPeriodMonth.padStart(2, '0')}-${editPeriodDay.padStart(2, '0')}`
        })
      });

      if (response.ok) {
        showSuccess(`Période modifiée avec succès ! Le fichier apparaîtra maintenant dans Bordereaux ${editPeriodYear}`);
        setEditingBordereau(null);
        setEditPeriodYear('');
        setEditPeriodMonth('');
        // Recharger les uploads récents en rechargeant la page ou en refetchant
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(errorData.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification bordereau:', error);
      showError('Erreur lors de la modification');
    }
  };

  const handleDeleteBordereau = async (bordereauId: number) => {
    const bordereau = recentUploads.find(r => r.archiveId === bordereauId);
    const fileName = bordereau?.title || 'ce fichier';
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${fileName}" ?\n\nCette action est irréversible et le fichier sera définitivement supprimé.`)) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(bordereauId));
      
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Non authentifié');
        return;
      }

      const response = await fetch(buildAPIURL(`/bordereaux/${bordereauId}`), {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      // Retirer le fichier de la liste
      setRecentUploads(prev => prev.filter(upload => upload.archiveId !== bordereauId));
      
      showSuccess('Fichier supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bordereauId);
        return newSet;
      });
    }
  };

  // Fonctions de filtrage pour les derniers fichiers uploadés
  const getFilteredRecentUploads = () => {
    return recentUploads.filter((r) => {
      if (!r || !r.title) return false;
      
      // Filtre par recherche (nom du fichier ou utilisateur)
      if (recentUploadsFilter.search) {
        const searchLower = recentUploadsFilter.search.toLowerCase();
        if (!r.title.toLowerCase().includes(searchLower) && 
            !(r.userLabel || '').toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtre par utilisateur
      if (recentUploadsFilter.userId && r.userId !== recentUploadsFilter.userId) {
        return false;
      }
      
      // Filtre par année
      if (recentUploadsFilter.year) {
        const fileYear = r.periodYear || (r.createdAt ? new Date(r.createdAt).getFullYear() : null);
        if (fileYear !== recentUploadsFilter.year) {
          return false;
        }
      }
      
      // Filtre par mois
      if (recentUploadsFilter.month) {
        const fileMonth = r.periodMonth || (r.createdAt ? new Date(r.createdAt).getMonth() + 1 : null);
        if (fileMonth !== recentUploadsFilter.month) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Extraire les années disponibles
  const getAvailableYears = () => {
    const years = new Set<number>();
    recentUploads.forEach(r => {
      const year = r.periodYear || (r.createdAt ? new Date(r.createdAt).getFullYear() : null);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Liste des mois
  const getAvailableMonths = () => {
    return [
      { value: 1, label: 'Janvier' },
      { value: 2, label: 'Février' },
      { value: 3, label: 'Mars' },
      { value: 4, label: 'Avril' },
      { value: 5, label: 'Mai' },
      { value: 6, label: 'Juin' },
      { value: 7, label: 'Juillet' },
      { value: 8, label: 'Août' },
      { value: 9, label: 'Septembre' },
      { value: 10, label: 'Octobre' },
      { value: 11, label: 'Novembre' },
      { value: 12, label: 'Décembre' }
    ];
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    // PDF
    if (extension === 'pdf') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H16V12H8V10M8,14H13V16H8V14Z" />
        </svg>
      );
    }
    
    // Word (.doc, .docx)
    if (extension === 'doc' || extension === 'docx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H16V12H8V10M8,14H13V16H8V14Z" />
        </svg>
      );
    }
    
    // Excel (.xls, .xlsx)
    if (extension === 'xls' || extension === 'xlsx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H12V12H8V10M8,14H12V16H8V14M14,10H16V12H14V10M14,14H16V16H14V14Z" />
        </svg>
      );
    }
    
    // PowerPoint (.ppt, .pptx)
    if (extension === 'ppt' || extension === 'pptx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <circle cx="12" cy="13" r="2" />
          <path d="M8,10H16V12H8V10Z" />
        </svg>
      );
    }
    
    // Image
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Fichier générique (par défaut)
    return (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Fonction pour obtenir la couleur du badge selon le type de fichier
  const getFileIconBg = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (extension === 'pdf') {
      return 'bg-gradient-to-br from-red-500 to-red-600';
    }
    if (extension === 'doc' || extension === 'docx') {
      return 'bg-gradient-to-br from-blue-600 to-blue-700';
    }
    if (extension === 'xls' || extension === 'xlsx') {
      return 'bg-gradient-to-br from-green-600 to-green-700';
    }
    if (extension === 'ppt' || extension === 'pptx') {
      return 'bg-gradient-to-br from-orange-500 to-orange-600';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600';
    }
    
    // Par défaut : couleur de la charte graphique
    return 'bg-gradient-to-br from-[#0B1220] to-[#1D4ED8]';
  };

  // Handle bulk file selection (original method - for preview mode)
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Enforce: filename must begin with a letter
    const valid = files.filter(f => /^[A-Za-zÀ-ÿ]/.test(f.name));
    const invalid = files.filter(f => !/^[A-Za-zÀ-ÿ]/.test(f.name)).map(f => f.name);
    setSelectedFiles(valid);
    setInvalidNamedFiles(invalid);
    
    // If a user is preselected, clear mapping; otherwise attempt auto-match
    if (selectedUserIdForBulk) {
      setFileUserMapping([]);
    } else {
      const mapping: {fileIndex: number, userId: number, score: number}[] = [];
      valid.forEach((file, index) => {
        const { userId, score } = matchFileToUser(file.name);
        if (userId) mapping.push({ fileIndex: index, userId, score });
      });
      setFileUserMapping(mapping);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      showWarning('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Upload each file with its matched user
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mapping = selectedUserIdForBulk
          ? { fileIndex: i, userId: Number(selectedUserIdForBulk), score: 100 }
          : fileUserMapping.find(m => m.fileIndex === i);
        
        if (!mapping) {
          console.warn(`No user mapping found for file ${file.name}, skipping...`);
          failCount++;
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', mapping.userId.toString());
        formData.append('title', file.name);
        formData.append('bulk_upload', 'true'); // Indiquer que c'est un upload en masse
        // Ajouter la date configurée pour l'affichage
        if (bulkUploadDate) {
          formData.append('display_date', bulkUploadDate);
        }
        // Ajouter l'année du dossier destination
        formData.append('period_year', bulkUploadYear.toString());
        
        const response = await fetch(buildAPIURL('/bordereaux'), {
          method: 'POST',
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          const u = users.find(u => u.id === mapping.userId);
          setRecentUploads(prev => [
            {
              archiveId: data.bordereauId,
              fileUrl: data.fileUrl || data.filePath,
              title: data.title || file.name,
              userId: mapping.userId,
              userLabel: u ? getUserLabel(u) : `#${mapping.userId}`,
              createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString(),
              periodYear: data.periodYear || null,
              periodMonth: data.periodMonth || null
            },
            ...prev
          ].slice(0, 20));
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to upload file ${file.name}:`, errorData.error || 'Unknown error');
          failCount++;
        }
      }
      
      let message = `✅ ${successCount} fichier(s) uploadé(s) avec succès!`;
      if (failCount > 0) {
        message += `\n⚠️ ${failCount} fichier(s) n'ont pas pu être uploadé(s).`;
      }
      showSuccess(message);
      
      setSelectedFiles([]);
      setFileUserMapping([]);
      setSelectedUserIdForBulk('');
      setShowBulkUpload(false);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      showError('Erreur lors de l\'upload en masse');
    } finally {
      setUploading(false);
    }
  };

  // If not admin, show access denied
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Accès refusé</h1>
          <p className="text-red-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion Comptabilité</h1>
            <p className="text-gray-600">Vue d'ensemble de tous les utilisateurs</p>
          </div>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <span>📤</span>
            <span>Upload en masse</span>
          </button>
        </div>

        {recentUploads.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#0B1220] via-[#1D4ED8] to-[#1E40AF]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Derniers fichiers uploadés</h3>
                  <p className="text-blue-100 text-sm">Gérez et filtrez vos fichiers uploadés</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                  <span className="text-white font-semibold text-lg">
                    {getFilteredRecentUploads().length} / {recentUploads.length}
                  </span>
                  <span className="text-blue-100 text-sm ml-1">fichier(s)</span>
                </div>
              </div>
              
              {/* Filtres Premium */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Recherche */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-white text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Recherche</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nom fichier ou utilisateur..."
                        value={recentUploadsFilter.search}
                        onChange={(e) => setRecentUploadsFilter({ ...recentUploadsFilter, search: e.target.value })}
                        className="w-full px-4 py-2.5 pl-10 text-sm bg-white rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 shadow-lg transition-all placeholder-gray-400"
                      />
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Filtre par utilisateur */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-white text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Utilisateur</span>
                    </label>
                    <select
                      value={recentUploadsFilter.userId}
                      onChange={(e) => setRecentUploadsFilter({ ...recentUploadsFilter, userId: e.target.value ? parseInt(e.target.value) : '' })}
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 shadow-lg transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Tous les utilisateurs</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.prenom} {user.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filtre par année */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-white text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Année</span>
                    </label>
                    <select
                      value={recentUploadsFilter.year}
                      onChange={(e) => setRecentUploadsFilter({ ...recentUploadsFilter, year: e.target.value ? parseInt(e.target.value) : '', month: '' })}
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 shadow-lg transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Toutes les années</option>
                      {getAvailableYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filtre par mois */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-white text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Mois</span>
                    </label>
                    <select
                      value={recentUploadsFilter.month}
                      onChange={(e) => setRecentUploadsFilter({ ...recentUploadsFilter, month: e.target.value ? parseInt(e.target.value) : '' })}
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 shadow-lg transition-all appearance-none cursor-pointer disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!recentUploadsFilter.year}
                    >
                      <option value="">Tous les mois</option>
                      {getAvailableMonths().map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Bouton réinitialiser les filtres */}
                {(recentUploadsFilter.search || recentUploadsFilter.userId || recentUploadsFilter.year || recentUploadsFilter.month) && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <button
                      onClick={() => setRecentUploadsFilter({ search: '', userId: '', year: '', month: '' })}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Réinitialiser les filtres</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {getFilteredRecentUploads().length > 0 ? (
                getFilteredRecentUploads()
                  .filter((r) => r && r.title) // Filtrer les valeurs null/undefined
                  .map((r) => (
                <div key={r.archiveId} className="p-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`flex-shrink-0 w-10 h-10 ${getFileIconBg(r.title)} rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                        {getFileIcon(r.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate group-hover:text-[#1D4ED8] transition-colors">{r.title}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">{r.userLabel || 'Inconnu'}</span>
                          </div>
                          {r.periodYear && (
                            <div className="flex items-center space-x-1 text-xs text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{r.periodYear}{r.periodMonth ? `/${String(r.periodMonth).padStart(2, '0')}` : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleOpenBordereau(r.fileUrl, r.title, r.archiveId)}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-1.5 font-medium"
                      title="Ouvrir le fichier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Ouvrir</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingBordereau(r.archiveId);
                        const createdAt = r.createdAt ? new Date(r.createdAt) : new Date();
                        setEditPeriodYear(r.periodYear?.toString() || createdAt.getFullYear().toString());
                        setEditPeriodMonth(r.periodMonth?.toString() || (createdAt.getMonth() + 1).toString());
                        setEditPeriodDay(createdAt.getDate().toString());
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-1.5 font-medium"
                      title="Modifier la période (année, mois, jour)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Période</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBordereau(r.archiveId)}
                      disabled={deletingIds.has(r.archiveId)}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-1.5 font-medium"
                      title="Supprimer ce fichier (action irréversible)"
                    >
                      {deletingIds.has(r.archiveId) ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Suppression...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Supprimer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Aucun fichier ne correspond aux filtres sélectionnés</p>
                  <p className="text-sm text-gray-400 mb-4">Essayez de modifier vos critères de recherche</p>
                  <button
                    onClick={() => setRecentUploadsFilter({ search: '', userId: '', year: '', month: '' })}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Réinitialiser les filtres</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-800">Liste des utilisateurs ({users.length})</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>Aucun utilisateur enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getUserLabel(user)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">📤 Upload en masse</h3>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
              setSelectedFiles([]);
              setFileUserMapping([]);
              setInvalidNamedFiles([]);
              setBulkUploadDate(new Date().toISOString().split('T')[0]);
                  }}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Folder Destination - Year Selection */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📁 Dossier de destination
                  </label>
                  <select
                    value={bulkUploadYear}
                    onChange={(e) => setBulkUploadYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border-2 border-amber-300 bg-white text-gray-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 font-medium"
                  >
                    <option value={2027}>Bordereaux 2027</option>
                    <option value={2026}>Bordereaux 2026</option>
                    <option value={2025}>Bordereaux 2025</option>
                    <option value={2024}>Bordereaux 2024</option>
                    <option value={2023}>Bordereaux 2023</option>
                  </select>
                  <p className="mt-2 text-xs text-amber-700">
                    ⚠️ Les fichiers seront importés dans le dossier "Bordereaux {bulkUploadYear}" pour chaque utilisateur.
                  </p>
                </div>

                {/* Date Configuration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Date d'affichage pour les utilisateurs
                  </label>
                  <input
                    type="date"
                    value={bulkUploadDate}
                    onChange={(e) => setBulkUploadDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Cette date sera visible par les utilisateurs lors de l'affichage des fichiers. Par défaut: aujourd'hui.
                  </p>
                </div>

                {/* Mode Selection */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mode d'upload :
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="auto"
                        checked={uploadMode === 'auto'}
                        onChange={(e) => {
                          setUploadMode(e.target.value as 'auto' | 'manual');
                          // Reset when switching modes
                          setSelectedFiles([]);
                          setFileUserMapping([]);
                          setInvalidNamedFiles([]);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-800">⚡ Automatique (Recommandé)</span>
                        <p className="text-xs text-gray-600">Upload direct après sélection - Matching automatique</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="manual"
                        checked={uploadMode === 'manual'}
                        onChange={(e) => {
                          setUploadMode(e.target.value as 'auto' | 'manual');
                          // Reset when switching modes
                          setSelectedFiles([]);
                          setFileUserMapping([]);
                          setInvalidNamedFiles([]);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-800">👁️ Manuel</span>
                        <p className="text-xs text-gray-600">Aperçu avant upload - Contrôle total</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {uploadMode === 'auto' ? '📤 Sélectionner et Uploader les fichiers' : 'Sélectionner les fichiers'}
                  </label>
                  {uploading && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-800 font-medium">Upload en cours...</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    onChange={uploadMode === 'auto' ? handleBulkFileSelectAndUpload : handleBulkFileSelect}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      ✅ {selectedFiles.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                  {invalidNamedFiles.length > 0 && (
                    <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠ Certains fichiers ont été ignorés car leur nom ne commence pas par une lettre:
                      <ul className="list-disc ml-5">
                        {invalidNamedFiles.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Preview Mapping (shown only in manual mode when no user is preselected) */}
                {uploadMode === 'manual' && selectedFiles.length > 0 && !selectedUserIdForBulk && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Association fichiers ↔ utilisateurs:
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedFiles.map((file, index) => {
                        const mapping = fileUserMapping.find(m => m.fileIndex === index);
                        const user = mapping ? users.find(u => u.id === mapping.userId) : null;
                        
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              user ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{file.name}</p>
                              {user ? (
                                <div className="flex items-center space-x-2 text-sm">
                                  <p className="text-green-700">✓ → {getUserLabel(user)}</p>
                                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">{Math.round(mapping?.score || 0)}%</span>
                                </div>
                              ) : (
                                <p className="text-red-700 text-sm">
                                  ⚠ Aucun utilisateur trouvé
                                </p>
                              )}
                            </div>
                            {/* Manual override */}
                            <div className="ml-4 w-64">
                              <select
                                value={mapping?.userId || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : 0;
                                  setFileUserMapping((prev) => {
                                    const copy = prev.filter(m => m.fileIndex !== index);
                                    if (val) copy.push({ fileIndex: index, userId: val, score: 100 });
                                    return copy;
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
                              >
                                <option value="">— Assigner manuellement —</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.nom} {u.prenom}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedFiles.length > fileUserMapping.length && (
                      <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
                        <p className="text-amber-800 text-sm">
                          ⚠ {selectedFiles.length - fileUserMapping.length} fichier(s) non associé(s). 
                          Vérifiez les noms de fichiers ou assignez-les manuellement.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Only shown in manual mode */}
                {uploadMode === 'manual' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleBulkUpload}
                      disabled={uploading || selectedFiles.length === 0 || (!selectedUserIdForBulk && fileUserMapping.length === 0)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Upload en cours...' : '🚀 Uploader tous les fichiers'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUpload(false);
                      setSelectedFiles([]);
                      setFileUserMapping([]);
                        setInvalidNamedFiles([]);
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                  >
                    Annuler
                  </button>
                </div>
                )}
                
                {/* Close button for auto mode */}
                {uploadMode === 'auto' && !uploading && (
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setSelectedFiles([]);
                        setFileUserMapping([]);
                        setInvalidNamedFiles([]);
                      }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour modifier la période */}
        {editingBordereau && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">📅 Modifier la période</h3>
              <p className="text-sm text-gray-600 mb-4">
                Déplacer ce fichier vers une autre période (ex: Bordereaux 2024)
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année *</label>
                  <select
                    value={editPeriodYear}
                    onChange={(e) => setEditPeriodYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mois *</label>
                  <select
                    value={editPeriodMonth}
                    onChange={(e) => setEditPeriodMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jour *</label>
                  <select
                    value={editPeriodDay}
                    onChange={(e) => setEditPeriodDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingBordereau(null);
                    setEditPeriodYear('');
                    setEditPeriodMonth('');
                    setEditPeriodDay('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateBordereauPeriod(editingBordereau)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Results Modal */}
      {uploadResultsModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
              <h2 className="text-xl font-bold">📊 Résultats de l'import</h2>
              <p className="text-blue-100 text-sm mt-1">
                {uploadResultsModal.success.length + uploadResultsModal.notMatched.length + uploadResultsModal.failed.length} fichier(s) traité(s)
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Success */}
              {uploadResultsModal.success.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm">✅</span>
                    {uploadResultsModal.success.length} fichier(s) importé(s) avec succès
                  </h3>
                  <div className="bg-green-50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                    {uploadResultsModal.success.map((f, i) => (
                      <div key={i} className="text-sm text-green-800 flex justify-between">
                        <span className="truncate flex-1">{f.fileName}</span>
                        <span className="text-green-600 ml-2">→ {f.userName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Matched */}
              {uploadResultsModal.notMatched.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-700 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm">⚠️</span>
                    {uploadResultsModal.notMatched.length} fichier(s) non associé(s)
                  </h3>
                  <p className="text-sm text-orange-600 mb-2">
                    Ces fichiers n'ont pas pu être associés à un utilisateur. Vérifiez que le nom du fichier correspond à la dénomination sociale.
                  </p>
                  <div className="bg-orange-50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                    {uploadResultsModal.notMatched.map((f, i) => (
                      <div key={i} className="text-sm text-orange-800">
                        📄 {f.fileName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed */}
              {uploadResultsModal.failed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-sm">❌</span>
                    {uploadResultsModal.failed.length} fichier(s) en erreur
                  </h3>
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {uploadResultsModal.failed.map((f, i) => (
                      <div key={i} className="text-sm">
                        <div className="text-red-800 font-medium">{f.fileName}</div>
                        <div className="text-red-600 text-xs">→ {f.userName}: {f.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setUploadResultsModal({ show: false, success: [], notMatched: [], failed: [] })}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionComptabilitePage;

