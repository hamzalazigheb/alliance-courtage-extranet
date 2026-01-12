import React, { useState, useEffect, useCallback } from 'react';
import { buildAPIURL, notificationsAPI } from './api.js';
import { UserIcon, PartnerIcon, ArchiveIcon, DocumentIcon } from './components/NavIcons';
import { useAlert } from './contexts/AlertContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';
import {
  TrendUpIcon, ActivityIcon, ClockIcon, RefreshIcon,
  AlertIcon, CheckIcon, InfoIcon, BellIcon, SendIcon, MailIcon
} from './components/dashboard/DashboardIcons';
import { SkeletonCard, SkeletonChart, SkeletonActivity } from './components/dashboard/SkeletonLoaders';

// Chart colors
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

interface MonthlyData {
  month: string;
  users: number;
  archives: number;
  documents: number;
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  partners: {
    total: number;
    coa: number;
    cif: number;
  };
  archives: {
    total: number;
    thisMonth: number;
  };
  documents: {
    total: number;
    thisMonth: number;
  };
  recentActivity: Array<{
    id: number;
    type: 'login' | 'upload' | 'user_created' | 'partner_created';
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  action?: {
    label: string;
    tab: string;
  };
  dismissible?: boolean;
}

interface DashboardPageProps {
  onNavigate?: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { showSuccess, showError, showWarning } = useAlert();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  // Notifications state
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationType, setNotificationType] = useState<'broadcast' | 'individual' | 'email'>('broadcast');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [usersList, setUsersList] = useState<Array<{id: number; nom: string; prenom: string; email: string}>>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Admin notifications (incoming)
  const [adminNotifications, setAdminNotifications] = useState<Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    loadMonthlyStats();
    loadUsersList();
    loadAdminNotifications();
    loadUnreadCount();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      loadAdminNotifications();
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotificationsDropdown && !target.closest('.notifications-dropdown-container')) {
        setShowNotificationsDropdown(false);
      }
    };
    
    if (showNotificationsDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotificationsDropdown]);

  // Load admin notifications
  const loadAdminNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll(false); // Get all notifications
      setAdminNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadAdminNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadAdminNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'password_reset': return '🔑';
      case 'formation': return '🎓';
      case 'reservation': return '📅';
      case 'user_created': return '👤';
      case 'archive': return '📁';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  // Load real monthly stats from backend
  const loadMonthlyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(buildAPIURL('/dashboard/monthly-stats'), {
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  };

  // Load users list for individual notifications
  const loadUsersList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(buildAPIURL('/users'), {
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || data || [];
        setUsersList(users.filter((u: any) => u.is_active));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Send broadcast notification
  const sendBroadcastNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showWarning('Veuillez remplir le titre et le message');
      return;
    }
    
    setSendingNotification(true);
    try {
      await notificationsAPI.broadcast(notifType, notifTitle, notifMessage);
      showSuccess(`Notification envoyée à tous les utilisateurs`);
      setNotifTitle('');
      setNotifMessage('');
      setShowNotificationPanel(false);
    } catch (error) {
      showError('Erreur lors de l\'envoi de la notification');
    } finally {
      setSendingNotification(false);
    }
  };

  // Send individual notification
  const sendIndividualNotification = async () => {
    if (!selectedUserId || !notifTitle.trim() || !notifMessage.trim()) {
      showWarning('Veuillez sélectionner un utilisateur et remplir tous les champs');
      return;
    }
    
    setSendingNotification(true);
    try {
      await notificationsAPI.send(selectedUserId, notifType, notifTitle, notifMessage);
      showSuccess('Notification envoyée à l\'utilisateur');
      setNotifTitle('');
      setNotifMessage('');
      setSelectedUserId(null);
      setShowNotificationPanel(false);
    } catch (error) {
      showError('Erreur lors de l\'envoi de la notification');
    } finally {
      setSendingNotification(false);
    }
  };

  // Send personalized email
  const sendPersonalizedEmail = async () => {
    if (!selectedUserId || !emailSubject.trim() || !emailContent.trim()) {
      showWarning('Veuillez sélectionner un utilisateur et remplir tous les champs');
      return;
    }
    
    setSendingNotification(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildAPIURL('/emails/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          userId: selectedUserId,
          subject: emailSubject,
          message: emailContent,
          template: 'default'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        showSuccess(`Email envoyé avec succès${data.sent ? ` à ${data.sent} utilisateur(s)` : ''}`);
        setEmailSubject('');
        setEmailContent('');
        setSelectedUserId(null);
        setShowNotificationPanel(false);
      } else {
        const err = await res.json();
        showError(err.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      showError('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingNotification(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all stats in parallel
      const [usersRes, partnersRes, archivesRes, docsRes] = await Promise.all([
        fetch(buildAPIURL('/users'), {
          headers: { 'x-auth-token': token }
        }),
        fetch(buildAPIURL('/partners'), {
          headers: { 'x-auth-token': token }
        }),
        fetch(buildAPIURL('/archives'), {
          headers: { 'x-auth-token': token }
        }),
        fetch(buildAPIURL('/financial-documents'), {
          headers: { 'x-auth-token': token }
        })
      ]);

      const [users, partnersData, archives, docs] = await Promise.all([
        usersRes.ok ? usersRes.json() : { users: [] },
        partnersRes.ok ? partnersRes.json() : { partners: [] },
        archivesRes.ok ? archivesRes.json() : [],
        docsRes.ok ? docsRes.json() : []
      ]);

      const usersList = users.users || users || [];
      const partnersList = partnersData.partners || partnersData || [];

      // Calculate stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const userStats = {
        total: usersList.length,
        active: usersList.filter((u: any) => u.is_active).length,
        inactive: usersList.filter((u: any) => !u.is_active).length,
        newThisMonth: usersList.filter((u: any) => {
          const createdAt = new Date(u.created_at);
          return createdAt >= firstDayOfMonth;
        }).length
      };

      const partnerStats = {
        total: partnersList.length,
        coa: partnersList.filter((p: any) => p.category === 'coa').length,
        cif: partnersList.filter((p: any) => p.category === 'cif').length
      };

      const archiveStats = {
        total: archives.length,
        thisMonth: archives.filter((a: any) => {
          const createdAt = new Date(a.created_at);
          return createdAt >= firstDayOfMonth;
        }).length
      };

      const docStats = {
        total: docs.length,
        thisMonth: docs.filter((d: any) => {
          const createdAt = new Date(d.created_at);
          return createdAt >= firstDayOfMonth;
        }).length
      };

      // Build recent activity from all sources
      const allActivity: Array<{
        id: number;
        type: 'upload' | 'user_created' | 'partner_created' | 'document';
        description: string;
        timestamp: string;
        user?: string;
      }> = [];

      // Add archives (uploads)
      archives.forEach((a: any) => {
        if (a.created_at) {
          allActivity.push({
            id: a.id,
            type: 'upload',
            description: `Archive "${a.title || 'Sans titre'}" uploadée`,
            timestamp: a.created_at,
            user: a.uploaded_by_name || 'Admin'
          });
        }
      });

      // Add users
      usersList.forEach((u: any) => {
        if (u.created_at) {
          allActivity.push({
            id: u.id,
            type: 'user_created',
            description: `Utilisateur "${u.prenom} ${u.nom}" créé`,
            timestamp: u.created_at,
            user: 'Admin'
          });
        }
      });

      // Add partners
      partnersList.forEach((p: any) => {
        if (p.created_at) {
          allActivity.push({
            id: p.id,
            type: 'partner_created',
            description: `Partenaire "${p.nom}" ajouté (${p.category?.toUpperCase() || 'N/A'})`,
            timestamp: p.created_at,
            user: 'Admin'
          });
        }
      });

      // Add financial documents
      docs.forEach((d: any) => {
        if (d.created_at) {
          allActivity.push({
            id: d.id,
            type: 'document',
            description: `Document "${d.title || 'Sans titre'}" uploadé`,
            timestamp: d.created_at,
            user: 'Admin'
          });
        }
      });

      // Sort by date (most recent first) and take top 10
      const recentActivity = allActivity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setStats({
        users: userStats,
        partners: partnerStats,
        archives: archiveStats,
        documents: docStats,
        recentActivity
      });

      // Generate alerts based on stats
      const newAlerts: Alert[] = [];

      // Alert: Inactive users
      if (userStats.inactive > 0) {
        newAlerts.push({
          id: 'inactive-users',
          type: 'warning',
          title: `${userStats.inactive} utilisateur${userStats.inactive > 1 ? 's' : ''} inactif${userStats.inactive > 1 ? 's' : ''}`,
          description: 'Des comptes utilisateurs sont désactivés et ne peuvent pas accéder à la plateforme.',
          action: { label: 'Gérer les utilisateurs', tab: 'utilisateurs' },
          dismissible: true
        });
      }

      // Alert: No new users this month
      if (userStats.newThisMonth === 0 && userStats.total > 0) {
        newAlerts.push({
          id: 'no-new-users',
          type: 'info',
          title: 'Aucun nouvel utilisateur ce mois-ci',
          description: 'Pensez à inviter de nouveaux partenaires sur la plateforme.',
          action: { label: 'Créer un utilisateur', tab: 'utilisateurs' },
          dismissible: true
        });
      }

      // Alert: Many new users (success)
      if (userStats.newThisMonth >= 5) {
        newAlerts.push({
          id: 'many-new-users',
          type: 'success',
          title: `${userStats.newThisMonth} nouveaux utilisateurs ce mois !`,
          description: 'Excellente croissance de votre plateforme.',
          dismissible: true
        });
      }

      // Alert: Low partner count
      if (partnerStats.total < 3) {
        newAlerts.push({
          id: 'low-partners',
          type: 'info',
          title: 'Peu de partenaires enregistrés',
          description: 'Ajoutez vos partenaires COA et CIF pour enrichir la plateforme.',
          action: { label: 'Ajouter un partenaire', tab: 'partenaires' },
          dismissible: true
        });
      }

      // Alert: No archives this month
      if (archiveStats.thisMonth === 0 && archiveStats.total > 0) {
        newAlerts.push({
          id: 'no-archives-month',
          type: 'info',
          title: 'Aucune archive uploadée ce mois-ci',
          description: 'N\'oubliez pas de mettre à jour les documents pour vos utilisateurs.',
          action: { label: 'Uploader une archive', tab: 'archives' },
          dismissible: true
        });
      }

      setAlerts(newAlerts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <ArchiveIcon className="w-5 h-5" />;
      case 'user_created': return <UserIcon className="w-5 h-5" />;
      case 'partner_created': return <PartnerIcon className="w-5 h-5" />;
      case 'document': return <DocumentIcon className="w-5 h-5" />;
      default: return <ActivityIcon className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-blue-100 text-blue-600';
      case 'user_created': return 'bg-green-100 text-green-600';
      case 'partner_created': return 'bg-purple-100 text-purple-600';
      case 'document': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-72 h-4 bg-white/20 rounded"></div>
          </div>
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <div className="lg:col-span-2">
            <SkeletonChart height="h-72" />
          </div>
        </div>

        {/* Skeleton Activity */}
        <SkeletonActivity />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Impossible de charger les statistiques</p>
      </div>
    );
  }

  // Helper to get alert styling
  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-800',
          descColor: 'text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700',
          icon: <AlertIcon className="w-5 h-5" />
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          descColor: 'text-red-600',
          btnBg: 'bg-red-600 hover:bg-red-700',
          icon: <AlertIcon className="w-5 h-5" />
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          descColor: 'text-green-600',
          btnBg: 'bg-green-600 hover:bg-green-700',
          icon: <CheckIcon className="w-5 h-5" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          descColor: 'text-blue-600',
          btnBg: 'bg-blue-600 hover:bg-blue-700',
          icon: <InfoIcon className="w-5 h-5" />
        };
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications Bell Icon */}
            <div className="notifications-dropdown-container relative" data-tour="notifications-bell">
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  if (!showNotificationsDropdown) {
                    loadAdminNotifications();
                  }
                }}
                className="relative p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                      <BellIcon className="w-5 h-5 text-blue-600" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount} non lues
                        </span>
                      )}
                    </h3>
                    {adminNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-100">
                    {adminNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      adminNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              !notif.is_read ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`font-semibold text-gray-800 ${!notif.is_read ? 'text-blue-800' : ''}`}>
                                  {notif.title}
                                </span>
                                {!notif.is_read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Send Notification Button */}
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors flex items-center space-x-2"
            >
              <SendIcon className="w-4 h-4" />
              <span>Envoyer</span>
            </button>
            <button
              onClick={loadDashboardStats}
              disabled={loading}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors flex items-center space-x-2"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <BellIcon className="w-6 h-6 text-blue-600" />
              <span>Centre de notifications</span>
            </h2>
            <button
              onClick={() => setShowNotificationPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Notification Type Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setNotificationType('broadcast')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                notificationType === 'broadcast' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BellIcon className="w-4 h-4" />
              <span>Tous les utilisateurs</span>
            </button>
            <button
              onClick={() => setNotificationType('individual')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                notificationType === 'individual' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Utilisateur spécifique</span>
            </button>
            <button
              onClick={() => setNotificationType('email')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                notificationType === 'email' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MailIcon className="w-4 h-4" />
              <span>Email personnalisé</span>
            </button>
          </div>

          {/* Broadcast Form */}
          {notificationType === 'broadcast' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>📢 Notification globale :</strong> Ce message sera envoyé à tous les utilisateurs actifs de la plateforme.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">ℹ️ Information</option>
                    <option value="success">✅ Succès</option>
                    <option value="warning">⚠️ Avertissement</option>
                    <option value="error">❌ Erreur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Titre de la notification"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Contenu de la notification..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={sendBroadcastNotification}
                disabled={sendingNotification}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <SendIcon className="w-5 h-5" />
                <span>{sendingNotification ? 'Envoi en cours...' : 'Envoyer à tous'}</span>
              </button>
            </div>
          )}

          {/* Individual Form */}
          {notificationType === 'individual' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-700">
                  <strong>👤 Notification individuelle :</strong> Ce message sera envoyé uniquement à l'utilisateur sélectionné.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un utilisateur</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {usersList.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="info">ℹ️ Information</option>
                    <option value="success">✅ Succès</option>
                    <option value="warning">⚠️ Avertissement</option>
                    <option value="error">❌ Erreur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Titre de la notification"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Contenu de la notification..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={sendIndividualNotification}
                disabled={sendingNotification || !selectedUserId}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <SendIcon className="w-5 h-5" />
                <span>{sendingNotification ? 'Envoi en cours...' : 'Envoyer'}</span>
              </button>
            </div>
          )}

          {/* Email Form */}
          {notificationType === 'email' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  <strong>📧 Email personnalisé :</strong> Envoyez un email professionnel à un utilisateur spécifique.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {usersList.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objet de l'email</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Objet de l'email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenu de l'email</label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Rédigez votre message..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={sendPersonalizedEmail}
                disabled={sendingNotification || !selectedUserId}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <MailIcon className="w-5 h-5" />
                <span>{sendingNotification ? 'Envoi en cours...' : 'Envoyer l\'email'}</span>
              </button>
            </div>
          )}
        </div>
      )}


      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="stats-cards">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center">
              <TrendUpIcon className="w-4 h-4 mr-1" />
              +{stats.users.newThisMonth} ce mois
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Utilisateurs</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.users.total}</p>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-green-600 font-medium">{stats.users.active} actifs</span>
            <span className="text-gray-400">•</span>
            <span className="text-red-600 font-medium">{stats.users.inactive} inactifs</span>
          </div>
        </div>

        {/* Partners Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <PartnerIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Partenaires</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.partners.total}</p>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-blue-600 font-medium">{stats.partners.coa} COA</span>
            <span className="text-gray-400">•</span>
            <span className="text-purple-600 font-medium">{stats.partners.cif} CIF</span>
          </div>
        </div>

        {/* Archives Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ArchiveIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center">
              <TrendUpIcon className="w-4 h-4 mr-1" />
              +{stats.archives.thisMonth} ce mois
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Archives</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.archives.total}</p>
          <div className="text-xs text-gray-500">
            Fichiers archivés
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DocumentIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center">
              <TrendUpIcon className="w-4 h-4 mr-1" />
              +{stats.documents.thisMonth} ce mois
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Documents Financiers</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.documents.total}</p>
          <div className="text-xs text-gray-500">
            Documents disponibles
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="charts">
        
        {/* Users Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des utilisateurs</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actifs', value: stats.users.active, color: '#10B981' },
                    { name: 'Inactifs', value: stats.users.inactive, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Utilisateurs']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partners by Category Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Partenaires par catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'COA', value: stats.partners.coa, fill: '#3B82F6' },
                  { name: 'CIF', value: stats.partners.cif, fill: '#8B5CF6' },
                  { name: 'Autres', value: stats.partners.total - stats.partners.coa - stats.partners.cif, fill: '#6B7280' }
                ]}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Partenaires']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {[
                    { name: 'COA', fill: '#3B82F6' },
                    { name: 'CIF', fill: '#8B5CF6' },
                    { name: 'Autres', fill: '#6B7280' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Activity Area Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité mensuelle (6 derniers mois)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorArchives" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  name="Utilisateurs"
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="archives" 
                  name="Archives"
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#colorArchives)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="documents" 
                  name="Documents"
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorDocs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Summary Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition du contenu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Utilisateurs', value: stats.users.total },
                    { name: 'Partenaires', value: stats.partners.total },
                    { name: 'Archives', value: stats.archives.total },
                    { name: 'Documents', value: stats.documents.total }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {COLORS.slice(0, 4).map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* This Month Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouts ce mois-ci</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Utilisateurs', value: stats.users.newThisMonth, fill: '#3B82F6' },
                  { name: 'Archives', value: stats.archives.thisMonth, fill: '#8B5CF6' },
                  { name: 'Documents', value: stats.documents.thisMonth, fill: '#10B981' }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Nouveaux']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#3B82F6" />
                  <Cell fill="#8B5CF6" />
                  <Cell fill="#10B981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour="activity-feed">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ActivityIcon className="w-6 h-6 mr-2 text-blue-600" />
            Activité récente
          </h2>
          <button
            onClick={loadDashboardStats}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'} duration-500`} />
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>

        {stats.recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {formatTimestamp(activity.timestamp)}
                    {activity.user && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Par {activity.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6" data-tour="quick-actions">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate?.('utilisateurs')}
            className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200 hover:shadow-md"
          >
            <UserIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Nouvel utilisateur</p>
          </button>
          <button
            onClick={() => onNavigate?.('partenaires')}
            className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200 hover:shadow-md"
          >
            <PartnerIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Nouveau partenaire</p>
          </button>
          <button
            onClick={() => onNavigate?.('archives')}
            className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200 hover:shadow-md"
          >
            <ArchiveIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Upload archive</p>
          </button>
          <button
            onClick={() => onNavigate?.('documents')}
            className="bg-white hover:bg-gray-50 rounded-lg p-4 text-center transition-colors border border-gray-200 hover:shadow-md"
          >
            <DocumentIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Upload document</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

