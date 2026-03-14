import React, { useState, useEffect } from 'react';
import { buildAPIURL } from './api';

interface MeetingFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

type EventType = 'reunion' | 'seminaire' | 'event' | 'formation' | 'assemblee' | 'conference' | 'webinaire' | 'atelier' | 'autre';

interface UpcomingMeeting {
  title: string;
  date: string;
  expirationDate?: string;
  description: string;
  location: string;
  time: string;
  color: string;
  eventType?: EventType;
  files?: MeetingFile[];
}

interface HistoricalMeeting {
  title: string;
  date: string;
  reportUrl: string;
  eventType?: EventType;
  files?: MeetingFile[];
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [expandedMeetings, setExpandedMeetings] = useState<Record<string, boolean>>({});

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
            
            const upcoming: UpcomingMeeting[] = Array.isArray(parsedContent.upcomingMeetings) ? parsedContent.upcomingMeetings : [];
            const historical: HistoricalMeeting[] = Array.isArray(parsedContent.historicalMeetings) ? parsedContent.historicalMeetings : [];

            const today = new Date().toISOString().split('T')[0];
            const stillUpcoming: UpcomingMeeting[] = [];
            const migrated: HistoricalMeeting[] = [];

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

            const newContent: RencontresContent = {
              title: parsedContent.title || 'RENCONTRES',
              subtitle: parsedContent.subtitle || 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
              headerImage: parsedContent.headerImage || '',
              introText: parsedContent.introText || '',
              upcomingMeetings: stillUpcoming,
              historicalMeetings: [...migrated, ...historical]
            };

            setContent(newContent);

