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
  const [uploadingImage, setUploadingImage] = useState(false);

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Image d'en-tête</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setUploadingImage(true);
                  try {
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    const token = localStorage.getItem('token');
                    const response = await fetch(buildAPIURL('/cms/upload-image'), {
                      method: 'POST',
                      headers: {
                        'x-auth-token': token || ''
                      },
                      body: formData
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      console.log('✅ Image uploadée:', {
                        success: data.success,
                        imageUrlLength: data.imageUrl?.length,
                        mimeType: data.mimeType,
                        size: data.size
                      });
                      setPageContent({ ...pageContent, headerImage: data.imageUrl });
                    } else {
                      const error = await response.json();
                      console.error('❌ Erreur upload:', error);
                      alert(error.error || 'Erreur lors de l\'upload de l\'image');
                    }
                  } catch (error) {
                    console.error('Erreur upload image:', error);
                    alert('Erreur lors de l\'upload de l\'image');
                  } finally {
                    setUploadingImage(false);
                  }
                }}
                className="flex-1 text-sm text-gray-700 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
              />
              {uploadingImage && <span className="text-gray-500 text-sm">Upload...</span>}
            </div>
            <input
              type="text"
              value={pageContent.headerImage}
              onChange={(e) => setPageContent({ ...pageContent, headerImage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="URL de l'image ou utilisez l'upload ci-dessus"
            />
            {pageContent.headerImage && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">
                  Preview ({pageContent.headerImage.length} caractères)
                  {pageContent.headerImage.startsWith('data:image') ? ' - Base64' : ' - URL'}
                </p>
                <img 
                  src={pageContent.headerImage} 
                  alt="Preview" 
                  className="max-w-md h-32 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    console.error('❌ Erreur affichage image:', {
                      src: pageContent.headerImage.substring(0, 100) + '...',
                      length: pageContent.headerImage.length
                    });
                    alert('Erreur: L\'image ne peut pas être affichée. Vérifiez le format.');
                  }}
                  onLoad={() => {
                    console.log('✅ Image chargée avec succès');
                  }}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload direct d'image ou URL complète</p>
        </div>
      </div>
    </div>
  );
};

export default GammeFinanciereCMSPage;

