import React, { useState, useEffect } from "react";
import { formationsAPI, buildAPIURL, buildFileURL } from '../api';
import { User } from '../types';

export default function ReglementairePage({ currentUser }: { currentUser: User | null }) {
  const [expandedFolders, setExpandedFolders] = useState<{[key: string]: boolean}>({});
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingReglementaire, setLoadingReglementaire] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedFormationType, setSelectedFormationType] = useState('validantes'); // 'validantes' ou 'obligatoires'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'CIF', 'IAS', 'IOB', 'IMMOBILIER'
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nom_document: '',
    date: '',
    heures: '',
    categories: [] as string[],
    delivree_par: '',
    year: '2025',
    file: null as File | null
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Load réglementaire folders and documents from API
  useEffect(() => {
    const loadReglementaire = async () => {
      try {
        setLoadingReglementaire(true);
        const token = localStorage.getItem('token');
        
        // Load folders
        const foldersResponse = await fetch(buildAPIURL('/reglementaire/folders'), {
          headers: { 'x-auth-token': token || '' }
        });
        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json();
          setFolders(foldersData);
        }
        
        // Load documents
        const documentsResponse = await fetch(buildAPIURL('/reglementaire/documents'), {
          headers: { 'x-auth-token': token || '' }
        });
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData);
        }
      } catch (error) {
        console.error('Error loading réglementaire:', error);
      } finally {
        setLoadingReglementaire(false);
      }
    };
    loadReglementaire();
  }, []);

  // Load formations from API
  useEffect(() => {
    const loadFormations = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const data = await formationsAPI.getAll({ year: selectedYear });
        setFormations(data);
      } catch (error) {
        console.error('Error loading formations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFormations();
  }, [selectedYear, currentUser?.id]);

  // Handle form submission
  const handleSubmitFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.nom_document || !formData.date || !formData.heures || formData.categories.length === 0) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    // Valider le format des heures
    if (!validateHoursFormat(formData.heures)) {
      alert('Format d\'heures invalide. Utilisez le format HH/MM (ex: 15/30 pour 15 heures 30 minutes)');
      return;
    }

    // Valider les heures minimum par catégorie
    const minHoursByCategory: Record<string, number> = {
      'IAS': 15,
      'CIF': 7,
      'IMMO': 14,
      'IMMOBILIER': 14,
      'IOBSP': 7,
      'IOB': 7
    };

    const heuresDecimal = parseHHMMToDecimal(formData.heures);
    const validationErrors: string[] = [];
    
    for (const category of formData.categories) {
      const minHours = minHoursByCategory[category.toUpperCase()];
      if (minHours && heuresDecimal < minHours) {
        validationErrors.push(`${category}: minimum ${minHours} heures requis (vous avez déclaré ${formatHoursToHHMM(heuresDecimal)})`);
      }
    }

    if (validationErrors.length > 0) {
      alert('Heures insuffisantes pour les catégories sélectionnées:\n' + validationErrors.join('\n'));
      return;
    }

    setSubmitting(true);
    try {
      const formationData = {
        file: formData.file,
        nom_document: formData.nom_document,
        date: formData.date,
        heures: formData.heures, // Envoyer en format HH/MM, le backend le convertira
        categories: formData.categories,
        delivree_par: formData.delivree_par,
        year: formData.year
      };

      const data = await formationsAPI.create(formationData);
      alert('✅ ' + data.message);
      setShowAddForm(false);
      setFormData({
        nom_document: '',
        date: '',
        heures: '',
        categories: [],
        delivree_par: '',
        year: selectedYear,
        file: null
      });
      // Reload formations
      const reloadData = await formationsAPI.getAll({ year: selectedYear });
      setFormations(reloadData);
    } catch (error: any) {
      console.error('Error submitting formation:', error);
      alert('Erreur: ' + (error.message || 'Erreur lors de la soumission de la formation'));
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Convertir heures décimales en format HH/MM
  const formatHoursToHHMM = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}/${minutes.toString().padStart(2, '0')}`;
  };

  // Convertir format HH/MM en heures décimales
  const parseHHMMToDecimal = (hhmm: string): number => {
    if (!hhmm || !hhmm.includes('/')) {
      return parseFloat(hhmm) || 0;
    }
    const [hours, minutes] = hhmm.split('/').map(Number);
    return hours + (minutes / 60);
  };

  // Valider le format HH/MM
  const validateHoursFormat = (value: string): boolean => {
    if (!value) return false;
    if (!value.includes('/')) {
      // Accepter aussi les nombres simples
      return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
    }
    const parts = value.split('/');
    if (parts.length !== 2) return false;
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && minutes >= 0 && minutes < 60;
  };

  // Données des formations par année et catégorie (pour les heures obligatoires)
  const formationsData = {
    '2024': {
      validantes: [
        {
          id: 1,
          date: '15/03/2024',
          statut: 'Validée',
          heures: 7,
          delivreePar: 'Formation Pro',
          nomDocument: 'Formation CIF - Gestion de portefeuille',
          categories: ['CIF'],
          documentUrl: '#'
        },
        {
          id: 2,
          date: '22/06/2024',
          statut: 'Validée',
          heures: 5,
          delivreePar: 'Institut IAS',
          nomDocument: 'Formation IAS - Nouvelles réglementations',
          categories: ['IAS'],
          documentUrl: '#'
        },
        {
          id: 3,
          date: '10/09/2024',
          statut: 'Validée',
          heures: 8,
          delivreePar: 'Centre Formation',
          nomDocument: 'Formation Multi-catégories - Conformité',
          categories: ['CIF', 'IAS', 'IOB'],
          documentUrl: '#'
        }
      ],
      obligatoires: {
        CIF: 12,
        IAS: 8,
        IOB: 6,
        IMMOBILIER: 4
      }
    },
    '2025': {
      validantes: [
        {
          id: 4,
          date: '18/01/2025',
          statut: 'En cours',
          heures: 6,
          delivreePar: 'Formation Pro',
          nomDocument: 'Formation CIF 2025 - Marchés financiers',
          categories: ['CIF'],
          documentUrl: '#'
        },
        {
          id: 5,
          date: '25/02/2025',
          statut: 'Validée',
          heures: 4,
          delivreePar: 'Institut IAS',
          nomDocument: 'Formation IAS - Mise à jour réglementaire',
          categories: ['IAS'],
          documentUrl: '#'
        }
      ],
      obligatoires: {
        CIF: 8,
        IAS: 6,
        IOB: 4,
        IMMOBILIER: 3
      }
    },
    '2026': {
      validantes: [],
      obligatoires: {
        CIF: 0,
        IAS: 0,
        IOB: 0,
        IMMOBILIER: 0
      }
    }
  };

  // Années disponibles
  const availableYears = ['2024', '2025', '2026'];

  // Filtrer les formations selon la catégorie sélectionnée
  const getFilteredFormations = () => {
    // Use approved formations from API
    const approvedFormations = formations.filter(f => f.statut === 'approved');
    if (selectedCategory === 'all') {
      return approvedFormations;
    }
    return approvedFormations.filter(formation => formation.categories.includes(selectedCategory));
  };

  // Calculer le total d'heures par catégorie pour l'année sélectionnée
  const getTotalHoursByCategory = (category: string) => {
    const approvedFormations = formations.filter(f => f.statut === 'approved');
    return approvedFormations
      .filter(formation => formation.categories.includes(category))
      .reduce((total, formation) => {
        const heures = typeof formation.heures === 'number' 
          ? formation.heures 
          : parseHHMMToDecimal(String(formation.heures || '0'));
        return total + heures;
      }, 0);
  };

  // Get documents for a specific folder
  const getDocumentsForFolder = (folderId: number) => {
    return documents.filter(doc => doc.folder_id === folderId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Bibliothèque Règlementaire</h1>
        <p className="text-gray-600 text-lg">
          Documents types en version Word pour la mise en conformité de votre cabinet
        </p>
      </div>

      {/* Navigation par Année */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sélection de l'Année</h2>
          <div className="flex space-x-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Formations Obligatoires */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-red-800 to-red-900 p-6">
          <h2 className="text-2xl font-bold text-white">MES FORMATIONS OBLIGATOIRES {selectedYear}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['IAS', 'CIF', 'IOB', 'IMMOBILIER'].map((category) => {
              // Heures minimum requises par catégorie
              const minHoursByCategory: Record<string, number> = {
                'IAS': 15,
                'CIF': 7,
                'IMMO': 14,
                'IMMOBILIER': 14,
                'IOBSP': 7,
                'IOB': 7
              };
              const requiredHours = minHoursByCategory[category] || 0;
              const completedHours = getTotalHoursByCategory(category);
              const isCompleted = completedHours >= requiredHours;
              
              return (
                <button 
                  key={category}
                  onClick={() => {
                    setSelectedFormationType('obligatoires');
                    setSelectedCategory(category);
                  }}
                  className={`p-4 rounded-lg transition-colors ${
                    isCompleted 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <div className="text-lg font-semibold">{category}</div>
                  <div className="text-xs mt-1">
                    {formatHoursToHHMM(completedHours)} / {formatHoursToHHMM(requiredHours)}
                  </div>
                  {isCompleted && (
                    <div className="text-xs mt-1 font-bold">✓ Complété</div>
                  )}
            </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Formations Validantes */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">MES FORMATIONS VALIDANTES {selectedYear}</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? "bg-white text-blue-800"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Toutes
              </button>
              {['CIF', 'IAS', 'IOB', 'IMMOBILIER'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-white text-blue-800"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Statut</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nb d'heures</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Catégories</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Délivrée par</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nom document</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-gray-500 text-center" colSpan={7}>
                      Chargement...
                    </td>
                  </tr>
                ) : getFilteredFormations().length > 0 ? (
                  getFilteredFormations().map((formation) => {
                    const dateStr = formation.date ? new Date(formation.date).toLocaleDateString('fr-FR') : '';
                    return (
                    <tr key={formation.id}>
                        <td className="border border-gray-300 px-4 py-2">{dateStr}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formation.statut === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                              : formation.statut === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                            {formation.statut === 'approved' ? 'Validée' : formation.statut === 'pending' ? 'En attente' : 'Rejetée'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {typeof formation.heures === 'number' 
                          ? formatHoursToHHMM(formation.heures) 
                          : formation.heures}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                            {Array.isArray(formation.categories) ? formation.categories.map((category: string) => (
                            <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {category}
                            </span>
                            )) : null}
                        </div>
                      </td>
                        <td className="border border-gray-300 px-4 py-2">{formation.delivree_par || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{formation.nom_document}</td>
                      <td className="border border-gray-300 px-4 py-2">
                          {(formation.fileUrl || formation.file_path) && (
                            <button
                              onClick={async () => {
                                const downloadUrl = formation.fileUrl || (formation.file_path ? buildFileURL(formation.file_path) : '');
                                if (downloadUrl.includes('/api/formations/') && downloadUrl.includes('/download')) {
                                  try {
                                    const token = localStorage.getItem('token');
                                    let apiPath: string;
                                    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
                                      const urlObj = new URL(downloadUrl);
                                      apiPath = urlObj.pathname;
                                      if (apiPath.startsWith('/api/')) {
                                        apiPath = apiPath.replace('/api', '');
                                      }
                                    } else {
                                      apiPath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
                                      if (apiPath.startsWith('/api/')) {
                                        apiPath = apiPath.replace('/api', '');
                                      }
                                    }
                                    const apiUrl = buildAPIURL(apiPath);
                                    const response = await fetch(apiUrl, {
                                      headers: { 'x-auth-token': token || '' }
                                    });
                                    if (response.ok) {
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = formation.nom_document || 'formation.pdf';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      window.URL.revokeObjectURL(url);
                                    } else {
                                      alert('Erreur lors du téléchargement');
                                    }
                                  } catch (error) {
                                    console.error('Error downloading:', error);
                                    alert('Erreur lors du téléchargement');
                                  }
                                } else {
                                  window.open(downloadUrl, '_blank');
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                          Télécharger
                        </button>
                          )}
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-gray-500" colSpan={7}>
                      Aucune formation approuvée enregistrée pour {selectedCategory === 'all' ? 'cette année' : selectedCategory} en {selectedYear}
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ajouter une formation
            </button>
            <div className="text-gray-600 font-medium">
              Total heures {selectedCategory === 'all' ? 'toutes catégories' : selectedCategory}: {formatHoursToHHMM(getFilteredFormations().reduce((total, formation) => total + (typeof formation.heures === 'number' ? formation.heures : parseHHMMToDecimal(String(formation.heures))), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Bibliothèque Conformité */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6">
          <h2 className="text-2xl font-bold text-white">BIBLIOTHEQUE CONFORMITE</h2>
        </div>
        <div className="p-6">
          {loadingReglementaire ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des documents...</p>
            </div>
          ) : (
          <div className="space-y-4">
              {folders.map((folder) => {
                const folderDocuments = getDocumentsForFolder(folder.id);
                return (
              <div key={folder.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête du dossier */}
                <button
                      onClick={() => toggleFolder(folder.id.toString())}
                  className="w-full bg-gray-50 hover:bg-gray-100 p-4 text-left transition-colors flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{folder.title}</h3>
                  <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{folderDocuments.length} document(s)</span>
                    <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedFolders[folder.id.toString()] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Contenu du dossier */}
                    {expandedFolders[folder.id.toString()] && (
                  <div className="border-t border-gray-200 bg-white">
                        {folderDocuments.length > 0 ? (
                          folderDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 text-blue-600">
                            📄
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{doc.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {doc.document_date || 'N/A'} {doc.document_type ? ` • ${doc.document_type}` : ''}
                          </div>
                        </div>
                              </div>
                              {doc.fileUrl && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('token');
                                      let apiPath: string;
                                      if (doc.fileUrl!.startsWith('http://') || doc.fileUrl!.startsWith('https://')) {
                                        const urlObj = new URL(doc.fileUrl!);
                                        apiPath = urlObj.pathname;
                                        if (apiPath.startsWith('/api/')) {
                                          apiPath = apiPath.replace('/api', '');
                                        }
                                      } else {
                                        apiPath = doc.fileUrl!.startsWith('/') ? doc.fileUrl! : `/${doc.fileUrl!}`;
                                        if (apiPath.startsWith('/api/')) {
                                          apiPath = apiPath.replace('/api', '');
                                        }
                                      }
                                      const apiUrl = buildAPIURL(apiPath);
                                      const response = await fetch(apiUrl, {
                                        headers: { 'x-auth-token': token || '' }
                                      });
                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = doc.name || 'document.pdf';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      } else {
                                        alert('Erreur lors du téléchargement');
                                      }
                                    } catch (error) {
                                      console.error('Error downloading:', error);
                                      alert('Erreur lors du téléchargement');
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Télécharger"
                                >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                              )}
                      </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Aucun document dans ce dossier
                  </div>
                )}
              </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal pour ajouter une formation */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Ajouter une formation</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitFormation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du document <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_document}
                  onChange={(e) => setFormData({ ...formData, nom_document: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation CIF - Gestion de portefeuille"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre d'heures <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Format: HH/MM)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.heures}
                    onChange={(e) => {
                      // Valider le format HH/MM en temps réel
                      const value = e.target.value;
                      // Permettre: nombres, /, et format HH/MM
                      if (value === '' || /^\d{0,2}\/?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, heures: value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 15/30 (15h30min)"
                    pattern="\d{1,2}/\d{1,2}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: HH/MM (ex: 15/30 pour 15 heures 30 minutes)
                  </p>
                  {formData.categories.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Heures minimum requises :</p>
                      <ul className="text-xs text-blue-700 space-y-0.5">
                        {formData.categories.map((cat) => {
                          const minHours: Record<string, number> = {
                            'IAS': 15,
                            'CIF': 7,
                            'IMMO': 14,
                            'IMMOBILIER': 14,
                            'IOBSP': 7,
                            'IOB': 7
                          };
                          const min = minHours[cat] || 0;
                          return (
                            <li key={cat}>
                              {cat}: {min} heures minimum
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégories <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['CIF', 'IAS', 'IOB', 'IMMOBILIER'].map((category) => {
                    const minHoursByCategory: Record<string, number> = {
                      'IAS': 15,
                      'CIF': 7,
                      'IMMO': 14,
                      'IMMOBILIER': 14,
                      'IOBSP': 7,
                      'IOB': 7
                    };
                    const minHours = minHoursByCategory[category] || 0;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.categories.includes(category)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={`Minimum ${minHours} heures requis`}
                      >
                        {category} <span className="text-xs">(min {minHours}h)</span>
                      </button>
                    );
                  })}
          </div>
                {formData.categories.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">Sélectionnez au moins une catégorie</p>
                )}
        </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Délivrée par
                </label>
                <input
                  type="text"
                  value={formData.delivree_par}
                  onChange={(e) => setFormData({ ...formData, delivree_par: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation Pro, Institut IAS..."
                />
      </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Année <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fichier (PDF, DOC, DOCX, etc.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.categories.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

