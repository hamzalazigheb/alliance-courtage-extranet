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
      'indigo': { gradient: 'from-indigo-50 to-purple-50', border: 'border-indigo-200', text: 'text-indigo-800', button: 'bg-indigo-500' },
      'purple': { gradient: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-800', button: 'bg-purple-500' },
      'pink': { gradient: 'from-pink-50 to-rose-50', border: 'border-pink-200', text: 'text-pink-800', button: 'bg-pink-500' },
      'blue': { gradient: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-800', button: 'bg-blue-500' },
      'green': { gradient: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-800', button: 'bg-green-500' },
      'yellow': { gradient: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', text: 'text-yellow-800', button: 'bg-yellow-500' },
      'red': { gradient: 'from-red-50 to-rose-50', border: 'border-red-200', text: 'text-red-800', button: 'bg-red-500' },
      'orange': { gradient: 'from-orange-50 to-amber-50', border: 'border-orange-200', text: 'text-orange-800', button: 'bg-orange-500' }
    };
    return colors[color] || colors['indigo'];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('doc')) return '📝';
    if (type?.includes('excel') || type?.includes('sheet') || type?.includes('xls')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation') || type?.includes('ppt')) return '📎';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('zip') || type?.includes('rar')) return '📦';
    return '📁';
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
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          📎 Documents ({files.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => handleDownload(file)}
              className="flex items-center space-x-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <span className="text-lg flex-shrink-0">{getFileIcon(file.fileType)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-600">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          ))}
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
        className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 relative ${content.headerImage ? '' : ''}`}
        style={content.headerImage ? {
          backgroundImage: `url(${content.headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '300px'
        } : {}}
      >
        {content.headerImage && (
          <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        )}
        <div className="relative z-10">
          <div className={content.headerImage ? 'bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg' : ''}>
            <h1 className={`text-3xl font-bold mb-4 ${content.headerImage ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
              {content.title || 'NOS ÉVÉNEMENTS'}
            </h1>
            <p className={`text-lg ${content.headerImage ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
              {content.subtitle || 'Espace dédié aux événements et échanges de la communauté Alliance Courtage'}
            </p>
            {content.introText && (
              <div className={`mt-4 p-4 rounded-lg ${content.headerImage ? 'bg-white/10 backdrop-blur-sm border border-white/20' : 'bg-gray-50'}`}>
                <p className={content.headerImage ? 'text-white italic' : 'text-gray-700 italic'}>{content.introText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {totalEvents > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-white/20">
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
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun événement trouvé</h3>
          <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterSection('all'); }}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Section Prochains Événements */}
      {filteredUpcoming.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📅</span>
            Prochains Événements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUpcoming.map((meeting: any, index: number) => {
              const colors = getColorClasses(meeting.color || 'indigo');
              
              return (
                <div key={index} className={`bg-gradient-to-br ${colors.gradient} p-6 rounded-xl border ${colors.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xl font-semibold ${colors.text}`}>{meeting.title}</h3>
                    <span className={`${colors.button} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {meeting.date}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-gray-700 border border-gray-200">
                      {getEventTypeLabel(meeting.eventType).icon} {getEventTypeLabel(meeting.eventType).label}
                    </span>
                  </div>
                  {meeting.description && (
                    <p className="text-gray-700 mb-4">{meeting.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {meeting.location && <span>📍 {meeting.location}</span>}
                    {meeting.time && <span>⏰ {meeting.time}</span>}
                  </div>
                  <button className={`mt-4 ${colors.button} hover:opacity-90 text-white px-4 py-2 rounded-lg transition-colors`}>
                    S'inscrire
                  </button>
                  
                  {renderFiles(meeting.files)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Historique des Événements */}
      {filteredHistorical.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📚</span>
            Historique des Événements
          </h2>
          
          <div className="space-y-4">
            {filteredHistorical.map((meeting: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        {getEventTypeLabel(meeting.eventType).icon} {getEventTypeLabel(meeting.eventType).label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{meeting.date}</p>
                  </div>
                  {meeting.reportUrl ? (
                    <a
                      href={meeting.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex-shrink-0"
                    >
                      📄 Voir le compte-rendu
                    </a>
                  ) : null}
                </div>
                
                {renderFiles(meeting.files)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Echanges - Cachée pour l'instant */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 opacity-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">💬</span>
          Espace Echanges
          <span className="ml-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Bientôt disponible
          </span>
        </h2>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Espace en construction</h3>
          <p className="text-gray-500">
            L'espace d'échanges sera bientôt disponible pour permettre aux membres GNCA 
            de partager leurs expériences et de collaborer.
          </p>
        </div>
      </div>
    </div>
  );
}
