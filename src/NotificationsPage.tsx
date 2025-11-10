import React, { useState, useEffect } from 'react';
import { notificationsAPI, buildAPIURL } from './api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_id: number | null;
  related_type: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getAll(filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
      // Rafraîchir le compteur dans le header (via window.location.reload ou un événement personnalisé)
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
      // Rafraîchir le compteur dans le header
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'archive':
        return '📄';
      case 'product':
        return '📦';
      case 'meeting':
        return '🤝';
      case 'formation':
        return '🎓';
      case 'reservation':
      case 'reservation_public':
        return '💰';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'document':
      case 'archive':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'product':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'meeting':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'formation':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reservation':
      case 'reservation_public':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="p-6 sm:p-8 text-white bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Notifications</h1>
                  <p className="text-white/80">
                    Restez informé des dernières mises à jour
                  </p>
                </div>
                <div className="text-4xl">🔔</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Non lues ({notifications.filter(n => !n.is_read).length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({notifications.length})
              </button>
            </div>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-[#1D4ED8] mx-auto"></div>
            <p className="text-gray-600 mt-6 text-base font-medium">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔕</span>
            </div>
            <p className="text-gray-600 text-base font-medium">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (notification.link) {
                    // Si c'est un lien interne (commence par #), utiliser hash navigation
                    if (notification.link.startsWith('#')) {
                      window.location.hash = notification.link;
                    } else {
                      // Sinon, ouvrir le lien dans un nouvel onglet
                      window.open(notification.link, '_blank');
                    }
                    // Marquer comme lu si pas déjà lu
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }
                }}
                className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                  notification.is_read
                    ? 'border-gray-200 opacity-75'
                    : 'border-indigo-300 bg-indigo-50/50'
                } ${notification.link ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {notification.title}
                          {notification.link && (
                            <span className="ml-2 text-xs text-indigo-600">🔗</span>
                          )}
                        </h3>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(notification.created_at)}</span>
                          {notification.related_type && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {notification.related_type}
                            </span>
                          )}
                          {notification.link && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                              Cliquez pour ouvrir
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

