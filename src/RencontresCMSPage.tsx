import React, { useState, useEffect } from 'react';
import { buildAPIURL } from './api';

interface UpcomingMeeting {
  title: string;
  date: string;
  description: string;
  location: string;
  time: string;
  color: string;
}

interface HistoricalMeeting {
  title: string;
  date: string;
  reportUrl: string;
}

interface RencontresContent {
  title: string;
  subtitle: string;
  headerImage: string;
  introText: string;
  upcomingMeetings: UpcomingMeeting[];
  historicalMeetings: HistoricalMeeting[];
}

const RencontresCMSPage: React.FC = () => {
  const [content, setContent] = useState<RencontresContent>({
    title: 'RENCONTRES',
    subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
    headerImage: '',
    introText: '',
    upcomingMeetings: [],
    historicalMeetings: []
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
      const response = await fetch(buildAPIURL('/cms/rencontres'), {
        headers: { 'x-auth-token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          const parsedContent = JSON.parse(data.content);
          if (typeof parsedContent === 'string') {
            setContent(JSON.parse(parsedContent));
          } else {
            setContent(parsedContent);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/rencontres'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ 
          content: JSON.stringify(content)
        })
      });
      
      if (response.ok) {
        setSuccessMessage('✅ Contenu sauvegardé avec succès!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Erreur sauvegarde contenu:', error);
      alert('Erreur lors de la sauvegarde du contenu');
    } finally {
      setSaving(false);
    }
  };

  const addUpcomingMeeting = () => {
    setContent({
      ...content,
      upcomingMeetings: [
        ...content.upcomingMeetings,
        {
          title: 'Nouvelle Rencontre',
          date: new Date().toLocaleDateString('fr-FR'),
          description: '',
          location: '',
          time: '',
          color: 'indigo'
        }
      ]
    });
  };

  const removeUpcomingMeeting = (index: number) => {
    setContent({
      ...content,
      upcomingMeetings: content.upcomingMeetings.filter((_, i) => i !== index)
    });
  };

  const addHistoricalMeeting = () => {
    setContent({
      ...content,
      historicalMeetings: [
        ...content.historicalMeetings,
        {
          title: 'Rencontre Historique',
          date: '',
          reportUrl: ''
        }
      ]
    });
  };

  const removeHistoricalMeeting = (index: number) => {
    setContent({
      ...content,
      historicalMeetings: content.historicalMeetings.filter((_, i) => i !== index)
    });
  };

  const colorOptions = [
    { value: 'indigo', label: 'Indigo' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
    { value: 'orange', label: 'Orange' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Gestion du Contenu - Rencontres</h2>
          <button
            onClick={saveContent}
            disabled={saving}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder le contenu'}
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Header Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Titre Principal</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              placeholder="RENCONTRES"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Sous-titre</label>
            <input
              type="text"
              value={content.subtitle}
              onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              placeholder="Espace dédié aux rencontres..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Image d'en-tête (URL)</label>
            <input
              type="text"
              value={content.headerImage}
              onChange={(e) => setContent({ ...content, headerImage: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              placeholder="https://exemple.com/image.jpg"
            />
            {content.headerImage && (
              <div className="mt-2">
                <img 
                  src={content.headerImage} 
                  alt="Preview" 
                  className="max-w-md h-32 object-cover rounded-lg border border-slate-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Texte d'introduction</label>
            <textarea
              value={content.introText}
              onChange={(e) => setContent({ ...content, introText: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              placeholder="Texte d'introduction..."
            />
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-slate-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Prochaines Rencontres</h3>
              <button
                onClick={addUpcomingMeeting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm"
              >
                + Ajouter une rencontre
              </button>
            </div>

            <div className="space-y-4">
              {content.upcomingMeetings.map((meeting, index) => (
                <div key={index} className="bg-slate-600/40 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold">Rencontre #{index + 1}</h4>
                    <button
                      onClick={() => removeUpcomingMeeting(index)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Titre</label>
                      <input
                        type="text"
                        value={meeting.title}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].title = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Date</label>
                      <input
                        type="text"
                        value={meeting.date}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].date = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                        placeholder="15 Mars 2025"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Lieu</label>
                      <input
                        type="text"
                        value={meeting.location}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].location = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                        placeholder="Paris, France"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Horaire</label>
                      <input
                        type="text"
                        value={meeting.time}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].time = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                        placeholder="14h00 - 18h00"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-300 mb-1">Description</label>
                      <textarea
                        value={meeting.description}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].description = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Couleur</label>
                      <select
                        value={meeting.color}
                        onChange={(e) => {
                          const updated = [...content.upcomingMeetings];
                          updated[index].color = e.target.value;
                          setContent({ ...content, upcomingMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                      >
                        {colorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Meetings */}
          <div className="bg-slate-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Historique des Rencontres</h3>
              <button
                onClick={addHistoricalMeeting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm"
              >
                + Ajouter à l'historique
              </button>
            </div>

            <div className="space-y-3">
              {content.historicalMeetings.map((meeting, index) => (
                <div key={index} className="bg-slate-600/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">Rencontre Historique #{index + 1}</h4>
                    <button
                      onClick={() => removeHistoricalMeeting(index)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Titre</label>
                      <input
                        type="text"
                        value={meeting.title}
                        onChange={(e) => {
                          const updated = [...content.historicalMeetings];
                          updated[index].title = e.target.value;
                          setContent({ ...content, historicalMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Date et Lieu</label>
                      <input
                        type="text"
                        value={meeting.date}
                        onChange={(e) => {
                          const updated = [...content.historicalMeetings];
                          updated[index].date = e.target.value;
                          setContent({ ...content, historicalMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                        placeholder="Paris, 20 Mars 2024"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-300 mb-1">URL du compte-rendu (optionnel)</label>
                      <input
                        type="text"
                        value={meeting.reportUrl}
                        onChange={(e) => {
                          const updated = [...content.historicalMeetings];
                          updated[index].reportUrl = e.target.value;
                          setContent({ ...content, historicalMeetings: updated });
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                        placeholder="https://exemple.com/compte-rendu.pdf"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RencontresCMSPage;


