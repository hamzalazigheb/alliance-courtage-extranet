/**
 * Template pour créer une nouvelle page frontend
 * 
 * Instructions:
 * 1. Copiez ce fichier vers src/pages/VotreFonctionnalitePage.tsx
 * 2. Remplacez "VotreFonctionnalite" par le nom de votre fonctionnalité
 * 3. Adaptez l'interface selon vos besoins
 * 4. Ajoutez la route dans src/App.tsx
 */

import { useState, useEffect } from 'react';
import { buildAPIURL } from '../api';

// Types pour votre fonctionnalité
interface VotreItem {
  id: number;
  title: string;
  description?: string;
  created_at: string;
}

const VotreFonctionnalitePage = () => {
  const [items, setItems] = useState<VotreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le formulaire (si création/édition)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Récupérer les données depuis l'API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Non authentifié');
        return;
      }

      const response = await fetch(buildAPIURL('/votre-fonctionnalite'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Erreur lors de la récupération:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouvel élément
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Non authentifié');
        return;
      }

      const response = await fetch(buildAPIURL('/votre-fonctionnalite'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      // Recharger les données
      await fetchData();
      setShowForm(false);
      setFormData({ title: '', description: '' });
      alert('Créé avec succès!');
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Supprimer un élément
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Non authentifié');
        return;
      }

      const response = await fetch(buildAPIURL(`/votre-fonctionnalite/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Recharger les données
      await fetchData();
      alert('Supprimé avec succès!');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Votre Fonctionnalité</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Nouvel élément</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description"
              />
            </div>
            <button
              onClick={handleCreate}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {/* Liste des éléments */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun élément trouvé
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-gray-600 mb-2">{item.description}</p>
                  )}
                  <p className="text-sm text-gray-400">
                    Créé le: {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VotreFonctionnalitePage;

