import React, { useState, useEffect } from 'react';
import { partnersAPI } from './api';

interface Partner {
  id: number;
  nom: string;
  logo_url: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const PartnerManagementPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [partnerForm, setPartnerForm] = useState({
    nom: '',
    logo_url: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    category: 'coa',
    is_active: true,
    logo_file: null as File | null
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await partnersAPI.getAll(params);
      setPartners(response);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error);
      alert('Erreur lors du chargement des partenaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerForm.nom) {
      alert('Le nom est obligatoire');
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
      const response = await fetch('http://localhost:3001/api/partners', {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du partenaire');
      }

      alert('Partenaire créé avec succès !');
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
      alert('Erreur lors de la création du partenaire');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
      return;
    }

    try {
      await partnersAPI.delete(id);
      loadPartners();
      alert('Partenaire supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du partenaire');
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || partner.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['coa', 'cif'];
  const categoriesCount = {
    coa: partners.filter(p => p.category === 'coa').length,
    cif: partners.filter(p => p.category === 'cif').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Gestion des Partenaires</h1>
            <p className="text-gray-600 text-lg">
              Configurez et gérez vos partenaires COA et CIF
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nouveau Partenaire</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Partenaires</p>
              <p className="text-3xl font-bold text-gray-800">{partners.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 003 15v3h3v-3a3 3 0 01-.75-2.906z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Partenaires COA</p>
              <p className="text-3xl font-bold text-blue-600">{categoriesCount.coa}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Partenaires CIF</p>
              <p className="text-3xl font-bold text-purple-600">{categoriesCount.cif}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showUploadForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📤 Ajouter un Nouveau Partenaire</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:from-[#0b1428] hover:to-[#1E40AF] transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
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
                    <span>Créer le Partenaire</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un partenaire..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              <option value="coa">COA</option>
              <option value="cif">CIF</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPartners}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des partenaires */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🤝 Partenaires ({filteredPartners.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des partenaires...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🤝</div>
            <p className="text-gray-600 text-lg">Aucun partenaire trouvé</p>
            <p className="text-gray-500 text-sm mt-2">Commencez par ajouter votre premier partenaire</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.nom}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
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
                <div className="flex items-center justify-between mt-4">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Site web</span>
                  </a>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerManagementPage;

