import React, { useState, useEffect, useMemo } from "react";
import { buildAPIURL } from '../api';

interface MeetingFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

const EVENT_TYPES: Record<string, { label: string; icon: string }> = {
  'reunion': { label: 'Réunion', icon: '🤝' },
  'seminaire': { label: 'Séminaire', icon: '🎓' },
  'event': { label: 'Événement', icon: '🎉' },
  'formation': { label: 'Formation', icon: '📖' },
  'assemblee': { label: 'Assemblée Générale', icon: '🏛️' },
  'conference': { label: 'Conférence', icon: '🎤' },
  'webinaire': { label: 'Webinaire', icon: '💻' },
  'atelier': { label: 'Atelier', icon: '🛠️' },
  'autre': { label: 'Autre', icon: '📌' }
};

export default function RencontresPage() {
  const [content, setContent] = useState<any>({
    title: 'NOS ÉVÉNEMENTS',
    subtitle: 'Espace dédié aux événements et échanges de la communauté Alliance Courtage',
    headerImage: '',
    introText: '',
    upcomingMeetings: [],
    historicalMeetings: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<'all' | 'upcoming' | 'historical'>('all');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/rencontres'), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          try {
            let parsedContent = data.content;
            if (typeof parsedContent === 'string') parsedContent = JSON.parse(parsedContent);
            if (typeof parsedContent === 'string') parsedContent = JSON.parse(parsedContent);
            
            const upcoming = Array.isArray(parsedContent.upcomingMeetings) ? parsedContent.upcomingMeetings : [];
            const historical = Array.isArray(parsedContent.historicalMeetings) ? parsedContent.historicalMeetings : [];

            const today = new Date().toISOString().split('T')[0];
            const stillUpcoming: any[] = [];
            const migrated: any[] = [];

            for (const m of upcoming) {
              if (m.expirationDate && m.expirationDate < today) {
                migrated.push({
                  title: m.title,
                  date: m.date,
                  reportUrl: '',
                  eventType: m.eventType,
                  files: m.files
                });
              } else {
                stillUpcoming.push(m);
              }
            }

            setContent({
              title: parsedContent.title || 'NOS ÉVÉNEMENTS',
              subtitle: parsedContent.subtitle || 'Espace dédié aux événements et échanges de la communauté Alliance Courtage',
              headerImage: parsedContent.headerImage || '',
              introText: parsedContent.introText || '',
              upcomingMeetings: stillUpcoming,
              historicalMeetings: [...migrated, ...historical]
            });

            if (migrated.length > 0) {
              const newContent = {
                ...parsedContent,
                upcomingMeetings: stillUpcoming,
                historicalMeetings: [...migrated, ...historical]
              };
              fetch(buildAPIURL('/cms/rencontres'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ content: JSON.stringify(newContent) })
              }).catch(err => console.error('Erreur auto-migration:', err));
            }
          } catch (parseError) {
            setContent({
              title: 'NOS ÉVÉNEMENTS',
              subtitle: 'Espace dédié aux événements et échanges de la communauté Alliance Courtage',
              headerImage: '',
              introText: '',
              upcomingMeetings: [],
              historicalMeetings: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu CMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { gradient: string; border: string; text: string; button: string } } = {
      'indigo':  { gradient: 'from-indigo-50 to-purple-50',   border: 'border-indigo-200',  text: 'text-indigo-800',  button: 'bg-indigo-500' },
      'purple':  { gradient: 'from-purple-50 to-pink-50',     border: 'border-purple-200',  text: 'text-purple-800',  button: 'bg-purple-500' },
      'violet':  { gradient: 'from-violet-50 to-purple-50',   border: 'border-violet-200',  text: 'text-violet-800',  button: 'bg-violet-500' },
      'fuchsia': { gradient: 'from-fuchsia-50 to-pink-50',    border: 'border-fuchsia-200', text: 'text-fuchsia-800', button: 'bg-fuchsia-500' },
      'pink':    { gradient: 'from-pink-50 to-rose-50',       border: 'border-pink-200',    text: 'text-pink-800',    button: 'bg-pink-500' },
      'rose':    { gradient: 'from-rose-50 to-pink-50',       border: 'border-rose-200',    text: 'text-rose-800',    button: 'bg-rose-500' },
      'red':     { gradient: 'from-red-50 to-rose-50',        border: 'border-red-200',     text: 'text-red-800',     button: 'bg-red-500' },
      'orange':  { gradient: 'from-orange-50 to-amber-50',    border: 'border-orange-200',  text: 'text-orange-800',  button: 'bg-orange-500' },
      'amber':   { gradient: 'from-amber-50 to-yellow-50',    border: 'border-amber-200',   text: 'text-amber-800',   button: 'bg-amber-500' },
      'yellow':  { gradient: 'from-yellow-50 to-amber-50',    border: 'border-yellow-200',  text: 'text-yellow-800',  button: 'bg-yellow-500' },
      'lime':    { gradient: 'from-lime-50 to-green-50',      border: 'border-lime-200',    text: 'text-lime-800',    button: 'bg-lime-500' },
      'green':   { gradient: 'from-green-50 to-emerald-50',   border: 'border-green-200',   text: 'text-green-800',   button: 'bg-green-500' },
      'teal':    { gradient: 'from-teal-50 to-cyan-50',       border: 'border-teal-200',    text: 'text-teal-800',    button: 'bg-teal-500' },
      'cyan':    { gradient: 'from-cyan-50 to-sky-50',        border: 'border-cyan-200',    text: 'text-cyan-800',    button: 'bg-cyan-500' },
      'sky':     { gradient: 'from-sky-50 to-blue-50',        border: 'border-sky-200',     text: 'text-sky-800',     button: 'bg-sky-500' },
      'blue':    { gradient: 'from-blue-50 to-cyan-50',       border: 'border-blue-200',    text: 'text-blue-800',    button: 'bg-blue-500' },
    };
    return colors[color] || colors['indigo'];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileMeta = (type: string): { bg: string; text: string; badge: string; label: string; icon: React.ReactNode } => {
    if (type?.includes('pdf'))
      return {
        bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-600 border-red-200', label: 'PDF',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5h-1v-5h1.8c1.1 0 1.7.6 1.7 1.5 0 1-.7 1.5-1.8 1.5H8.5v2zm0-2.7h.7c.5 0 .8-.2.8-.7s-.3-.7-.8-.7H8.5v1.4zm4.2 2.7h-1.3v-5h1.3c1.5 0 2.3.9 2.3 2.5s-.8 2.5-2.3 2.5zm0-4h-.3v3h.3c.8 0 1.3-.5 1.3-1.5s-.5-1.5-1.3-1.5zm4.3 4h-1v-5h3v1h-2v1.2h1.8v1H16v1.8z"/>
          </svg>
        )
      };
    if (type?.includes('word') || type?.includes('doc'))
      return {
        bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-600 border-blue-200', label: 'Word',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 17l1.5-5h1l1.5 5h-1l-.3-1H8.3L8 17H7zm1.6-2h1l-.5-1.8-.5 1.8zm3.4 2v-5h1v4h2v1h-3z"/>
          </svg>
        )
      };
    if (type?.includes('excel') || type?.includes('sheet') || type?.includes('xls'))
      return {
        bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-600 border-green-200', label: 'Excel',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 12h2.5l1.5 2.5L12.5 12H15l-2.5 4 2.5 4h-2.5L11 17.5 9.5 20H7l2.5-4L7 12z"/>
          </svg>
        )
      };
    if (type?.includes('powerpoint') || type?.includes('presentation') || type?.includes('ppt'))
      return {
        bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-600 border-orange-200', label: 'PPT',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 12h3c1.1 0 2 .9 2 2s-.9 2-2 2H9v2H8v-6zm1 1v2h2c.6 0 1-.4 1-1s-.4-1-1-1H9z"/>
          </svg>
        )
      };
    if (type?.includes('image'))
      return {
        bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-600 border-purple-200', label: 'Image',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/>
          </svg>
        )
      };
    if (type?.includes('zip') || type?.includes('rar'))
      return {
        bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-600 border-amber-200', label: 'Archive',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 1h2v2h-2V7zm0 3h2v2h-2v-2zm-2-3h2v2h-2V7zm0 3h2v2h-2v-2z"/>
          </svg>
        )
      };
    return {
      bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Fichier',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
        </svg>
      )
    };
  };

  const getEventTypeLabel = (eventType?: string) => {
    return EVENT_TYPES[eventType || 'event'] || EVENT_TYPES['event'];
  };

  // Collect all unique event types present in the data
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    [...(content.upcomingMeetings || []), ...(content.historicalMeetings || [])].forEach((m: any) => {
      types.add(m.eventType || 'event');
    });
    return Array.from(types).sort();
  }, [content.upcomingMeetings, content.historicalMeetings]);

  // Filter logic
  const matchesFilter = (meeting: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (meeting.title || '').toLowerCase().includes(q) ||
      (meeting.description || '').toLowerCase().includes(q) ||
      (meeting.location || '').toLowerCase().includes(q) ||
      (meeting.date || '').toLowerCase().includes(q);
    const matchesType = filterType === 'all' || (meeting.eventType || 'event') === filterType;
    return matchesSearch && matchesType;
  };

  const filteredUpcoming = useMemo(() => {
    if (filterSection === 'historical') return [];
    return (content.upcomingMeetings || []).filter(matchesFilter);
  }, [content.upcomingMeetings, searchQuery, filterType, filterSection]);

  const filteredHistorical = useMemo(() => {
    if (filterSection === 'upcoming') return [];
    return (content.historicalMeetings || []).filter(matchesFilter);
  }, [content.historicalMeetings, searchQuery, filterType, filterSection]);

  const totalResults = filteredUpcoming.length + filteredHistorical.length;
  const totalEvents = (content.upcomingMeetings || []).length + (content.historicalMeetings || []).length;
  const hasActiveFilter = searchQuery || filterType !== 'all' || filterSection !== 'all';

  const handleDownload = async (file: MeetingFile) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL(`/cms/rencontres/files/download/${file.fileName}`), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const renderFiles = (files: MeetingFile[] | undefined) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Documents joints · {files.length}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file) => {
            const meta = getFileMeta(file.fileType);
            return (
              <button
                key={file.id}
                onClick={() => handleDownload(file)}
                className={`group flex items-center gap-3 p-3 rounded-xl border ${meta.bg} border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-left`}
              >
                {/* File type icon */}
                <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg} ${meta.text} border ${meta.badge.split(' ')[2]}`}>
                  {meta.icon}
                </span>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${meta.text}`}>{file.originalName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${meta.badge}`}>{meta.label}</span>
                    <span className="text-[10px] text-gray-400">{formatFileSize(file.fileSize)}</span>
                  </div>
                </div>
                {/* Download arrow */}
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-y-0.5 ${meta.text} opacity-60`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div
        className="rounded-2xl overflow-hidden shadow-md relative bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]"
        style={content.headerImage ? {
          backgroundImage: `url(${content.headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {content.headerImage && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/80 to-[#1D4ED8]/60"></div>
        )}
        <div className="relative z-10 px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
            {content.title || 'NOS ÉVÉNEMENTS'}
          </h1>
          <p className="text-blue-100 text-base max-w-2xl">
            {content.subtitle || 'Espace dédié aux événements et échanges de la communauté Alliance Courtage'}
          </p>
          {content.introText && (
            <p className="mt-4 text-blue-50 italic text-sm max-w-2xl">{content.introText}</p>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      {totalEvents > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un événement..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all min-w-[180px]"
            >
              <option value="all">Tous les types</option>
              {availableTypes.map(type => {
                const t = EVENT_TYPES[type] || EVENT_TYPES['event'];
                return <option key={type} value={type}>{t.icon} {t.label}</option>;
              })}
            </select>

            {/* Filter by section */}
            <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
              {([
                { value: 'all', label: 'Tous' },
                { value: 'upcoming', label: 'À venir' },
                { value: 'historical', label: 'Passés' }
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterSection(opt.value)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    filterSection === opt.value
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter info */}
          {hasActiveFilter && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {totalResults} résultat{totalResults !== 1 ? 's' : ''} sur {totalEvents} événement{totalEvents !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterSection('all'); }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {hasActiveFilter && totalResults === 0 && (
        <div className="bg-white/90 rounded-2xl shadow-md border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Aucun événement trouvé</h3>
          <p className="text-sm text-gray-400 mb-4">Essayez de modifier vos critères de recherche ou réinitialisez les filtres.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterSection('all'); }}
            className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1e40af] transition-colors text-sm font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Section Prochains Événements */}
      {filteredUpcoming.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Section header — dark navy like the rest of the app */}
          <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] px-6 py-4 flex items-center gap-3">
            <span className="text-xl">📅</span>
            <h2 className="text-xl font-semibold text-white tracking-wide">Prochains Événements</h2>
            <span className="ml-auto text-xs font-medium bg-white/15 text-white px-2.5 py-1 rounded-full">
              {filteredUpcoming.length} événement{filteredUpcoming.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredUpcoming.map((meeting: any, index: number) => {
                const colors = getColorClasses(meeting.color || 'indigo');
                return (
                  <div key={index} className={`bg-gradient-to-br ${colors.gradient} rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
                    {/* Card top accent bar */}
                    <div className={`h-1 w-full ${colors.button} rounded-t-xl`}></div>
                    <div className="p-5 flex flex-col flex-1">
                      {/* Type badge + date */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.button} text-white`}>
                          {getEventTypeLabel(meeting.eventType).icon} {getEventTypeLabel(meeting.eventType).label}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-white/70 px-2.5 py-1 rounded-full border border-gray-200">
                          📅 {meeting.date}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-base font-bold ${colors.text} mb-2 leading-snug`}>{meeting.title}</h3>

                      {/* Description */}
                      {meeting.description && (
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed flex-1">{meeting.description}</p>
                      )}

                      {/* Location & time */}
                      {(meeting.location || meeting.time) && (
                        <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                          {meeting.location && (
                            <span className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-md px-2 py-1">
                              📍 {meeting.location}
                            </span>
                          )}
                          {meeting.time && (
                            <span className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-md px-2 py-1">
                              ⏰ {meeting.time}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <button className={`self-start mt-auto ${colors.button} hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-opacity shadow-sm`}>
                        S'inscrire →
                      </button>

                      {renderFiles(meeting.files)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section Historique des Événements */}
      {filteredHistorical.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Section header */}
          <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] px-6 py-4 flex items-center gap-3">
            <span className="text-xl">📋</span>
            <h2 className="text-xl font-semibold text-white tracking-wide">Historique des Événements</h2>
            <span className="ml-auto text-xs font-medium bg-white/15 text-white px-2.5 py-1 rounded-full">
              {filteredHistorical.length} événement{filteredHistorical.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredHistorical.map((meeting: any, index: number) => (
              <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Accent dot */}
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{meeting.title}</h3>
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {getEventTypeLabel(meeting.eventType).icon} {getEventTypeLabel(meeting.eventType).label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{meeting.date}</p>
                    {meeting.files && meeting.files.length > 0 && renderFiles(meeting.files)}
                  </div>
                </div>
                {meeting.reportUrl && (
                  <a
                    href={meeting.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    📄 Compte-rendu
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Echanges - Cachée pour l'instant */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 overflow-hidden opacity-60">
        <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] px-6 py-4 flex items-center gap-3">
          <span className="text-xl">💬</span>
          <h2 className="text-xl font-semibold text-white tracking-wide">Espace Échanges</h2>
          <span className="ml-auto text-xs font-medium bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full">
            Bientôt disponible
          </span>
        </div>
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🚧</div>
          <h3 className="text-base font-semibold text-gray-600 mb-1">Espace en construction</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            L'espace d'échanges sera bientôt disponible pour permettre aux membres GNCA de partager leurs expériences et collaborer.
          </p>
        </div>
      </div>
    </div>
  );
}
