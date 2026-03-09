import React, { useState, useEffect } from "react";
import { buildAPIURL } from '../api';

export default function HomePage() {
  interface HomePageContent {
    welcomeTitle: string;
    news: Array<{ title: string; content: string; date: string; color: string }>;
    services: Array<{ name: string }>;
    contact?: {
      phone: string;
      email: string;
    };
  }

  const [content, setContent] = useState<HomePageContent>({
    welcomeTitle: 'Bienvenue chez Alliance Courtage',
    news: [],
    services: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/home'), {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.content) setContent(JSON.parse(data.content));
      } else if (response.status === 401) {
        // Token expiré, ne pas logger l'erreur (la déconnexion automatique se fera)
        console.warn('Session expirée, redirection vers la page de connexion...');
      }
    } catch (error: any) {
      // Ne logger que les erreurs non-authentification
      if (!error.message?.includes('Token expiré') && !error.message?.includes('Unauthorized')) {
        console.error('Error loading CMS:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderNewsContent = (text: string) => {
    if (!text || !text.trim()) return null;
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length <= 1) {
      return <p className="text-gray-600 text-xs sm:text-sm mb-2">{text}</p>;
    }
    return (
      <ul className="text-gray-600 text-xs sm:text-sm mb-2 list-disc list-inside space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="pl-1">{line.replace(/^[\s\-•*]+\s*/, '')}</li>
        ))}
      </ul>
    );
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { gradient: string; border: string; text: string } } = {
      'indigo': { gradient: 'from-indigo-50 to-purple-50', border: 'border-indigo-200', text: 'text-indigo-800' },
      'purple': { gradient: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-800' },
      'pink': { gradient: 'from-pink-50 to-rose-50', border: 'border-pink-200', text: 'text-pink-800' },
      'blue': { gradient: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-800' },
      'green': { gradient: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-800' },
      'yellow': { gradient: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', text: 'text-yellow-800' },
      'red': { gradient: 'from-red-50 to-rose-50', border: 'border-red-200', text: 'text-red-800' },
      'orange': { gradient: 'from-orange-50 to-amber-50', border: 'border-orange-200', text: 'text-orange-800' }
    };
    return colors[color] || colors['indigo'];
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{content.welcomeTitle}</h1>
      </div>

      {/* News Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Actualités</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {content.news && content.news.length > 0 ? (
            content.news.map((newsItem, index) => {
              const colors = getColorClasses(newsItem.color || 'indigo');
              return (
                <div
                  key={index}
                  className={`p-4 sm:p-5 rounded-xl border bg-gradient-to-br ${colors.gradient} ${colors.border}`}
                >
                  <div className="min-w-0">
                    <h3 className={`font-semibold mb-2 text-sm sm:text-base ${colors.text}`}>{newsItem.title}</h3>
                    {renderNewsContent(newsItem.content)}
                    <span className={`text-xs ${colors.text} opacity-80`}>{newsItem.date}</span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* Services Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Nos Services</h3>
          <ul className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
            {content.services && content.services.length > 0 ? (
              content.services.map((service, index) => (
                <li key={index}>• {service.name}</li>
              ))
            ) : null}
          </ul>
        </div>
      </div>

      {/* Contact Section */}
      {content.contact && (content.contact.phone || content.contact.email) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Contact</h3>
          <div className="space-y-2 text-gray-600 text-sm sm:text-base">
            {content.contact.phone && (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${content.contact.phone.replace(/\s/g, '')}`} className="hover:text-blue-600">
                  {content.contact.phone}
                </a>
              </div>
            )}
            {content.contact.email && (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${content.contact.email}`} className="hover:text-blue-600">
                  {content.contact.email}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

