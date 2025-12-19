import React, { useState, useEffect } from 'react';
import { simulatorsAPI } from './api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';

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

// Premium Icons
const ChartIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

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

  const getSimulatorIcon = (type: string) => {
    const icons: Record<string, string> = {
      'ir': '💰',
      'ifi': '🏠',
      'succession': '📋',
      'placement': '📈'
    };
    return icons[type] || '📊';
  };

  // Skeleton Loader
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const pieChartData = stats?.by_type.map((item, index) => ({
    name: getSimulatorName(item.simulator_type),
    value: item.total_uses,
    color: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  const dailyChartData = stats?.daily.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    utilisations: item.uses,
    utilisateurs: item.users
  })) || [];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Statistiques des Simulateurs</h1>
              <p className="text-indigo-100 ml-15">
                Suivi et analyse de l'utilisation des simulateurs financiers
              </p>
            </div>
            <button
              onClick={() => { loadStats(); loadRecentUsage(); }}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
            >
              <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Uses */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ChartIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Total</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Utilisations Totales</p>
            <p className="text-4xl font-bold text-gray-900">{stats.global.total_uses || 0}</p>
          </div>

          {/* Unique Users */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UsersIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Actifs</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Utilisateurs Uniques</p>
            <p className="text-4xl font-bold text-gray-900">{stats.global.total_users || 0}</p>
          </div>

          {/* Simulator Types */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Types</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Simulateurs Disponibles</p>
            <p className="text-4xl font-bold text-gray-900">{stats.global.total_simulators || 0}</p>
          </div>

          {/* Last Usage */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Récent</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Dernière Utilisation</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.global.last_use_ever ? formatDate(stats.global.last_use_ever) : 'Aucune'}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Usage by Type */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Répartition par Simulateur</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Utilisations']}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Chart - Daily Usage */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Évolution sur 30 jours</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="colorUses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="utilisations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUses)" strokeWidth={2} />
                  <Area type="monotone" dataKey="utilisateurs" stroke="#10B981" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Stats by Type */}
      {stats && stats.by_type.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Détails par Simulateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.by_type.map((typeStat, index) => (
              <div
                key={typeStat.simulator_type}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">{getSimulatorName(typeStat.simulator_type)}</h4>
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                  >
                    {typeStat.total_uses}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Utilisateurs</p>
                    <p className="font-bold text-gray-900">{typeStat.unique_users}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Première</p>
                    <p className="font-medium text-gray-700 text-xs">{formatDate(typeStat.first_use).split(' ')[0]}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Dernière</p>
                    <p className="font-medium text-gray-700 text-xs">{formatDate(typeStat.last_use).split(' ')[0]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Users */}
      {stats && stats.by_user.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Utilisateurs les Plus Actifs</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rang</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisations</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Simulateurs</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dernière Activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.by_user.slice(0, 10).map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.prenom} {user.nom}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {user.total_uses}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-700">{user.simulators_used} types</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(user.last_use)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Usage */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Historique des Utilisations</h3>
          <div className="flex items-center space-x-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tous les simulateurs</option>
              <option value="ir">Impôt sur le Revenu</option>
              <option value="ifi">IFI</option>
              <option value="succession">Succession</option>
              <option value="placement">Placement</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Simulateur</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsage.slice(0, 20).map((usage) => (
                <tr key={usage.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDate(usage.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {usage.prenom?.[0]}{usage.nom?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{usage.prenom} {usage.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                      {getSimulatorName(usage.simulator_type)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {usage.result_summary || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentUsage.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Aucune utilisation enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulatorStatsPage;
