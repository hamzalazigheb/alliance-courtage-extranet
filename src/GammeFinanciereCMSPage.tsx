import React, { useState, useEffect } from 'react';
import { buildAPIURL } from './api';

interface PageContent {
  title: string;
  subtitle: string;
  description: string;
  headerImage: string;
}

const GammeFinanciereCMSPage: React.FC = () => {
  const [pageContent, setPageContent] = useState<PageContent>({
    title: 'Gamme Financière',
    subtitle: 'Découvrez notre sélection de produits financiers',
    description: 'Explorez notre gamme complète de produits financiers conçus pour répondre à vos besoins d\'investissement et de gestion patrimoniale.',
    headerImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/gamme-financiere'), {
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
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/gamme-financiere'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ content: JSON.stringify(pageContent) })
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Contenu sauvegardé avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur lors de la sauvegarde'));
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion Gamme Financière</h2>
        <button
          onClick={saveContent}
          disabled={saving}
          className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
          <input
            type="text"
            value={pageContent.title}
            onChange={(e) => setPageContent({ ...pageContent, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Titre de la page"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
          <input
            type="text"
            value={pageContent.subtitle}
            onChange={(e) => setPageContent({ ...pageContent, subtitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Sous-titre de la page"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={pageContent.description}
            onChange={(e) => setPageContent({ ...pageContent, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={4}
            placeholder="Description de la page"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">URL de l'image d'en-tête</label>
          <input
            type="text"
            value={pageContent.headerImage}
            onChange={(e) => setPageContent({ ...pageContent, headerImage: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">URL complète de l'image ou chemin relatif</p>
        </div>
      </div>
    </div>
  );
};

export default GammeFinanciereCMSPage;

