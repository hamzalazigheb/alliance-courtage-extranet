import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { buildAPIURL } from '../api';

// Gestion Comptabilité Page Component - Display all users for admin
function GestionComptabilitePage({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<Array<{
    id: number;
    email: string;
    nom: string;
    prenom: string;
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
  const [recentUploads, setRecentUploads] = useState<Array<{ archiveId: number; fileUrl: string | null; title: string; userId: number | null; userLabel: string; createdAt: string; hasFileContent?: boolean }>>([]);
  const [uploadMode, setUploadMode] = useState<'auto' | 'manual'>('auto'); // 'auto' = direct upload, 'manual' = preview first
  const [bulkUploadDate, setBulkUploadDate] = useState<string>(new Date().toISOString().split('T')[0]); // Date configurable pour l'affichage
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set()); // Track which files are being deleted

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      // Load recent bordereaux uploads from backend so they persist across sessions
      (async () => {
        try {
          const res = await fetch(buildAPIURL('/bordereaux/recent?limit=20'), {
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

  // Return best userId and a confidence score [0..100]
  // NEW LOGIC: Prioritizes prefixes at the beginning of filename
  const matchFileToUser = (fileName: string): { userId: number | null, score: number } => {
    // Extract prefix BEFORE normalization to preserve delimiters
    const fileNameLower = fileName.toLowerCase();
    
    // Extract prefix from beginning: either before delimiter (_ - space) or first 2-3 characters
    const prefixWithDelimiter = fileNameLower.match(/^([a-zà-ÿ]{2,15})[_-\s\.]/);
    const prefixDelimited = prefixWithDelimiter ? prefixWithDelimiter[1] : null;
    const prefix2 = fileNameLower.substring(0, 2);
    const prefix3 = fileNameLower.substring(0, 3);
    
    const fileNorm = normalize(fileName);
    
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
      const nom = normalize(u.nom);
      const prenom = normalize(u.prenom);
      const full1 = `${prenom} ${nom}`.trim();
      const full2 = `${nom} ${prenom}`.trim();
      const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toLowerCase();
      const emailLocal = normalize((u.email || '').split('@')[0] || '');

      let score = 0;
      
      // PRIORITY 0: Check if prefix matches initials (first letter of firstname + first letter of lastname)
      // This handles cases like "ai" for "Amir IT" (a from Amir, i from IT)
      if (prefixDelimited && prefixDelimited.length === 2) {
        if (prefixDelimited.toLowerCase() === initials) {
          score = Math.max(score, 100);
        }
      }
      if (prefix2.length === 2 && !prefixDelimited) {
        if (prefix2.toLowerCase() === initials) {
          score = Math.max(score, 98);
        }
      }
      
      // LEVEL 1: Prefix with delimiter (ex: "ai_", "mi-", "jean ")
      // Highest priority: exact match at the beginning with separator
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
          score = Math.max(score, 100);
        } else {
          // Flexible match: check if prefix is a subsequence in first 5-6 characters
          // This handles cases like "ai" for "Amir" (a-m-i-r contains "ai" as subsequence)
          const checkLength = Math.min(prefixLower.length + 4, 6);
          const prenomStart = prenomLower.substring(0, checkLength);
          const nomStart = nomLower.substring(0, checkLength);
          
          // Check if prefix is a subsequence (all letters appear in order)
          if (isSubsequence(prefixLower, prenomStart) || isSubsequence(prefixLower, nomStart)) {
            score = Math.max(score, 92);
          } else if (prenomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length))) || 
                     nomLower.includes(prefixLower.substring(0, Math.min(2, prefixLower.length)))) {
            // Fallback: at least the first 2 letters match somewhere
            score = Math.max(score, 75);
          }
        }
      }
      
      // LEVEL 2: Simple prefix at beginning (2-3 first letters)
      // High priority: first letters match beginning of firstname/lastname/initials
      const prenomPrefix2 = prenom.substring(0, 2).toLowerCase();
      const prenomPrefix3 = prenom.substring(0, 3).toLowerCase();
      const nomPrefix2 = nom.substring(0, 2).toLowerCase();
      const nomPrefix3 = nom.substring(0, 3).toLowerCase();
      
      // Exact match
      if (prefix2.toLowerCase() === prenomPrefix2 || prefix2.toLowerCase() === nomPrefix2 || prefix2.toLowerCase() === initials) {
        score = Math.max(score, 95);
      }
      if (prefix3.toLowerCase() === prenomPrefix3 || prefix3.toLowerCase() === nomPrefix3) {
        score = Math.max(score, 95);
      }
      
      // Flexible match for prefixes without delimiter (for "ai" in "amir")
      if (prefix2.length >= 2 && !prefixDelimited) {
        const prefix2Lower = prefix2.toLowerCase();
        const prenomStart5 = prenom.substring(0, 5).toLowerCase();
        const nomStart5 = nom.substring(0, 5).toLowerCase();
        
        // Check if prefix is a subsequence (all letters appear in order)
        if (isSubsequence(prefix2Lower, prenomStart5) || isSubsequence(prefix2Lower, nomStart5)) {
          score = Math.max(score, 88);
        }
      }
      
      // LEVEL 3: Initials at the beginning
      if (fileNorm.substring(0, 2).toLowerCase() === initials) {
        score = Math.max(score, 90);
      }
      
      // LEVEL 4: Full name at the beginning
      if (fileNorm.startsWith(full1) || fileNorm.startsWith(full2)) {
        score = Math.max(score, 85);
      }
      
      // LEVEL 5: Search in entire filename (fallback - original logic)
      if (fileNorm === full1 || fileNorm === full2) score = Math.max(score, 80);
      if (fileNorm.includes(full1) || fileNorm.includes(full2)) score = Math.max(score, 75);
      if (fileNorm.includes(prenom) && fileNorm.includes(nom)) score = Math.max(score, 70);
      if (emailLocal && (emailLocal.includes(nom) || emailLocal.includes(prenom)) && fileNorm.includes(emailLocal)) score = Math.max(score, 70);
      if (fileNorm.includes(initials)) score = Math.max(score, 65);
      if (nom.length >= 3 && fileNorm.includes(nom.substring(0, 3))) score = Math.max(score, 60);
      if (prenom.length >= 3 && fileNorm.includes(prenom.substring(0, 3))) score = Math.max(score, 60);

      if (score > best.score) best = { userId: u.id, score };
    });

    // Threshold: accept matches with score >= 70 (lowered to include prefix matches)
    if (best.score < 70) return { userId: null, score: best.score };
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
      alert('Aucun fichier valide sélectionné. Les fichiers doivent commencer par une lettre.');
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
          targetUserName = user ? `${user.nom} ${user.prenom}` : `#${targetUserId}`;
        } else {
          // Auto-match with user based on filename
          const matchResult = matchFileToUser(file.name);
          if (matchResult.userId) {
            targetUserId = matchResult.userId;
            const user = users.find(u => u.id === targetUserId);
            targetUserName = user ? `${user.nom} ${user.prenom}` : `#${targetUserId}`;
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
                createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString()
              },
              ...prev
            ].slice(0, 20));
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

      // Show summary
      let message = `✅ ${successCount} fichier(s) uploadé(s) avec succès!\n`;
      if (noMatchCount > 0) {
        message += `⚠️ ${noMatchCount} fichier(s) non associé(s) (aucun utilisateur trouvé)\n`;
      }
      if (failCount > 0) {
        message += `❌ ${failCount} fichier(s) n'ont pas pu être uploadé(s)\n`;
      }

      // Show detailed results
      const detailedResults = uploadResults.map(r => {
        if (r.success) {
          return `✅ ${r.fileName} → ${r.userName}`;
        } else if (r.userId === null) {
          return `⚠️ ${r.fileName} → Non associé`;
        } else {
          return `❌ ${r.fileName} → ${r.userName} (${r.error})`;
        }
      }).join('\n');

      alert(`${message}\n\nDétails:\n${detailedResults}`);

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
      alert('Erreur lors de l\'upload en masse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour ouvrir/télécharger un bordereau
  const handleOpenBordereau = async (fileUrl: string | null, title: string, bordereauId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Non authentifié');
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
        
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title || 'bordereau';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Pour les anciens fichiers avec file_path, ouvrir dans un nouvel onglet
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      alert('Erreur lors de l\'ouverture du fichier: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  // Fonction pour supprimer un bordereau
  const handleDeleteBordereau = async (bordereauId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(bordereauId));
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Non authentifié');
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
      
      alert('Fichier supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bordereauId);
        return newSet;
      });
    }
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
      alert('Veuillez sélectionner au moins un fichier');
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
              userLabel: u ? `${u.nom} ${u.prenom}` : `#${mapping.userId}`,
              createdAt: bulkUploadDate ? new Date(bulkUploadDate).toISOString() : new Date().toISOString()
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
      alert(message);
      
      setSelectedFiles([]);
      setFileUserMapping([]);
      setSelectedUserIdForBulk('');
      setShowBulkUpload(false);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Erreur lors de l\'upload en masse');
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
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <h3 className="text-xl font-bold text-gray-800">Derniers fichiers uploadés</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentUploads
                .filter((r) => r && r.title) // Filtrer les valeurs null/undefined
                .map((r) => (
                <div key={r.archiveId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-sm text-gray-600">→ {r.userLabel || 'Inconnu'}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleOpenBordereau(r.fileUrl, r.title, r.archiveId)}
                      className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Ouvrir le fichier"
                    >
                      👁️ Ouvrir
                    </button>
                    <button
                      onClick={() => handleDeleteBordereau(r.archiveId)}
                      disabled={deletingIds.has(r.archiveId)}
                      className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Supprimer ce fichier"
                    >
                      {deletingIds.has(r.archiveId) ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Suppression...</span>
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          <span>Supprimer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
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
                        <div className="text-sm font-medium text-gray-900">{user.nom} {user.prenom}</div>
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
                                  <p className="text-green-700">✓ → {user.nom} {user.prenom}</p>
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
      </div>
    </div>
  );
}

export default GestionComptabilitePage;

