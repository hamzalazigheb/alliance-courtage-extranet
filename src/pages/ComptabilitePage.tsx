import React, { useState, useEffect } from 'react';
import { User, BordereauFile } from '../types';
import { buildAPIURL, buildFileURL } from '../api';

// Comptabilité Page Component
function ComptabilitePage({ currentUser, bordereaux }: { currentUser: User | null, bordereaux: BordereauFile[] }) {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [allUserBordereaux, setAllUserBordereaux] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = currentUser?.role === 'admin';
  
  // Load bordereaux from database
  useEffect(() => {
    const loadUserBordereaux = async () => {
      if (!currentUser?.id) return;
      try {
        setLoading(true);
        
        // Si admin : charger tous les bordereaux (sauf ceux des admins)
        // Si user : charger seulement ses propres bordereaux
        const apiUrl = isAdmin 
          ? buildAPIURL(`/bordereaux?year=${selectedYear}`)
          : buildAPIURL(`/bordereaux?user_id=${currentUser.id}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Si admin, les données sont déjà filtrées (pas de bordereaux d'admins)
          // Si user, filtrer seulement par user_id
          const allData = isAdmin 
            ? data 
            : data.filter((b: any) => {
                const fileUserId = typeof b.userId === 'string' ? parseInt(b.userId) : b.userId;
                const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
                return fileUserId === currentUserId;
              });
          
          setAllUserBordereaux(allData);
          
          // Extraire toutes les années disponibles depuis les bordereaux
          const years = new Set<string>();
          allData.forEach((b: any) => {
            const year = b.periodYear 
              ? b.periodYear.toString() 
              : (b.createdAt ? new Date(b.createdAt).getFullYear().toString() : null);
            if (year) {
              years.add(year);
            }
          });
          
          // Trier les années par ordre décroissant
          const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
          
          // Si aucune année trouvée, utiliser les années par défaut
          if (sortedYears.length === 0) {
            sortedYears.push('2026', '2025', '2024');
          } else {
            // S'assurer que 2026 est présent si on est en 2025 ou après
            const currentYear = new Date().getFullYear();
            if (currentYear >= 2025 && !sortedYears.includes('2026')) {
              sortedYears.unshift('2026');
            }
          }
          
          setAvailableYears(sortedYears);
          
          // Si l'année sélectionnée n'est pas dans la liste, sélectionner la première année disponible
          if (!sortedYears.includes(selectedYear) && sortedYears.length > 0) {
            setSelectedYear(sortedYears[0]);
          }
          
          // Filter by selected year
          const filteredData = allData.filter((b: any) => {
            if (selectedYear) {
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
      } finally {
        setLoading(false);
      }
    };
    loadUserBordereaux();
  }, [currentUser?.id, selectedYear, isAdmin]);

  // Fonction pour télécharger/ouvrir un fichier
  const handleDownload = async (fileUrl: string, fileName: string) => {
    console.log('📥 Tentative de téléchargement de:', fileName);
    
    if (fileUrl.includes('/bordereaux/') && fileUrl.includes('/download')) {
      try {
        const token = localStorage.getItem('token');
        let apiPath: string;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          const urlObj = new URL(fileUrl);
          apiPath = urlObj.pathname;
          if (apiPath.startsWith('/api/')) {
            apiPath = apiPath.replace('/api', '');
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
      window.open(fileUrl, '_blank');
    }
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (extension === 'pdf') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H16V12H8V10M8,14H13V16H8V14Z" />
        </svg>
      );
    }
    if (extension === 'doc' || extension === 'docx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H16V12H8V10M8,14H13V16H8V14Z" />
        </svg>
      );
    }
    if (extension === 'xls' || extension === 'xlsx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,10H12V12H8V10M8,14H12V16H8V14M14,10H16V12H14V10M14,14H16V16H14V14Z" />
        </svg>
      );
    }
    if (extension === 'ppt' || extension === 'pptx') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <circle cx="12" cy="13" r="2" />
          <path d="M8,10H16V12H8V10Z" />
        </svg>
      );
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
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
    return 'bg-gradient-to-br from-[#0B1220] to-[#1D4ED8]';
  };

  // Transform bordereaux data for display
  const displayFiles = userFiles.map(file => ({
    id: `bordereau_${file.id}`,
    fileName: file.title || file.filePath?.split('/').pop() || 'Unknown',
    title: file.title,
    uploadDate: file.createdAt,
    month: file.periodMonth || (file.createdAt ? new Date(file.createdAt).getMonth() + 1 : null),
    monthName: file.periodMonth 
      ? new Date(2000, file.periodMonth - 1).toLocaleString('fr-FR', { month: 'long' })
      : (file.createdAt ? new Date(file.createdAt).toLocaleString('fr-FR', { month: 'long' }) : 'Unknown'),
    year: file.periodYear?.toString() || new Date(file.createdAt).getFullYear().toString(),
    userId: file.userId?.toString() || '',
    userLabel: file.userLabel || 'Utilisateur',
    uploadedBy: file.uploadedByLabel || 'Admin',
    file_path: file.filePath,
    fileUrl: file.fileUrl
  }));

  // Grouper par mois (pour l'affichage admin)
  const bordereauxByMonth = displayFiles.reduce((acc, file) => {
    const monthKey = file.month || 'unknown';
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(file);
    return acc;
  }, {} as Record<number | string, any[]>);

  // Liste des mois pour l'affichage
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">COMPTABILITÉ</h1>
            <p className="text-gray-600 text-lg">
              {isAdmin 
                ? "Vue d'ensemble des bordereaux comptables par année et par mois (tous les utilisateurs)"
                : "Gestion des bordereaux comptables par année"
              }
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
            <>
              <button
                onClick={() => setSelectedYear("2026")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedYear === "2026"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                2026
              </button>
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

      {/* Monthly Folders - Design Premium */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {isAdmin 
            ? `Bordereaux ${selectedYear} - Tous les utilisateurs`
            : `Bordereaux ${selectedYear} - ${currentUser?.name}`
          }
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : Object.keys(bordereauxByMonth).length > 0 ? (
          <div className="space-y-6">
            {/* Afficher les mois dans l'ordre (1-12) */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthNum) => {
              const monthKey = monthNum;
              const files = bordereauxByMonth[monthKey] || [];
              if (files.length === 0) return null;
              
              return (
                <div key={monthNum} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{monthNames[monthNum - 1]} {selectedYear}</h3>
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-md">
                      {files.length} fichier{files.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div key={file.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 border border-gray-200">
                        <div className="flex items-start gap-3 mb-3">
                          {/* Icône avec couleur selon le type */}
                          <div className={`${getFileIconBg(file.fileName)} rounded-lg p-2.5 flex-shrink-0 shadow-md`}>
                            {getFileIcon(file.fileName)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate mb-1" title={file.fileName}>
                              {file.fileName}
                            </p>
                            {isAdmin && (
                              <p className="text-xs text-gray-500 truncate mb-1">
                                👤 {file.userLabel}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              📅 {new Date(file.uploadDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            const downloadUrl = file.fileUrl || (file.file_path ? buildFileURL(file.file_path) : '');
                            handleDownload(downloadUrl, file.fileName || file.title);
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                          📥 Ouvrir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium">Aucun bordereau disponible</p>
            <p className="text-sm">
              {isAdmin 
                ? `Aucun fichier n'a été uploadé pour les utilisateurs en ${selectedYear}`
                : `Aucun fichier n'a été uploadé pour ${currentUser?.name} en ${selectedYear}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Résumé {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {displayFiles.length}
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
