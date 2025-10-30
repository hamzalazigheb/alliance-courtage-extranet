import React, { useState, useEffect } from 'react';

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

interface ContactInfo {
  phone: string;
  email: string;
  location: string;
}

interface HomePageContent {
  welcomeTitle: string;
  news: NewsItem[];
  newsletter: NewsletterItem;
  services: ServiceItem[];
  contact: ContactInfo;
}

const CMSManagementPage: React.FC = () => {
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
    newsletter: {
      title: 'Newsletter patrimoniale',
      badge: 'Rentrée 2025',
      description: 'Découvrez notre newsletter patrimoniale spéciale rentrée 2025 avec les dernières tendances et conseils d\'investissement pour optimiser votre patrimoine.',
      filePath: '/Newsletter patrimoniale - Rentrée 2025.pdf',
      isRecent: true
    },
    services: [
      { name: 'Epargne et retraite' },
      { name: 'Prévoyance et santé' },
      { name: 'Assurances collectives' },
      { name: 'Investissement financier (CIF)' }
    ],
    contact: {
      phone: '07.45.06.43.88',
      email: 'contact@alliance-courtage.fr',
      location: 'Paris, France'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activePage, setActivePage] = useState<'home' | 'gamme-produits'>('home');
  const [activeSection, setActiveSection] = useState<'welcome' | 'news' | 'newsletter' | 'services' | 'contact'>('welcome');

  // Gamme Produits structured content
  type ClientId = 'particulier' | 'professionnel' | 'entreprise';
  type ProdId = 'epargne' | 'retraite' | 'prevoyance' | 'sante' | 'cif';
  type GPContent = { 
    title?: string;
    subtitle?: string;
    catalogue?: {
      title?: string;
      badge?: string;
      description?: string;
      fileUrl?: string;
      updatedAtLabel?: string;
      downloadLabel?: string;
    };
    products: Record<ClientId, Record<ProdId, string[]>> 
  };

  const emptyGP: GPContent = {
    title: 'Gamme Produits',
    subtitle: 'Découvrez nos solutions adaptées à chaque type de client et de produit',
    catalogue: {
      title: 'Téléchargez notre catalogue produits',
      badge: 'Catalogue 2025',
      description: "Découvrez notre gamme complète de produits d'assurance et d'investissement pour tous vos besoins.",
      fileUrl: '/catalogue-produits-2025.pdf',
      updatedAtLabel: 'Mise à jour 2025',
      downloadLabel: 'Télécharger le PDF'
    },
    products: {
      particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
      entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
    }
  };

  const [gpContent, setGpContent] = useState<GPContent>(emptyGP);
  const [gpClient, setGpClient] = useState<ClientId>('particulier');
  const [gpProd, setGpProd] = useState<ProdId>('epargne');
  const [newProductName, setNewProductName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [catalogUploading, setCatalogUploading] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activePage]);

  const loadContent = async () => {
    try {
      const endpoint = activePage === 'home' ? 'home' : 'gamme-produits';
      const response = await fetch(`http://localhost:3001/api/cms/${endpoint}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.content) {
          if (activePage === 'home') {
            setContent(JSON.parse(data.content));
          } else {
            const parsed = JSON.parse(data.content);
            setGpContent({
              products: {
                particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.particulier || {}) },
                professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.professionnel || {}) },
                entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [], ...(parsed?.products?.entreprise || {}) }
              }
            });
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
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const endpoint = activePage === 'home' ? 'home' : 'gamme-produits';
      const payload = activePage === 'home'
        ? JSON.stringify({ content: JSON.stringify(content) })
        : JSON.stringify({ content: JSON.stringify(gpContent) });

      const response = await fetch(`http://localhost:3001/api/cms/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: payload
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Contenu sauvegardé avec succès!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving CMS content:', error);
      alert('Erreur lors de la sauvegarde');
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
            {successMessage && (
              <div className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-300 rounded-lg">
                {successMessage}
              </div>
            )}
            <button
              onClick={saveContent}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] hover:from-[#0b1428] hover:to-[#1E40AF] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
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
            onClick={() => { setActivePage('gamme-produits'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activePage === 'gamme-produits' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >📦 Gamme Produits</button>
        </div>
      </div>

      {/* Section tabs (only for Home) */}
      {activePage === 'home' && (
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex space-x-2">
            {[
              { id: 'welcome', label: '🏠 Accueil' },
              { id: 'news', label: '📰 Actualités' },
              { id: 'newsletter', label: '📧 Newsletter' },
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
            <h3 className="text-xl font-bold text-white mb-2">Gamme Produits</h3>
            {/* Titre & Sous-titre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                <input
                  type="text"
                  value={gpContent.title || ''}
                  onChange={(e) => setGpContent({ ...gpContent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={gpContent.subtitle || ''}
                  onChange={(e) => setGpContent({ ...gpContent, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bloc Catalogue PDF */}
            <div className="bg-slate-700/40 rounded-lg p-4 space-y-4">
              <h4 className="text-white font-semibold">Bloc Catalogue PDF</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.title || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), title: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Badge</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.badge || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), badge: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.description || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), description: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">URL du PDF</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={gpContent.catalogue?.fileUrl || ''}
                      onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), fileUrl: e.target.value } })}
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                      placeholder="/path/to/catalogue.pdf (ou utilisez l'upload ci-dessous)"
                    />
                    <div className="flex items-center space-x-3">
                      <input
                        id="catalog-file-input"
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setCatalogUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const resp = await fetch('http://localhost:3001/api/archives', {
                              method: 'POST',
                              headers: {
                                'x-auth-token': localStorage.getItem('token') || ''
                              },
                              body: formData
                            });
                            if (resp.ok) {
                              const data = await resp.json().catch(() => ({}));
                              const path = data.file_path || data.path || data.url;
                              if (path) {
                                setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), fileUrl: path } });
                              } else {
                                alert('Upload réussi mais chemin de fichier non retourné.');
                              }
                            } else {
                              const err = await resp.json().catch(() => ({}));
                              alert(err.error || 'Erreur lors de l\'upload du fichier PDF');
                            }
                          } catch (err) {
                            console.error('Upload catalog error:', err);
                            alert('Erreur lors de l\'upload');
                          } finally {
                            setCatalogUploading(false);
                          }
                        }}
                        className="flex-1 text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                      />
                      {catalogUploading && <span className="text-slate-300 text-sm">Upload...</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Libellé mise à jour</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.updatedAtLabel || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), updatedAtLabel: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Libellé bouton</label>
                  <input
                    type="text"
                    value={gpContent.catalogue?.downloadLabel || ''}
                    onChange={(e) => setGpContent({ ...gpContent, catalogue: { ...(gpContent.catalogue||{}), downloadLabel: e.target.value } })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            {/* Choix client / type de produit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Type de client</label>
                <select
                  value={gpClient}
                  onChange={(e) => setGpClient(e.target.value as ClientId)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                >
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Famille de produit</label>
                <select
                  value={gpProd}
                  onChange={(e) => setGpProd(e.target.value as ProdId)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                >
                  {Object.keys(gpContent.products[gpClient]).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
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
                    setGpProd(name as ProdId);
                    setNewFamilyName('');
                  }}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  + Ajouter la famille
                </button>
                <button
                  onClick={() => {
                    const families = Object.keys(gpContent.products[gpClient]);
                    if (families.length <= 1) return; // garder au moins une famille
                    const next: GPContent = JSON.parse(JSON.stringify(gpContent));
                    ['particulier','professionnel','entreprise'].forEach((c) => {
                      delete (next.products[c as ClientId] as any)[gpProd];
                    });
                    const remaining = Object.keys(next.products[gpClient]) as ProdId[];
                    setGpContent(next);
                    setGpProd((remaining[0] || 'epargne') as ProdId);
                  }}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Supprimer la famille
                </button>
              </div>
            </div>

            {/* Liste des produits */}
            <div className="bg-slate-700/40 rounded-lg p-4">
              <div className="flex items-end space-x-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Ajouter un produit</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    placeholder="Nom du produit"
                  />
                </div>
                <button
                  onClick={() => {
                    const name = newProductName.trim();
                    if (!name) return;
                    const next = { ...gpContent };
                    next.products[gpClient][gpProd] = [...next.products[gpClient][gpProd], name];
                    setGpContent(next);
                    setNewProductName('');
                  }}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  + Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {gpContent.products[gpClient][gpProd].length === 0 && (
                  <div className="text-slate-300 text-sm">Aucun produit. Ajoutez un élément ci-dessus.</div>
                )}
                {gpContent.products[gpClient][gpProd].map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const next = { ...gpContent };
                        next.products[gpClient][gpProd][idx] = e.target.value;
                        setGpContent(next);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const next = { ...gpContent };
                        next.products[gpClient][gpProd] = next.products[gpClient][gpProd].filter((_, i) => i !== idx);
                        setGpContent(next);
                      }}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'welcome' && (
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

        {activeSection === 'news' && (
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

        {activeSection === 'newsletter' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Newsletter</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
                <input
                  type="text"
                  value={content.newsletter.title}
                  onChange={(e) => setContent({ ...content, newsletter: { ...content.newsletter, title: e.target.value } })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Badge</label>
                <input
                  type="text"
                  value={content.newsletter.badge}
                  onChange={(e) => setContent({ ...content, newsletter: { ...content.newsletter, badge: e.target.value } })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea
                value={content.newsletter.description}
                onChange={(e) => setContent({ ...content, newsletter: { ...content.newsletter, description: e.target.value } })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Chemin du fichier PDF</label>
              <input
                type="text"
                value={content.newsletter.filePath}
                onChange={(e) => setContent({ ...content, newsletter: { ...content.newsletter, filePath: e.target.value } })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
                placeholder="/path/to/file.pdf"
              />
            </div>
          </div>
        )}

        {activeSection === 'services' && (
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

        {activeSection === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Téléphone</label>
              <input
                type="text"
                value={content.contact.phone}
                onChange={(e) => setContent({ ...content, contact: { ...content.contact, phone: e.target.value } })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={content.contact.email}
                onChange={(e) => setContent({ ...content, contact: { ...content.contact, email: e.target.value } })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Localisation</label>
              <input
                type="text"
                value={content.contact.location}
                onChange={(e) => setContent({ ...content, contact: { ...content.contact, location: e.target.value } })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Preview */}
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
        </div>
      </div>
    </div>
  );
};

export default CMSManagementPage;

