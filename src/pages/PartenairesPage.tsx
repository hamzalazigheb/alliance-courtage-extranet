import React, { useState, useEffect } from "react";
import { buildAPIURL, buildFileURL } from '../api';
import { Partner } from '../types';

export default function PartenairesPage() {
  const [selectedCategory, setSelectedCategory] = useState("tous");
  const [partenaires, setPartenaires] = useState<{ coa: Partner[]; cif: Partner[] }>({ coa: [], cif: [] });
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState({
    title: 'Nos Partenaires',
    subtitle: 'Découvrez nos partenaires de confiance en assurance et finance',
    description: '',
    headerImage: ''
  });

  // Charger les partenaires depuis l'API avec cache
  useEffect(() => {
    const loadPartenaires = async () => {
      try {
        setLoading(true);
        
        // Try cache first
        const { getCachedData, setCachedData, CACHE_KEYS, CACHE_TTL } = await import('../utils/cache');
        const cached = getCachedData<Partner[]>(CACHE_KEYS.PARTNERS);
        
        if (cached) {
          console.log('📊 Partners loaded from cache:', cached.length);
          // Organiser par catégorie
          const coa = cached.filter((p: Partner) => p.is_active && (p.category === 'coa' || p.category?.toLowerCase() === 'coa'));
          const cif = cached.filter((p: Partner) => p.is_active && (p.category === 'cif' || p.category?.toLowerCase() === 'cif'));
          setPartenaires({ coa, cif });
          setLoading(false);
          return;
        }
        
        // Load from API
        const response = await fetch(buildAPIURL('/partners?active=false'));
        const data = await response.json();
        
        console.log('📊 Partners loaded from API:', data.length);
        
        // Filter out large base64 logos before caching to avoid quota issues
        const dataForCache = data.map((partner: Partner) => {
          // Remove logo_content if it's too large (over 100KB)
          if (partner.logo_content) {
            const logoSize = partner.logo_content.length;
            if (logoSize > 100 * 1024) { // 100KB
              console.warn(`Removing large logo_content from partner ${partner.id} (${(logoSize / 1024).toFixed(2)}KB)`);
              return { ...partner, logo_content: undefined };
            }
          }
          return partner;
        });
        
        // Cache the data (without large logos)
        setCachedData(CACHE_KEYS.PARTNERS, dataForCache, CACHE_TTL.LONG);
        
        // Use original data for display (with logos)
        // Organiser par catégorie (only active partners for display)
        const coa: Partner[] = data.filter((p: Partner) => p.is_active && (p.category === 'coa' || p.category?.toLowerCase() === 'coa'));
        const cif: Partner[] = data.filter((p: Partner) => p.is_active && (p.category === 'cif' || p.category?.toLowerCase() === 'cif'));
        
        setPartenaires({ coa, cif });
        
        console.log(`✅ Active COA: ${coa.length}, Active CIF: ${cif.length}`);
      } catch (error) {
        console.error('Erreur chargement partenaires:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPartenaires();
    loadContent();
  }, []);

  // Load CMS content
  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/partenaires'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          const parsedContent = JSON.parse(data.content);
          if (typeof parsedContent === 'string') {
            setPageContent(JSON.parse(parsedContent));
          } else {
            setPageContent(parsedContent);
          }
        }
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
    }
  };

  const getFilteredPartenaires = (): Partner[] => {
    if (selectedCategory === "coa") return partenaires.coa;
    if (selectedCategory === "cif") return partenaires.cif;
    return [...partenaires.coa, ...partenaires.cif];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        {pageContent.headerImage && (
          <div className="mb-6">
            <img 
              src={pageContent.headerImage} 
              alt="Header" 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{pageContent.title}</h1>
        <p className="text-gray-600 text-lg">
          {pageContent.subtitle}
        </p>
        {pageContent.description && (
          <p className="text-gray-600 mt-2">{pageContent.description}</p>
        )}
      </div>

      {/* Filtres par catégorie */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrer par catégorie</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedCategory("tous")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "tous"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous les partenaires
          </button>
          <button
            onClick={() => setSelectedCategory("coa")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "coa"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Partenaires COA
          </button>
          <button
            onClick={() => setSelectedCategory("cif")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              selectedCategory === "cif"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Partenaires CIF
          </button>
        </div>
      </div>

      {/* Affichage des partenaires */}
      <div className="space-y-8">
        {/* Section Partenaires COA */}
        {(selectedCategory === "tous" || selectedCategory === "coa") && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">COA</span>
              Partenaires Courtiers en Assurances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partenaires.coa.map((partenaire: Partner, index: number) => (
                <div key={`coa-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center p-6 ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {(partenaire.logoUrl || partenaire.logo_url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                      <img 
                          src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                          className="max-h-20 max-w-[90%] w-auto h-auto object-contain"
                          style={{ 
                            maxHeight: '80px',
                            maxWidth: '90%',
                            width: 'auto',
                            height: 'auto'
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', partenaire.logoUrl || partenaire.logo_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {partenaire.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.website || partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels (seulement pour les fallback avec documents) */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                        {partenaire.documents.slice(0, 2).map((doc: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {/* Description (seulement pour les partenaires de la DB) */}
                    {(!partenaire.documents || !Array.isArray(partenaire.documents)) && partenaire.description && (
                      <p className="text-xs text-gray-600 text-center line-clamp-2">{partenaire.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Partenaires CIF */}
        {(selectedCategory === "tous" || selectedCategory === "cif") && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">CIF</span>
              Partenaires Conseillers en Investissements Financiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partenaires.cif.map((partenaire: Partner, index: number) => (
                <div key={`cif-${partenaire.id}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Logo */}
                  <div className={`h-32 flex items-center justify-center p-6 ${partenaire.nom === 'AESTIAM' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    {(partenaire.logoUrl || partenaire.logo_url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                      <img 
                          src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                          className="max-h-20 max-w-[90%] w-auto h-auto object-contain"
                          style={{ 
                            maxHeight: '80px',
                            maxWidth: '90%',
                            width: 'auto',
                            height: 'auto'
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', partenaire.logoUrl || partenaire.logo_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl">${partenaire.nom.charAt(0)}</div>`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {partenaire.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 text-center">{partenaire.nom}</h3>
                    
                    {/* Lien vers le site */}
                    <a
                      href={partenaire.website || partenaire.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                    >
                      🌐 Visiter le site
                    </a>
                    
                    {/* Documents contractuels (seulement pour les fallback avec documents) */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents récents</h4>
                        {partenaire.documents.slice(0, 2).map((doc: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{doc.nom}</div>
                          <div className="flex justify-between text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                    
                    {/* Description (seulement pour les partenaires de la DB) */}
                    {(!partenaire.documents || !Array.isArray(partenaire.documents)) && partenaire.description && (
                      <p className="text-xs text-gray-600 text-center line-clamp-2">{partenaire.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Protocoles */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Protocoles et Documents Contractuels</h2>
        <div className="space-y-4">
          {getFilteredPartenaires()
            .filter((partenaire: Partner) => partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0)
            .map((partenaire: Partner) => (
            <div key={partenaire.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{partenaire.nom}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {partenaire.documents && partenaire.documents.map((doc: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                        {doc.type}
                      </span>
                      <span className="text-xs text-gray-500">{doc.date}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-800">{doc.nom}</div>
                    <button className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                      📄 Voir le document
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
  );
}