            if (migrated.length > 0) {
              console.log(`📦 ${migrated.length} événement(s) expiré(s) migré(s) vers l'historique`);
              const tk = localStorage.getItem('token');
              fetch(buildAPIURL('/cms/rencontres'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': tk || '' },
                body: JSON.stringify({ content: JSON.stringify(newContent) })
              }).catch(err => console.error('Erreur auto-migration:', err));
            }
          } catch (parseError) {
            console.error('Error parsing CMS content:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContentSilent = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/cms/rencontres'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ content: JSON.stringify(content) })
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const saveContent = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const ok = await saveContentSilent();
      if (ok) {
        setSuccessMessage('Contenu sauvegardé avec succès!');
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

  const handleFileUpload = async (meetingType: 'upcoming' | 'historical', meetingIndex: number, files: File[]) => {
    const key = `${meetingType}_${meetingIndex}`;
    setUploadingFiles(prev => ({ ...prev, [key]: true }));
    
    try {
      const saved = await saveContentSilent();
      if (!saved) {
        alert('Erreur: impossible de sauvegarder le contenu avant l\'upload. Veuillez réessayer.');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      for (const file of files) {
        formData.append('files', file);
      }
      
      const response = await fetch(buildAPIURL(`/cms/rencontres/files/${meetingType}/${meetingIndex}`), {
        method: 'POST',
        headers: { 'x-auth-token': token || '' },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        await loadContent();
        setSuccessMessage(`${data.files.length} fichier(s) uploadé(s) avec succès`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload fichiers:', error);
      alert('Erreur lors de l\'upload des fichiers');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFileDelete = async (meetingType: 'upcoming' | 'historical', meetingIndex: number, fileId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    
    try {
      await saveContentSilent();

      const token = localStorage.getItem('token');
      const response = await fetch(
        buildAPIURL(`/cms/rencontres/files/${meetingType}/${meetingIndex}/${fileId}`),
        {
          method: 'DELETE',
          headers: { 'x-auth-token': token || '' }
        }
      );
      
      if (response.ok) {
        await loadContent();
        setSuccessMessage('Fichier supprimé avec succès');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      alert('Erreur lors de la suppression du fichier');
    }
  };

  const toggleMeeting = (key: string) => {
    setExpandedMeetings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileMeta = (type: string): { color: string; label: string; dot: string } => {
    if (type?.includes('pdf'))        return { color: 'text-red-300',    label: 'PDF',     dot: 'bg-red-400' };
    if (type?.includes('word') || type?.includes('doc'))
                                       return { color: 'text-blue-300',   label: 'Word',    dot: 'bg-blue-400' };
    if (type?.includes('excel') || type?.includes('sheet') || type?.includes('xls'))
                                       return { color: 'text-green-300',  label: 'Excel',   dot: 'bg-green-400' };
    if (type?.includes('powerpoint') || type?.includes('presentation') || type?.includes('ppt'))
                                       return { color: 'text-orange-300', label: 'PPT',     dot: 'bg-orange-400' };
    if (type?.includes('image'))       return { color: 'text-purple-300', label: 'Image',   dot: 'bg-purple-400' };
    if (type?.includes('zip') || type?.includes('rar'))
                                       return { color: 'text-amber-300',  label: 'Archive', dot: 'bg-amber-400' };
    return                               { color: 'text-slate-300',  label: 'Fichier', dot: 'bg-slate-400' };
  };

  const addUpcomingMeeting = () => {
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);
    const newMeeting = {
      title: 'Nouvel Événement',
      date: new Date().toLocaleDateString('fr-FR'),
      expirationDate: defaultExpiration.toISOString().split('T')[0],
      description: '',
      location: '',
      time: '',
      color: 'indigo',
      eventType: 'event' as EventType,
      files: []
    };
    setContent({
      ...content,
      upcomingMeetings: [newMeeting, ...content.upcomingMeetings]
    });
    setExpandedMeetings(prev => ({ ...prev, ['upcoming_0']: true }));
  };

  const removeUpcomingMeeting = (index: number) => {
    if (!confirm('Supprimer cet événement et tous ses fichiers ?')) return;
    setContent({
      ...content,
      upcomingMeetings: content.upcomingMeetings.filter((_, i) => i !== index)
    });
  };

  const moveUpcomingMeeting = (index: number, direction: 'up' | 'down') => {
    const updated = [...content.upcomingMeetings];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= updated.length) return;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setContent({ ...content, upcomingMeetings: updated });
  };

  const addHistoricalMeeting = () => {
    const newMeeting = {
      title: 'Événement passé',
      date: '',
      reportUrl: '',
      eventType: 'event' as EventType,
      files: []
    };
    setContent({
      ...content,
      historicalMeetings: [newMeeting, ...content.historicalMeetings]
    });
    setExpandedMeetings(prev => ({ ...prev, ['historical_0']: true }));
  };

  const removeHistoricalMeeting = (index: number) => {
    if (!confirm('Supprimer cet événement et tous ses fichiers ?')) return;
    setContent({
      ...content,
      historicalMeetings: content.historicalMeetings.filter((_, i) => i !== index)
    });
  };

  const moveHistoricalMeeting = (index: number, direction: 'up' | 'down') => {
    const updated = [...content.historicalMeetings];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= updated.length) return;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setContent({ ...content, historicalMeetings: updated });
  };

  const eventTypeOptions: { value: EventType; label: string; icon: string }[] = [
    { value: 'reunion', label: 'Réunion', icon: '🤝' },
    { value: 'seminaire', label: 'Séminaire', icon: '🎓' },
    { value: 'event', label: 'Événement', icon: '🎉' },
    { value: 'formation', label: 'Formation', icon: '📖' },
    { value: 'assemblee', label: 'Assemblée Générale', icon: '🏛️' },
    { value: 'conference', label: 'Conférence', icon: '🎤' },
    { value: 'webinaire', label: 'Webinaire', icon: '💻' },
    { value: 'atelier', label: 'Atelier', icon: '🛠️' },
    { value: 'autre', label: 'Autre', icon: '📌' }
  ];

  const getEventTypeLabel = (type?: EventType) => {
    const found = eventTypeOptions.find(o => o.value === type);
    return found ? `${found.icon} ${found.label}` : '📌 Autre';
  };

  const colorOptions = [
    { value: 'indigo',  label: 'Indigo',   bg: 'bg-indigo-500',  hex: '#6366f1' },
    { value: 'purple',  label: 'Violet',   bg: 'bg-purple-500',  hex: '#a855f7' },
    { value: 'pink',    label: 'Rose',     bg: 'bg-pink-500',    hex: '#ec4899' },
    { value: 'red',     label: 'Rouge',    bg: 'bg-red-500',     hex: '#ef4444' },
    { value: 'orange',  label: 'Orange',   bg: 'bg-orange-500',  hex: '#f97316' },
    { value: 'yellow',  label: 'Jaune',    bg: 'bg-yellow-500',  hex: '#eab308' },
    { value: 'green',   label: 'Vert',     bg: 'bg-green-500',   hex: '#22c55e' },
    { value: 'teal',    label: 'Teal',     bg: 'bg-teal-500',    hex: '#14b8a6' },
    { value: 'blue',    label: 'Bleu',     bg: 'bg-blue-500',    hex: '#3b82f6' },
    { value: 'cyan',    label: 'Cyan',     bg: 'bg-cyan-500',    hex: '#06b6d4' },
    { value: 'sky',     label: 'Ciel',     bg: 'bg-sky-500',     hex: '#0ea5e9' },
    { value: 'lime',    label: 'Lime',     bg: 'bg-lime-500',    hex: '#84cc16' },
    { value: 'amber',   label: 'Ambre',    bg: 'bg-amber-500',   hex: '#f59e0b' },
    { value: 'rose',    label: 'Corail',   bg: 'bg-rose-500',    hex: '#f43f5e' },
    { value: 'fuchsia', label: 'Fuchsia',  bg: 'bg-fuchsia-500', hex: '#d946ef' },
    { value: 'violet',  label: 'Violet f.', bg: 'bg-violet-500', hex: '#8b5cf6' },
  ];

  const ColorPicker = ({
    value,
    onChange
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <div>
      <div className="flex flex-wrap gap-2 mt-1">
        {colorOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.value)}
            className={`w-7 h-7 rounded-full transition-all focus:outline-none ${opt.bg} ${
              value === opt.value
                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-700 scale-110'
                : 'opacity-70 hover:opacity-100 hover:scale-110'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1 capitalize">
        Sélectionné : {colorOptions.find(c => c.value === value)?.label || value}
      </p>
    </div>
  );

  const renderFileManager = (meetingType: 'upcoming' | 'historical', meetingIndex: number, files: MeetingFile[] = []) => {
    const uploadKey = `${meetingType}_${meetingIndex}`;
    const isUploading = uploadingFiles[uploadKey];
    const canUpload = !isUploading && files.length < 20;

    return (
      <div className="mt-4 pt-4 border-t border-slate-600/60">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Documents joints
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${files.length >= 20 ? 'bg-red-500/20 text-red-300' : 'bg-slate-600 text-slate-300'}`}>
              {files.length}/20
            </span>
          </div>

          {/* Upload button */}
          <label className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all select-none ${
            canUpload
              ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}>
            {isUploading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Envoi en cours…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Ajouter des fichiers
              </>
            )}
            <input
              type="file"
              multiple
              className="hidden"
              disabled={!canUpload}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const snapshot = Array.from(e.target.files);
                  e.target.value = '';
                  handleFileUpload(meetingType, meetingIndex, snapshot);
                }
              }}
            />
          </label>
        </div>

        {/* Empty state */}
        {files.length === 0 ? (
          <label className={`flex flex-col items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all ${!canUpload ? 'opacity-50 pointer-events-none' : ''}`}>
            <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.845 11.08" />
            </svg>
            <p className="text-xs text-slate-400">Glissez vos fichiers ici ou <span className="text-indigo-400 font-medium">parcourez</span></p>
            <input type="file" multiple className="hidden" disabled={!canUpload}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const snapshot = Array.from(e.target.files);
                  e.target.value = '';
                  handleFileUpload(meetingType, meetingIndex, snapshot);
                }
              }}
            />
          </label>
        ) : (
          /* File list */
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {files.map((file) => {
              const meta = getFileMeta(file.fileType);
              return (
                <div key={file.id} className="group flex items-center gap-3 px-3 py-2.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl border border-slate-600/40 hover:border-slate-500 transition-all">
                  {/* Color dot + label */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  </div>

                  {/* Filename */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-100 truncate">{file.originalName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatFileSize(file.fileSize)}</p>
                  </div>

                  {/* Actions — shown on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Download */}
                    <button
                      title="Télécharger"
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        fetch(buildAPIURL(`/cms/rencontres/files/download/${file.fileName}`), {
                          headers: { 'x-auth-token': token || '' }
                        })
                          .then(r => r.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.originalName;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          })
                          .catch(() => alert('Erreur téléchargement'));
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-indigo-500 text-slate-300 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      title="Supprimer"
                      onClick={() => handleFileDelete(meetingType, meetingIndex, file.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-red-500 text-slate-300 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
          <h2 className="text-xl font-bold text-white">Gestion du Contenu - Événements</h2>
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
            ✅ {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Header Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Image d'en-tête</label>
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
                      headers: { 'x-auth-token': token || '' },
                      body: formData
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setContent({ ...content, headerImage: data.imageUrl });
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Erreur lors de l\'upload');
                    }
                  } catch (error) {
                    alert('Erreur lors de l\'upload de l\'image');
                  } finally {
                    setUploadingImage(false);
                  }
                }}
                className="flex-1 text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
              />
              {uploadingImage && <span className="text-slate-300 text-sm">Upload...</span>}
              {content.headerImage && (
                <button
                  onClick={() => setContent({ ...content, headerImage: '' })}
                  className="px-3 py-2 bg-red-500/70 hover:bg-red-500 text-white rounded-lg text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
            {content.headerImage && (
              <img src={content.headerImage} alt="Preview" className="mt-2 max-w-xs h-24 object-cover rounded-lg border border-slate-600" />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Texte d'introduction</label>
            <textarea
              value={content.introText}
              onChange={(e) => setContent({ ...content, introText: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500"
              placeholder="Texte d'introduction..."
            />
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-slate-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                📅 Prochains Événements
                <span className="ml-2 text-sm font-normal text-slate-400">({content.upcomingMeetings.length})</span>
              </h3>
              <button
                onClick={addUpcomingMeeting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm"
              >
                + Ajouter un événement
              </button>
            </div>

            <div className="space-y-3">
              {content.upcomingMeetings.map((meeting, index) => {
                const key = `upcoming_${index}`;
                const isExpanded = expandedMeetings[key];
                const fileCount = meeting.files?.length || 0;
                
                return (
                  <div key={index} className="bg-slate-600/40 rounded-lg overflow-hidden">
                    {/* Meeting Header (always visible) */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-600/60 transition-colors"
                      onClick={() => toggleMeeting(key)}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorOptions.find(c => c.value === meeting.color)?.bg || 'bg-indigo-500'}`}></div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-semibold truncate">{meeting.title || 'Sans titre'}</h4>
                            <span className="text-xs bg-slate-500/60 text-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                              {getEventTypeLabel(meeting.eventType)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {meeting.date && <span>{meeting.date}</span>}
                            {meeting.location && <span> • {meeting.location}</span>}
                            {fileCount > 0 && <span> • 📎 {fileCount} fichier(s)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveUpcomingMeeting(index, 'up'); }}
                          disabled={index === 0}
                          className="px-2 py-1 bg-slate-500 hover:bg-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                          title="Monter"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveUpcomingMeeting(index, 'down'); }}
                          disabled={index === content.upcomingMeetings.length - 1}
                          className="px-2 py-1 bg-slate-500 hover:bg-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                          title="Descendre"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeUpcomingMeeting(index); }}
                          className="px-3 py-1 bg-red-500/70 hover:bg-red-500 text-white rounded text-xs"
                        >
                          Supprimer
                        </button>
                        <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Meeting Details (expandable) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-500/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Titre</label>
                            <input
                              type="text"
                              value={meeting.title}
                              onChange={(e) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], title: e.target.value };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Type d'événement</label>
                            <select
                              value={meeting.eventType || 'event'}
                              onChange={(e) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], eventType: e.target.value as EventType };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            >
                              {eventTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Date</label>
                            <input
                              type="text"
                              value={meeting.date}
                              onChange={(e) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], date: e.target.value };
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
                                updated[index] = { ...updated[index], location: e.target.value };
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
                                updated[index] = { ...updated[index], time: e.target.value };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                              placeholder="14h00 - 18h00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">
                              Date d'expiration
                              <span className="text-slate-500 ml-1">(migration auto vers historique)</span>
                            </label>
                            <input
                              type="date"
                              value={meeting.expirationDate || ''}
                              onChange={(e) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], expirationDate: e.target.value };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            />
                            {meeting.expirationDate && new Date(meeting.expirationDate) < new Date(new Date().toISOString().split('T')[0]) && (
                              <p className="text-xs text-amber-400 mt-1">⚠️ Expiré — sera migré vers l'historique à la prochaine sauvegarde</p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-slate-300 mb-1">Description</label>
                            <textarea
                              value={meeting.description}
                              onChange={(e) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], description: e.target.value };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                              rows={2}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-slate-300 mb-1">Couleur de la carte</label>
                            <ColorPicker
                              value={meeting.color || 'indigo'}
                              onChange={(val) => {
                                const updated = [...content.upcomingMeetings];
                                updated[index] = { ...updated[index], color: val };
                                setContent({ ...content, upcomingMeetings: updated });
                              }}
                            />
                          </div>
                        </div>

                        {/* File Manager */}
                        {renderFileManager('upcoming', index, meeting.files)}
                      </div>
                    )}
                  </div>
                );
              })}
              {content.upcomingMeetings.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Aucun événement. Cliquez sur "+ Ajouter un événement".</p>
              )}
            </div>
          </div>

          {/* Historical Meetings */}
          <div className="bg-slate-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                📚 Historique des Événements
                <span className="ml-2 text-sm font-normal text-slate-400">({content.historicalMeetings.length})</span>
              </h3>
              <button
                onClick={addHistoricalMeeting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm"
              >
                + Ajouter à l'historique
              </button>
            </div>

            <div className="space-y-3">
              {content.historicalMeetings.map((meeting, index) => {
                const key = `historical_${index}`;
                const isExpanded = expandedMeetings[key];
                const fileCount = meeting.files?.length || 0;
                
                return (
                  <div key={index} className="bg-slate-600/40 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-600/60 transition-colors"
                      onClick={() => toggleMeeting(key)}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-3 h-3 rounded-full flex-shrink-0 bg-green-500"></div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-semibold truncate">{meeting.title || 'Sans titre'}</h4>
                            <span className="text-xs bg-slate-500/60 text-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                              {getEventTypeLabel(meeting.eventType)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {meeting.date && <span>{meeting.date}</span>}
                            {fileCount > 0 && <span> • 📎 {fileCount} fichier(s)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveHistoricalMeeting(index, 'up'); }}
                          disabled={index === 0}
                          className="px-2 py-1 bg-slate-500 hover:bg-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                          title="Monter"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveHistoricalMeeting(index, 'down'); }}
                          disabled={index === content.historicalMeetings.length - 1}
                          className="px-2 py-1 bg-slate-500 hover:bg-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                          title="Descendre"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeHistoricalMeeting(index); }}
                          className="px-3 py-1 bg-red-500/70 hover:bg-red-500 text-white rounded text-xs"
                        >
                          Supprimer
                        </button>
                        <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-500/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Titre</label>
                            <input
                              type="text"
                              value={meeting.title}
                              onChange={(e) => {
                                const updated = [...content.historicalMeetings];
                                updated[index] = { ...updated[index], title: e.target.value };
                                setContent({ ...content, historicalMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Type d'événement</label>
                            <select
                              value={meeting.eventType || 'event'}
                              onChange={(e) => {
                                const updated = [...content.historicalMeetings];
                                updated[index] = { ...updated[index], eventType: e.target.value as EventType };
                                setContent({ ...content, historicalMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                            >
                              {eventTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-300 mb-1">Date et Lieu</label>
                            <input
                              type="text"
                              value={meeting.date}
                              onChange={(e) => {
                                const updated = [...content.historicalMeetings];
                                updated[index] = { ...updated[index], date: e.target.value };
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
                                updated[index] = { ...updated[index], reportUrl: e.target.value };
                                setContent({ ...content, historicalMeetings: updated });
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 text-sm"
                              placeholder="https://exemple.com/compte-rendu.pdf"
                            />
                          </div>
                        </div>

                        {/* File Manager */}
                        {renderFileManager('historical', index, meeting.files)}
                      </div>
                    )}
                  </div>
                );
              })}
              {content.historicalMeetings.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Aucun événement passé. Cliquez sur "+ Ajouter à l'historique".</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RencontresCMSPage;
