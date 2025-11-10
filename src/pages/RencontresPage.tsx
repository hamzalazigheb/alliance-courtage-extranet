import React, { useState, useEffect } from "react";
import { buildAPIURL } from '../api';

export default function RencontresPage() {
  const [content, setContent] = useState<any>({
    title: 'RENCONTRES',
    subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
    headerImage: '',
    introText: '',
    upcomingMeetings: [],
    historicalMeetings: []
  });
  const [loading, setLoading] = useState(true);

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
            
            // Si c'est une string, parser une première fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // Si le résultat est encore une string, parser une deuxième fois
            if (typeof parsedContent === 'string') {
              parsedContent = JSON.parse(parsedContent);
            }
            
            // S'assurer que les propriétés existent
            setContent({
              title: parsedContent.title || 'RENCONTRES',
              subtitle: parsedContent.subtitle || 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
              headerImage: parsedContent.headerImage || '',
              introText: parsedContent.introText || '',
              upcomingMeetings: Array.isArray(parsedContent.upcomingMeetings) ? parsedContent.upcomingMeetings : [],
              historicalMeetings: Array.isArray(parsedContent.historicalMeetings) ? parsedContent.historicalMeetings : []
            });
          } catch (parseError) {
            // Silencieusement utiliser les valeurs par défaut si le JSON est corrompu
            // Ne pas logger l'erreur pour éviter le spam dans la console
            setContent({
              title: 'RENCONTRES',
              subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
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
      // En cas d'erreur, utiliser les valeurs par défaut
      setContent({
        title: 'RENCONTRES',
        subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
        headerImage: '',
        introText: '',
        upcomingMeetings: [],
        historicalMeetings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      'indigo': 'from-indigo-50 to-purple-50 border-indigo-200 text-indigo-800 bg-indigo-500',
      'purple': 'from-purple-50 to-pink-50 border-purple-200 text-purple-800 bg-purple-500',
      'pink': 'from-pink-50 to-rose-50 border-pink-200 text-pink-800 bg-pink-500',
      'blue': 'from-blue-50 to-cyan-50 border-blue-200 text-blue-800 bg-blue-500',
      'green': 'from-green-50 to-emerald-50 border-green-200 text-green-800 bg-green-500',
      'yellow': 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800 bg-yellow-500',
      'red': 'from-red-50 to-rose-50 border-red-200 text-red-800 bg-red-500',
      'orange': 'from-orange-50 to-amber-50 border-orange-200 text-orange-800 bg-orange-500'
    };
    return colors[color] || colors['indigo'];
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
        {/* Overlay très léger seulement pour améliorer la lisibilité du texte */}
        {content.headerImage && (
          <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        )}
        <div className="relative z-10">
          <div className={content.headerImage ? 'bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg' : ''}>
            <h1 className={`text-3xl font-bold mb-4 ${content.headerImage ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
              {content.title || 'RENCONTRES'}
            </h1>
            <p className={`text-lg ${content.headerImage ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
              {content.subtitle || 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage'}
            </p>
            {content.introText && (
              <div className={`mt-4 p-4 rounded-lg ${content.headerImage ? 'bg-white/10 backdrop-blur-sm border border-white/20' : 'bg-gray-50'}`}>
                <p className={content.headerImage ? 'text-white italic' : 'text-gray-700 italic'}>{content.introText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Rencontres Actuelles */}
      {content.upcomingMeetings && content.upcomingMeetings.length > 0 && (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📅</span>
          Prochaines Rencontres
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.upcomingMeetings.map((meeting: any, index: number) => {
              const colorInfo = getColorClasses(meeting.color || 'indigo');
              const [gradient, border, textColor, buttonColor] = colorInfo.split(' ');
              
              return (
                <div key={index} className={`bg-gradient-to-br ${gradient} p-6 rounded-xl border ${border}`}>
            <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${textColor}`}>{meeting.title}</h3>
                    <span className={`${buttonColor} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {meeting.date}
                    </span>
            </div>
                  {meeting.description && (
                    <p className="text-gray-700 mb-4">{meeting.description}</p>
                  )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {meeting.location && <span>📍 {meeting.location}</span>}
                    {meeting.time && <span>⏰ {meeting.time}</span>}
            </div>
                  <button className={`mt-4 ${buttonColor} hover:opacity-90 text-white px-4 py-2 rounded-lg transition-colors`}>
              S'inscrire
            </button>
          </div>
              );
            })}
        </div>
      </div>
      )}

      {/* Section Historique des Rencontres */}
      {content.historicalMeetings && content.historicalMeetings.length > 0 && (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">📚</span>
          Historique des Rencontres
        </h2>
        
        <div className="space-y-4">
            {content.historicalMeetings.map((meeting: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
                  <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">{meeting.date}</p>
            </div>
                {meeting.reportUrl ? (
                  <a
                    href={meeting.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
              📄 Voir le compte-rendu
                  </a>
                ) : (
                  <button className="text-gray-400 text-sm font-medium cursor-not-allowed">
                    📄 Compte-rendu non disponible
            </button>
                )}
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

