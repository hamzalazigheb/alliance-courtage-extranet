import React, { useState, useEffect } from 'react';
import { User, BordereauFile } from '../types';
import { buildAPIURL, buildFileURL } from '../api';

// Comptabilité Page Component
function ComptabilitePage({ currentUser, bordereaux }: { currentUser: User | null, bordereaux: BordereauFile[] }) {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [allUserBordereaux, setAllUserBordereaux] = useState<any[]>([]);
  
  // Load bordereaux from database for current user
  useEffect(() => {
    const loadUserBordereaux = async () => {
      if (!currentUser?.id) return;
      try {
        // Load bordereaux from new API
        // IMPORTANT: In ComptabilitePage, even admins should see only their own files
        const response = await fetch(buildAPIURL(`/bordereaux?user_id=${currentUser.id}`), {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          
          // Filtrer seulement par user_id (sans filtrer par année pour obtenir toutes les années)
          const allData = data.filter((b: any) => {
            const fileUserId = typeof b.userId === 'string' ? parseInt(b.userId) : b.userId;
            const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
            return fileUserId === currentUserId;
          });
          
          setAllUserBordereaux(allData);
          
          // Extraire toutes les années disponibles depuis les bordereaux
          const years = new Set<string>();
          allData.forEach((b: any) => {
            // Utiliser periodYear si disponible, sinon YEAR(createdAt) comme fallback
            const year = b.periodYear 
              ? b.periodYear.toString() 
              : (b.createdAt ? new Date(b.createdAt).getFullYear().toString() : null);
            
            if (year) {
              years.add(year);
            }
          });
          
          // Trier les années par ordre décroissant et convertir en tableau
          const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
          
          // Si aucune année trouvée, utiliser les années par défaut
          if (sortedYears.length === 0) {
            sortedYears.push('2026', '2025', '2024');
          } else {
            // S'assurer que 2026 est présent si on est en 2026 ou après
            const currentYear = new Date().getFullYear();
            if (currentYear >= 2026 && !sortedYears.includes('2026')) {
              sortedYears.unshift('2026');
            }
          }
          
          setAvailableYears(sortedYears);
          
          // Si l'année sélectionnée n'est pas dans la liste, sélectionner la première année disponible
          if (!sortedYears.includes(selectedYear) && sortedYears.length > 0) {
            setSelectedYear(sortedYears[0]);
          }
          
          // Filter by selected year - utiliser periodYear si disponible, sinon YEAR(createdAt)
          const filteredData = allData.filter((b: any) => {
            if (selectedYear) {
              // Utiliser periodYear si disponible, sinon YEAR(createdAt)
              const bordereauYear = b.periodYear 
                ? b.periodYear.toString() 
                : (b.createdAt ? new Date(b.createdAt).getFullYear().toString() : null);
              
              if (!bordereauYear || bordereauYear !== selectedYear) {
                return false;
              }
            }
            return true;
          });
          setUserFiles(filteredData);
        }
      } catch (error) {
        console.error('Error loading user bordereaux:', error);
      }
    };
    loadUserBordereaux();
  }, [currentUser?.id, selectedYear]);
  
  // Debug simple pour vérifier le chargement
  console.log('ComptabilitePage loaded for user:', currentUser?.name);

  // Fonction pour télécharger/ouvrir un fichier
  const handleDownload = async (fileUrl: string, fileName: string) => {
    console.log('📥 Tentative de téléchargement de:', fileName);
    
    // Si l'URL est une route API qui nécessite l'authentification, utiliser fetch
    if (fileUrl.includes('/bordereaux/') && fileUrl.includes('/download')) {
      try {
        const token = localStorage.getItem('token');
        
        // Extraire le chemin de l'URL complète ou utiliser directement
        let apiPath: string;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          // URL complète - extraire le chemin après le domaine
          const urlObj = new URL(fileUrl);
          apiPath = urlObj.pathname; // Ex: /api/bordereaux/29/download
          // Retirer /api si présent pour que buildAPIURL puisse l'ajouter
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', ''); // Ex: /bordereaux/29/download
          }
        } else {
          // Chemin relatif
          apiPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
          // Retirer /api si présent
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', '');
          }
        }
        
        // buildAPIURL attend un chemin relatif (sans /api au début)
        const apiUrl = buildAPIURL(apiPath);
        
        console.log('Downloading from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'x-auth-token': token || ''
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || 'bordereau.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } else {
          const errorText = await response.text();
          console.error('Download error:', errorText);
          alert('Erreur lors du téléchargement du fichier');
        }
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Erreur lors du téléchargement du fichier');
      }
    } else {
      // Pour les anciens fichiers (file_path direct) ou autres URLs
      window.open(fileUrl, '_blank');
    }
  };


  // Transform bordereaux data for display
  const displayFiles = userFiles.map(file => ({
    id: `bordereau_${file.id}`,
    fileName: file.title || file.filePath?.split('/').pop() || 'Unknown',
    title: file.title,
    uploadDate: file.createdAt,
    month: file.periodMonth ? new Date(2000, file.periodMonth - 1).toLocaleString('fr-FR', { month: 'long' }) : 
            file.createdAt ? new Date(file.createdAt).toLocaleString('fr-FR', { month: 'long' }) : 'Unknown',
    year: file.periodYear?.toString() || new Date(file.createdAt).getFullYear().toString(),
    userId: file.userId?.toString() || '',
    uploadedBy: file.uploadedByLabel || 'Admin',
    file_path: file.filePath, // Keep for backward compatibility
    fileUrl: file.fileUrl // New: URL for base64 files stored in DB
  }));
  
  // Only use bordereaux from API (no longer combining with old bordereaux state)
  const allUserFiles = displayFiles;

  // Grouper par mois (including files from database)
  const bordereauxByMonth = allUserFiles.reduce((acc, file) => {
    if (!acc[file.month]) {
      acc[file.month] = [];
    }
    acc[file.month].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  // Debug: Afficher les données dans la console
  console.log('🔍 Debug Comptabilité pour', currentUser?.name, ':', {
    currentUser: currentUser,
    selectedYear: selectedYear,
    allBordereaux: bordereaux,
    userFiles: userFiles,
    displayFiles: displayFiles,
    bordereauxByMonth: bordereauxByMonth,
    // Debug supplémentaire
    totalUserFiles: userFiles.length,
    totalDisplayFiles: displayFiles.length
  });

  // Données des dossiers annuels
  const yearlyFolders = {
    "2025": {
      months: [
        { name: "Janvier", files: 12, lastUpdate: "15/01/2025" },
        { name: "Février", files: 8, lastUpdate: "14/02/2025" },
        { name: "Mars", files: 15, lastUpdate: "20/03/2025" },
        { name: "Avril", files: 0, lastUpdate: "En attente" },
        { name: "Mai", files: 0, lastUpdate: "En attente" },
        { name: "Juin", files: 0, lastUpdate: "En attente" },
        { name: "Juillet", files: 0, lastUpdate: "En attente" },
        { name: "Août", files: 0, lastUpdate: "En attente" },
        { name: "Septembre", files: 0, lastUpdate: "En attente" },
        { name: "Octobre", files: 0, lastUpdate: "En attente" },
        { name: "Novembre", files: 0, lastUpdate: "En attente" },
        { name: "Décembre", files: 0, lastUpdate: "En attente" }
      ]
    },
    "2024": {
      months: [
        { name: "Janvier", files: 18, lastUpdate: "15/01/2024" },
        { name: "Février", files: 14, lastUpdate: "14/02/2024" },
        { name: "Mars", files: 16, lastUpdate: "20/03/2024" },
        { name: "Avril", files: 12, lastUpdate: "18/04/2024" },
        { name: "Mai", files: 15, lastUpdate: "22/05/2024" },
        { name: "Juin", files: 13, lastUpdate: "19/06/2024" },
        { name: "Juillet", files: 11, lastUpdate: "17/07/2024" },
        { name: "Août", files: 9, lastUpdate: "14/08/2024" },
        { name: "Septembre", files: 17, lastUpdate: "21/09/2024" },
        { name: "Octobre", files: 14, lastUpdate: "18/10/2024" },
        { name: "Novembre", files: 16, lastUpdate: "20/11/2024" },
        { name: "Décembre", files: 19, lastUpdate: "23/12/2024" }
      ]
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">COMPTABILITÉ</h1>
            <p className="text-gray-600 text-lg">
              Gestion des bordereaux comptables par année
            </p>
          </div>
        </div>
      </div>

      {/* Year Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sélectionner l'année</h2>
        <div className="flex flex-wrap gap-3">
          {availableYears.length > 0 ? (
            availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedYear === year
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {year}
              </button>
            ))
          ) : (
            // Fallback si aucune année n'est disponible
            <>
              <button
                onClick={() => setSelectedYear("2025")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedYear === "2025"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setSelectedYear("2024")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedYear === "2024"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                2024
              </button>
            </>
          )}
        </div>
      </div>

      {/* Monthly Folders */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Bordereaux {selectedYear} - {currentUser?.name}
        </h2>
        
        {Object.keys(bordereauxByMonth).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(bordereauxByMonth).map(([month, files]) => (
              <div key={month} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{month}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    files.length > 0 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {files.length} fichier{files.length > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                          <span className="truncate font-medium text-sm" title={file.fileName}>{file.fileName}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          Uploadé le: {new Date(file.uploadDate).toLocaleDateString('fr-FR')} par {file.uploadedBy}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            // Use fileUrl if available (for base64 files), otherwise use file_path
                            const downloadUrl = file.fileUrl || (file.file_path ? buildFileURL(file.file_path) : '');
                            handleDownload(downloadUrl, file.fileName || file.title);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium">Aucun bordereau disponible</p>
            <p className="text-sm">Aucun fichier n'a été uploadé pour {currentUser?.name} en {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Résumé {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {allUserFiles.length}
            </div>
            <div className="text-sm text-gray-600">Total bordereaux</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(bordereauxByMonth).length}
            </div>
            <div className="text-sm text-gray-600">Mois avec fichiers</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {12 - Object.keys(bordereauxByMonth).length}
            </div>
            <div className="text-sm text-gray-600">Mois en attente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComptabilitePage;

