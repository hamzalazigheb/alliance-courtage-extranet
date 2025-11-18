import React, { useState, useEffect } from 'react';
import { simulatorsAPI } from './api';

interface SimulatorUsage {
  id: number;
  user_id: number;
  simulator_type: string;
  parameters: any;
  result_summary: string;
  created_at: string;
  nom?: string;
  prenom?: string;
  email?: string;
}

interface SimulatorStats {
  by_type: Array<{
    simulator_type: string;
    total_uses: number;
    unique_users: number;
    first_use: string;
    last_use: string;
  }>;
  by_user: Array<{
    id: number;
    nom: string;
    prenom: string;
    email: string;
    total_uses: number;
    simulators_used: number;
    last_use: string;
  }>;
  global: {
    total_uses: number;
    total_users: number;
    total_simulators: number;
    first_use_ever: string;
    last_use_ever: string;
  };
  daily: Array<{
    date: string;
    uses: number;
    users: number;
  }>;
}

const SimulatorStatsPage: React.FC = () => {
  const [stats, setStats] = useState<SimulatorStats | null>(null);
  const [recentUsage, setRecentUsage] = useState<SimulatorUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    loadStats();
    loadRecentUsage();
  }, [selectedFilter, selectedUserId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await simulatorsAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentUsage = async () => {
    try {
      const filters: any = { limit: 50 };
      if (selectedFilter !== 'all') {
        filters.simulator_type = selectedFilter;
      }
      if (selectedUserId) {
        filters.user_id = parseInt(selectedUserId);
      }
      const data = await simulatorsAPI.getUsage(filters);
      setRecentUsage(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisations:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSimulatorName = (type: string) => {
    const names: Record<string, string> = {
      'ir': 'Impôt sur le Revenu',
      'ifi': 'Impôt sur la Fortune Immobilière',
      'succession': 'Diagnostic Succession',
      'placement': 'Simulateur Placement'
    };
    return names[type] || type;
  };

  const getSimulatorColor = (type: string) => {
    const colors: Record<string, string> = {
      'ir': 'bg-blue-100 text-blue-800 border-blue-200',
      'ifi': 'bg-purple-100 text-purple-800 border-purple-200',
      'succession': 'bg-green-100 text-green-800 border-green-200',
      'placement': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && !stats) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Statistiques des Simulateurs</h1>
        <p className="text-gray-600">Suivi de l'utilisation des simulateurs par les utilisateurs</p>
      </div>

      {/* Statistiques Globales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-sm text-blue-600 font-semibold mb-1">Total Utilisations</div>
            <div className="text-3xl font-bold text-blue-800">{stats.global.total_uses || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-sm text-green-600 font-semibold mb-1">Utilisateurs Uniques</div>
            <div className="text-3xl font-bold text-green-800">{stats.global.total_users || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-sm text-purple-600 font-semibold mb-1">Types de Simulateurs</div>
            <div className="text-3xl font-bold text-purple-800">{stats.global.total_simulators || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="text-sm text-orange-600 font-semibold mb-1">Dernière Utilisation</div>
            <div className="text-sm font-bold text-orange-800">
              {stats.global.last_use_ever ? formatDate(stats.global.last_use_ever) : 'Aucune'}
            </div>
          </div>
        </div>
      )}

      {/* Statistiques par Type */}
      {stats && stats.by_type.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Statistiques par Type de Simulateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.by_type.map((typeStat) => (
              <div
                key={typeStat.simulator_type}
                className={`p-4 rounded-lg border-2 ${getSimulatorColor(typeStat.simulator_type)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{getSimulatorName(typeStat.simulator_type)}</h3>
                  <span className="text-2xl font-bold">{typeStat.total_uses}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>👥 Utilisateurs uniques: <strong>{typeStat.unique_users}</strong></div>
                  <div>📅 Première utilisation: <strong>{formatDate(typeStat.first_use)}</strong></div>
                  <div>🕐 Dernière utilisation: <strong>{formatDate(typeStat.last_use)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs les Plus Actifs */}
      {stats && stats.by_user.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Utilisateurs les Plus Actifs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Utilisations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Simulateurs Utilisés</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dernière Utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.by_user.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{user.prenom} {user.nom}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600">{user.total_uses}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{user.simulators_used}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(user.last_use)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Graphique d'Utilisation par Jour */}
      {stats && stats.daily.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Utilisation par Jour (30 derniers jours)</h2>
          <div className="space-y-2">
            {stats.daily.slice(0, 30).map((day) => {
              const maxUses = Math.max(...stats.daily.map(d => d.uses), 1);
              const percentage = (day.uses / maxUses) * 100;
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-600 font-medium">
                    {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {day.uses > 0 && (
                        <span className="text-white text-xs font-bold">{day.uses}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-600 text-right">
                    {day.users} utilisateur{day.users > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres et Liste Détaillée */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📋 Utilisations Récentes</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les simulateurs</option>
              <option value="ir">Impôt sur le Revenu</option>
              <option value="ifi">Impôt sur la Fortune Immobilière</option>
              <option value="succession">Diagnostic Succession</option>
              <option value="placement">Simulateur Placement</option>
            </select>
            {stats && stats.by_user.length > 0 && (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les utilisateurs</option>
                {stats.by_user.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.prenom} {user.nom}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Simulateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentUsage.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Aucune utilisation trouvée
                  </td>
                </tr>
              ) : (
                recentUsage.map((usage) => (
                  <tr key={usage.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(usage.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {usage.prenom} {usage.nom}
                        </div>
                        <div className="text-sm text-gray-500">{usage.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSimulatorColor(usage.simulator_type)}`}>
                        {getSimulatorName(usage.simulator_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {usage.result_summary || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimulatorStatsPage;

