import React, { useState, useEffect } from 'react';
import { partnersAPI, buildAPIURL } from './api';
import { clearCachedData, CACHE_KEYS } from './utils/cache';
import { Partner, PartnerContact, PartnerDocument } from './types';
import { PartnerIcon, UploadIcon, EditIcon } from './components/NavIcons';
import { useAlert } from './contexts/AlertContext';

// Additional icons
const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BuildingIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface PartnerFormData {
  id?: number;
  nom: string;
  logo_url: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  category: string;
  is_active: boolean;
  logo_file: File | null;
}

const PartnerManagementPage: React.FC = () => {
  const { showSuccess, showError, showWarning } = useAlert();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]); // Pour les stats globales
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedPartnerForContacts, setSelectedPartnerForContacts] = useState<Partner | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedPartnerForDocuments, setSelectedPartnerForDocuments] = useState<Partner | null>(null);

  const [partnerForm, setPartnerForm] = useState<PartnerFormData>({
    nom: '',
    logo_url: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    category: 'coa',
    is_active: true,
    logo_file: null
  });

  useEffect(() => {
    loadAllPartners(); // Charger tous les partenaires pour les stats
    loadPartners();
  }, []);

  // Recharger les partenaires quand les filtres changent
  useEffect(() => {
    loadPartners();
  }, [selectedCategory, searchTerm]);

  // Charger tous les partenaires (pour les stats globales)
  const loadAllPartners = async () => {
    try {
      const response = await partnersAPI.getAll({});
      setAllPartners(response);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const loadPartners = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await partnersAPI.getAll(params);
      setPartners(response);
      
      // Si pas de filtre, mettre à jour aussi allPartners
      if (!selectedCategory && !searchTerm) {
        setAllPartners(response);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error);
      showError('Erreur lors du chargement des partenaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerForm.nom) {
      showWarning('Le nom est obligatoire');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('nom', partnerForm.nom);
    formData.append('description', partnerForm.description || '');
    formData.append('website', partnerForm.website || '');
    formData.append('contact_email', partnerForm.contact_email || '');
    formData.append('contact_phone', partnerForm.contact_phone || '');
    formData.append('category', partnerForm.category);
    formData.append('is_active', partnerForm.is_active.toString());
    
    if (partnerForm.logo_file) {
      formData.append('logo', partnerForm.logo_file);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/partners'), {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du partenaire');
      }

      // Invalider le cache
      clearCachedData(CACHE_KEYS.PARTNERS);
      clearCachedData(CACHE_KEYS.PARTNERS_COA);
      clearCachedData(CACHE_KEYS.PARTNERS_CIF);

      showSuccess('Partenaire créé avec succès !');
      setPartnerForm({
        nom: '',
        logo_url: '',
        description: '',
        website: '',
        contact_email: '',
        contact_phone: '',
        category: 'coa',
        is_active: true,
        logo_file: null
      });
      setShowUploadForm(false);
      loadPartners();
    } catch (error) {
      console.error('Erreur création partenaire:', error);
      showError('Erreur lors de la création du partenaire');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      id: partner.id,
      nom: partner.nom || '',
      logo_url: partner.logo_url || '',
      description: partner.description || '',
      website: partner.website || '',
      contact_email: partner.contact_email || '',
      contact_phone: partner.contact_phone || '',
      category: partner.category || 'coa',
      is_active: partner.is_active !== undefined ? partner.is_active : true,
      logo_file: null
    });
    setShowUploadForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPartner || !partnerForm.id) {
      showError('Erreur: partenaire non sélectionné');
      return;
    }

    if (!partnerForm.nom) {
      showWarning('Le nom est obligatoire');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('nom', partnerForm.nom);
    formData.append('description', partnerForm.description || '');
    formData.append('website', partnerForm.website || '');
    formData.append('contact_email', partnerForm.contact_email || '');
    formData.append('contact_phone', partnerForm.contact_phone || '');
    formData.append('category', partnerForm.category);
    formData.append('is_active', partnerForm.is_active.toString());
    
    if (partnerForm.logo_file) {
      formData.append('logo', partnerForm.logo_file);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/partners/${partnerForm.id}`), {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du partenaire');
      }

      // Invalider le cache
      clearCachedData(CACHE_KEYS.PARTNERS);
      clearCachedData(CACHE_KEYS.PARTNERS_COA);
      clearCachedData(CACHE_KEYS.PARTNERS_CIF);

      showSuccess('Partenaire mis à jour avec succès !');
      resetForm();
      loadPartners();
    } catch (error) {
      console.error('Erreur mise à jour partenaire:', error);
      showError('Erreur lors de la mise à jour du partenaire');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setPartnerForm({
      nom: '',
      logo_url: '',
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      category: 'coa',
      is_active: true,
      logo_file: null
    });
    setEditingPartner(null);
    setShowUploadForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
      return;
    }

    try {
      await partnersAPI.delete(id);
      
      // Invalider le cache
      clearCachedData(CACHE_KEYS.PARTNERS);
      clearCachedData(CACHE_KEYS.PARTNERS_COA);
      clearCachedData(CACHE_KEYS.PARTNERS_CIF);
      
      loadPartners();
      showSuccess('Partenaire supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showError('Erreur lors de la suppression du partenaire');
    }
  };

  const openContactsModal = (partner: Partner) => {
    setSelectedPartnerForContacts(partner);
    setShowContactsModal(true);
  };

  const openDocumentsModal = (partner: Partner) => {
    setSelectedPartnerForDocuments(partner);
    setShowDocumentsModal(true);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || partner.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['coa', 'cif'];
  const categoriesCount = {
    coa: allPartners.filter(p => p.category === 'coa').length,
    cif: allPartners.filter(p => p.category === 'cif').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Partenaires</h1>
            <p className="text-gray-600 text-sm">
              Configurez et gérez vos partenaires COA et CIF
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
          >
            <UploadIcon className="w-5 h-5" />
            <span>Nouveau Partenaire</span>
          </button>
        </div>
      </div>

      {/* Statistiques - Premium Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Partenaires</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{allPartners.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PartnerIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Partenaires COA</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{categoriesCount.coa}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <BuildingIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Partenaires CIF</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{categoriesCount.cif}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showUploadForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            {editingPartner ? (
              <>
                <EditIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Modifier le Partenaire</h2>
              </>
            ) : (
              <>
                <UploadIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Ajouter un Nouveau Partenaire</h2>
              </>
            )}
          </div>
          <form onSubmit={editingPartner ? handleUpdate : handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Partenaire *</label>
                <input
                  type="text"
                  value={partnerForm.nom}
                  onChange={(e) => setPartnerForm({...partnerForm, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Ex: ABEILLE VIE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={partnerForm.category}
                  onChange={(e) => setPartnerForm({...partnerForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="coa">COA</option>
                  <option value="cif">CIF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={partnerForm.description}
                onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Description du partenaire..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Web</label>
                <input
                  type="url"
                  value={partnerForm.website}
                  onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contact</label>
                <input
                  type="email"
                  value={partnerForm.contact_email}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@partenaire.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={partnerForm.contact_phone}
                onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPartnerForm({...partnerForm, logo_file: e.target.files?.[0] || null})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Formats: PNG, JPG, SVG (Max: 5MB)</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium border border-gray-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{editingPartner ? 'Mettre à jour' : 'Créer le Partenaire'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs - Premium Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide py-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${!selectedCategory
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Left indicator bar */}
              {!selectedCategory && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <span className="font-medium">Tous</span>
            </button>
            <button
              onClick={() => setSelectedCategory('coa')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${selectedCategory === 'coa'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Left indicator bar */}
              {selectedCategory === 'coa' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <BuildingIcon className="w-4 h-4" />
              <span className="font-medium">COA</span>
            </button>
            <button
              onClick={() => setSelectedCategory('cif')}
              className={`
                relative flex items-center space-x-2 px-4 py-2.5 
                font-medium text-sm transition-all duration-200 ease-in-out
                whitespace-nowrap rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${selectedCategory === 'cif'
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Left indicator bar */}
              {selectedCategory === 'cif' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-600 rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <BriefcaseIcon className="w-4 h-4" />
              <span className="font-medium">CIF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un partenaire..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPartners}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium border border-gray-300"
            >
              <RefreshIcon className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des partenaires - Premium Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <PartnerIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Partenaires ({filteredPartners.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des partenaires...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartnerIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">Aucun partenaire trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Commencez par ajouter votre premier partenaire</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  {partner.logoUrl || partner.logo_url ? (
                    <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <img
                        src={partner.logoUrl || (partner.logo_url.startsWith('http') ? partner.logo_url : `http://localhost:3001${partner.logo_url}`)}
                        alt={partner.nom}
                        className="max-w-full max-h-full w-auto h-auto object-contain p-1"
                        style={{ 
                          maxWidth: '56px',
                          maxHeight: '56px',
                          width: 'auto',
                          height: 'auto'
                        }}
                        onError={(e) => {
                          // Fallback si l'image ne charge pas
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">${partner.nom.charAt(0)}</div>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {partner.nom.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{partner.nom}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      partner.category === 'coa' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {partner.category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{partner.description}</p>
                <div className="mb-3 space-y-2">
                  {partner.contacts && partner.contacts.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contacts: {partner.contacts.length}</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.contacts.slice(0, 2).map((contact) => (
                          <span key={contact.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {contact.fonction}
                          </span>
                        ))}
                        {partner.contacts.length > 2 && (
                          <span className="text-xs text-gray-500">+{partner.contacts.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {partner.documents && partner.documents.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Documents: {partner.documents.length}</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.documents.slice(0, 2).map((doc) => (
                          <span key={doc.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            {doc.document_type || 'Document'}
                          </span>
                        ))}
                        {partner.documents.length > 2 && (
                          <span className="text-xs text-gray-500">+{partner.documents.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => openContactsModal(partner)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center space-x-1"
                      title="Gérer les contacts"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDocumentsModal(partner)}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1"
                      title="Gérer les documents"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(partner)}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de gestion des contacts */}
      {showContactsModal && selectedPartnerForContacts && (
        <ContactsManagementModal
          partner={selectedPartnerForContacts}
          onClose={() => {
            setShowContactsModal(false);
            setSelectedPartnerForContacts(null);
            loadPartners();
          }}
          onPartnerUpdate={(updatedPartner) => {
            // Mettre à jour le partenaire dans la liste immédiatement
            setPartners(prevPartners => 
              prevPartners.map(p => p.id === updatedPartner.id ? updatedPartner : p)
            );
            setAllPartners(prevAllPartners => 
              prevAllPartners.map(p => p.id === updatedPartner.id ? updatedPartner : p)
            );
            // Mettre à jour aussi le partenaire sélectionné
            setSelectedPartnerForContacts(updatedPartner);
          }}
        />
      )}

      {/* Modal de gestion des documents */}
      {showDocumentsModal && selectedPartnerForDocuments && (
        <DocumentsManagementModal
          partner={selectedPartnerForDocuments}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedPartnerForDocuments(null);
            loadPartners();
          }}
        />
      )}
    </div>
  );
};

// Composant modal pour gérer les contacts
interface ContactsManagementModalProps {
  partner: Partner;
  onClose: () => void;
  onPartnerUpdate?: (updatedPartner: Partner) => void;
}

const ContactsManagementModal: React.FC<ContactsManagementModalProps> = ({ partner, onClose, onPartnerUpdate }) => {
  const { showSuccess, showError, showWarning } = useAlert();
  const [contacts, setContacts] = useState<PartnerContact[]>(partner.contacts || []);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<PartnerContact | null>(null);
  const [contactForm, setContactForm] = useState({
    fonction: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    service: ''
  });

  const loadContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/partners/${partner.id}/contacts`), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        const updatedContacts = Array.isArray(data) ? data : [];
        setContacts(updatedContacts);
        
        // Mettre à jour le partenaire dans le state parent si callback fourni
        if (onPartnerUpdate) {
          const updatedPartner = {
            ...partner,
            contacts: updatedContacts
          };
          onPartnerUpdate(updatedPartner);
        }
      } else {
        // Améliorer la gestion d'erreur
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur chargement contacts:', response.status, errorData);
        showError('Erreur lors du chargement des contacts');
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      showError('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [partner.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.fonction || !contactForm.nom || !contactForm.prenom || !contactForm.email) {
      showWarning('Tous les champs sont requis (sauf téléphone)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingContact
        ? buildAPIURL(`/partners/${partner.id}/contacts/${editingContact.id}`)
        : buildAPIURL(`/partners/${partner.id}/contacts`);
      
      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(contactForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      showSuccess(editingContact ? 'Contact mis à jour avec succès !' : 'Contact créé avec succès !');
      resetForm();
      // Attendre un peu pour que le backend termine l'insertion
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadContacts();
    } catch (error) {
      console.error('Erreur sauvegarde contact:', error);
      showError('Erreur lors de la sauvegarde du contact');
    }
  };

  const handleEdit = (contact: PartnerContact) => {
    setEditingContact(contact);
    setContactForm({
      fonction: contact.fonction,
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      telephone: contact.telephone || '',
      service: contact.service || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/partners/${partner.id}/contacts/${contactId}`), {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      showSuccess('Contact supprimé avec succès !');
      await loadContacts();
    } catch (error) {
      console.error('Erreur suppression contact:', error);
      showError('Erreur lors de la suppression du contact');
    }
  };

  const resetForm = () => {
    setContactForm({
      fonction: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      service: ''
    });
    setEditingContact(null);
    setShowAddForm(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ scrollBehavior: 'smooth' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
        ref={(el) => {
          if (el) {
            // Scroll vers le modal au montage - amélioré pour garantir l'affichage
            requestAnimationFrame(() => {
              el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
              // Scroll aussi le conteneur parent si nécessaire
              const parent = el.closest('.overflow-y-auto');
              if (parent) {
                parent.scrollTop = 0;
              }
            });
          }
        }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            📇 Contacts - {partner.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Gérez les contacts de ce partenaire</p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-4 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all"
            >
              {showAddForm ? 'Annuler' : '+ Ajouter un contact'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-4">
                {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fonction *</label>
                    <select
                      value={contactForm.fonction}
                      onChange={(e) => setContactForm({ ...contactForm, fonction: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Inspecteur">Inspecteur</option>
                      <option value="Service Commercial">Service Commercial</option>
                      <option value="Contact général">Contact général</option>
                      <option value="Direction">Direction</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={contactForm.nom}
                      onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={contactForm.prenom}
                      onChange={(e) => setContactForm({ ...contactForm, prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={contactForm.telephone}
                      onChange={(e) => setContactForm({ ...contactForm, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input
                      type="text"
                      value={contactForm.service}
                      onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Service Commercial, Service Client, etc."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF]"
                  >
                    {editingContact ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun contact enregistré. Ajoutez-en un pour commencer.
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {contact.fonction}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {contact.prenom} {contact.nom}
                        </p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        {contact.telephone && (
                          <p className="text-sm text-gray-500">{contact.telephone}</p>
                        )}
                        {contact.service && (
                          <p className="text-sm text-gray-500">Service: {contact.service}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="text-green-600 hover:text-green-700 p-2"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant modal pour gérer les documents
interface DocumentsManagementModalProps {
  partner: Partner;
  onClose: () => void;
}

const DocumentsManagementModal: React.FC<DocumentsManagementModalProps> = ({ partner, onClose }) => {
  const { showSuccess, showError, showWarning } = useAlert();
  const [documents, setDocuments] = useState<PartnerDocument[]>(partner.documents || []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    document_type: 'convention',
    document_file: null as File | null
  });

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/partners/${partner.id}/documents`), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [partner.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.title || !documentForm.document_file) {
      showWarning('Le titre et le fichier sont requis');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', documentForm.title);
      formData.append('description', documentForm.description || '');
      formData.append('document_type', documentForm.document_type);
      formData.append('document', documentForm.document_file);

      const response = await fetch(buildAPIURL(`/partners/${partner.id}/documents`), {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      showSuccess('Document uploadé avec succès !');
      resetForm();
      loadDocuments();
    } catch (error) {
      console.error('Erreur upload document:', error);
      showError('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/partners/${partner.id}/documents/${documentId}`), {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      showSuccess('Document supprimé avec succès !');
      loadDocuments();
    } catch (error) {
      console.error('Erreur suppression document:', error);
      showError('Erreur lors de la suppression du document');
    }
  };

  const resetForm = () => {
    setDocumentForm({
      title: '',
      description: '',
      document_type: 'convention',
      document_file: null
    });
    setShowAddForm(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ scrollBehavior: 'smooth' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
        ref={(el) => {
          if (el) {
            // Scroll vers le modal au montage - amélioré pour garantir l'affichage
            requestAnimationFrame(() => {
              el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
              // Scroll aussi le conteneur parent si nécessaire
              const parent = el.closest('.overflow-y-auto');
              if (parent) {
                parent.scrollTop = 0;
              }
            });
          }
        }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            📄 Documents - {partner.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Gérez les documents (conventions de distribution, etc.) de ce partenaire</p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-4 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all"
            >
              {showAddForm ? 'Annuler' : '+ Ajouter un document'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-4">Nouveau document</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={documentForm.title}
                      onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ex: Convention de distribution 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de document *</label>
                    <select
                      value={documentForm.document_type}
                      onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="convention">Convention de distribution</option>
                      <option value="brochure">Brochure</option>
                      <option value="contrat">Contrat</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={documentForm.description}
                      onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Description optionnelle..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fichier *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={(e) => setDocumentForm({ ...documentForm, document_file: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Formats: PDF, Word, Excel, Texte (Max: 50MB)</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] disabled:opacity-50"
                  >
                    {uploading ? 'Upload...' : 'Uploader'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun document enregistré. Ajoutez-en un pour commencer.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-800">{document.title}</p>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            {document.document_type || 'Document'}
                          </span>
                        </div>
                        {document.description && (
                          <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{document.file_type || 'PDF'}</span>
                          <span>{formatFileSize(document.file_size)}</span>
                          {document.created_at && (
                            <span>{new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {document.downloadUrl && (
                      <a
                        href={document.downloadUrl}
                        download
                        className="text-blue-600 hover:text-blue-700 p-2"
                        title="Télécharger"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerManagementPage;

