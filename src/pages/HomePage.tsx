import React, { useState, useEffect } from "react";
import { buildAPIURL } from '../api';

export default function HomePage() {
  interface HomePageContent {
    welcomeTitle: string;
    news: Array<{ title: string; content: string; date: string; color: string }>;
    services: Array<{ name: string }>;
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
      }
    } catch (error) {
      console.error('Error loading CMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = { indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500', green: 'bg-green-500', blue: 'bg-blue-500' };
    return colors[color] || 'bg-indigo-500';
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
            content.news.map((newsItem, index) => (
              <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{newsItem.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">{newsItem.content}</p>
                  <span className="text-xs text-gray-500">{newsItem.date}</span>
            </div>
          </div>
            ))
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
    </div>
  );
}

