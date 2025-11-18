import React, { useState, useEffect } from "react";
import { buildAPIURL, buildFileURL } from '../api';
import { Partner, PartnerDocument, PartnerContact } from '../types';

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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          console.error('❌ Erreur chargement partenaires:', response.status, errorData);
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Partners loaded from API:', data.length);
        // Debug: vérifier les documents et contacts
        data.forEach((p: Partner) => {
          if (p.documents && p.documents.length > 0) {
            console.log(`📄 Partner ${p.nom} has ${p.documents.length} documents:`, p.documents.map((d: PartnerDocument) => d.title));
          }
          if (p.contacts && p.contacts.length > 0) {
            console.log(`👤 Partner ${p.nom} has ${p.contacts.length} contacts:`, p.contacts.map((c: PartnerContact) => `${c.prenom} ${c.nom} (${c.fonction})`));
          }
        });
        
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
                    
                    {/* Contacts */}
                    {partenaire.contacts && Array.isArray(partenaire.contacts) && partenaire.contacts.length > 0 && (
                      <div className="space-y-2 border-t border-gray-200 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Contacts ({partenaire.contacts.length})
                        </h4>
                        {partenaire.contacts.slice(0, 3).map((contact: PartnerContact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded transition-colors border border-indigo-200"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{contact.prenom} {contact.nom}</div>
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 truncate block"
                                >
                                  📧 {contact.email}
                                </a>
                                {contact.telephone && (
                                  <a 
                                    href={`tel:${contact.telephone}`}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 truncate block"
                                  >
                                    📞 {contact.telephone}
                                  </a>
                                )}
                              </div>
                              {contact.fonction && (
                                <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded ml-1 flex-shrink-0">
                                  {contact.fonction.substring(0, 8)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {partenaire.contacts.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-1">+{partenaire.contacts.length - 3} autre(s) contact(s)</p>
                        )}
                      </div>
                    )}
                    
                    {/* Documents téléchargeables */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                      <div className="space-y-2 border-t border-gray-200 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Documents ({partenaire.documents.length})
                        </h4>
                        {partenaire.documents.slice(0, 3).map((doc: PartnerDocument) => (
                          <a
                            key={doc.id}
                            href={doc.downloadUrl}
                            download
                            className="flex items-center justify-between text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded transition-colors group border border-blue-200"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium truncate">{doc.title}</span>
                              {doc.document_type && (
                                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded ml-1">
                                  {doc.document_type === 'convention' ? 'Conv.' : doc.document_type.substring(0, 3)}
                                </span>
                              )}
                            </div>
                            <svg className="w-4 h-4 flex-shrink-0 ml-2 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        ))}
                        {partenaire.documents.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-1">+{partenaire.documents.length - 3} autre(s) document(s)</p>
                        )}
                      </div>
                    )}
                    
                    {/* Description */}
                    {partenaire.description && (
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
                    
                    {/* Contacts */}
                    {partenaire.contacts && Array.isArray(partenaire.contacts) && partenaire.contacts.length > 0 && (
                      <div className="space-y-2 border-t border-gray-200 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Contacts ({partenaire.contacts.length})
                        </h4>
                        {partenaire.contacts.slice(0, 3).map((contact: PartnerContact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 p-2 rounded transition-colors border border-purple-200"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{contact.prenom} {contact.nom}</div>
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="text-[10px] text-purple-600 hover:text-purple-800 truncate block"
                                >
                                  📧 {contact.email}
                                </a>
                                {contact.telephone && (
                                  <a 
                                    href={`tel:${contact.telephone}`}
                                    className="text-[10px] text-purple-600 hover:text-purple-800 truncate block"
                                  >
                                    📞 {contact.telephone}
                                  </a>
                                )}
                              </div>
                              {contact.fonction && (
                                <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded ml-1 flex-shrink-0">
                                  {contact.fonction.substring(0, 8)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {partenaire.contacts.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-1">+{partenaire.contacts.length - 3} autre(s) contact(s)</p>
                        )}
                      </div>
                    )}
                    
                    {/* Documents téléchargeables */}
                    {partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0 && (
                      <div className="space-y-2 border-t border-gray-200 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Documents ({partenaire.documents.length})
                        </h4>
                        {partenaire.documents.slice(0, 3).map((doc: PartnerDocument) => (
                          <a
                            key={doc.id}
                            href={doc.downloadUrl}
                            download
                            className="flex items-center justify-between text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 p-2 rounded transition-colors group border border-purple-200"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium truncate">{doc.title}</span>
                              {doc.document_type && (
                                <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded ml-1">
                                  {doc.document_type === 'convention' ? 'Conv.' : doc.document_type.substring(0, 3)}
                                </span>
                              )}
                            </div>
                            <svg className="w-4 h-4 flex-shrink-0 ml-2 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        ))}
                        {partenaire.documents.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-1">+{partenaire.documents.length - 3} autre(s) document(s)</p>
                        )}
                      </div>
                    )}
                    
                    {/* Description */}
                    {partenaire.description && (
                      <p className="text-xs text-gray-600 text-center line-clamp-2">{partenaire.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Contacts */}
      {getFilteredPartenaires().some((p: Partner) => p.contacts && Array.isArray(p.contacts) && p.contacts.length > 0) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Contacts Partenaires
          </h2>
          <div className="space-y-6">
            {getFilteredPartenaires()
              .filter((partenaire: Partner) => partenaire.contacts && Array.isArray(partenaire.contacts) && partenaire.contacts.length > 0)
              .map((partenaire: Partner) => (
                <div key={partenaire.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center space-x-3 mb-4">
                    {(partenaire.logoUrl || partenaire.logo_url) && (
                      <img 
                        src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-800">{partenaire.nom}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partenaire.contacts.map((contact: PartnerContact) => (
                      <div
                        key={contact.id}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800">
                              {contact.prenom} {contact.nom}
                            </div>
                            {contact.fonction && (
                              <div className="text-xs text-indigo-600 font-medium mt-1">
                                {contact.fonction}
                              </div>
                            )}
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-xs text-gray-600 hover:text-indigo-600 mt-1 block truncate"
                            >
                              📧 {contact.email}
                            </a>
                            {contact.telephone && (
                              <a 
                                href={`tel:${contact.telephone}`}
                                className="text-xs text-gray-600 hover:text-indigo-600 mt-1 block"
                              >
                                📞 {contact.telephone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Section Documents et Conventions */}
      {getFilteredPartenaires().some((p: Partner) => p.documents && Array.isArray(p.documents) && p.documents.length > 0) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Conventions de Distribution et Documents
          </h2>
          <div className="space-y-6">
            {getFilteredPartenaires()
              .filter((partenaire: Partner) => partenaire.documents && Array.isArray(partenaire.documents) && partenaire.documents.length > 0)
              .map((partenaire: Partner) => (
                <div key={partenaire.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center space-x-3 mb-4">
                    {(partenaire.logoUrl || partenaire.logo_url) && (
                      <img 
                        src={partenaire.logoUrl || (partenaire.logo_url && partenaire.logo_url.startsWith('/uploads/') ? buildFileURL(partenaire.logo_url) : partenaire.logo_url)} 
                        alt={`Logo ${partenaire.nom}`}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-800">{partenaire.nom}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partenaire.documents.map((doc: PartnerDocument) => (
                      <a
                        key={doc.id}
                        href={doc.downloadUrl}
                        download
                        className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 truncate">
                                {doc.title}
                              </div>
                              {doc.document_type && (
                                <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                  {doc.document_type === 'convention' ? 'Convention' : 
                                   doc.document_type === 'brochure' ? 'Brochure' : 
                                   doc.document_type === 'contrat' ? 'Contrat' : 
                                   doc.document_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 flex-shrink-0 group-hover:translate-y-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{doc.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{doc.file_type?.split('/')[1]?.toUpperCase() || 'PDF'}</span>
                          {doc.file_size && (
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
        </div>
  );
}

