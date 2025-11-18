import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { notificationsAPI, Notification } from '../api/notifications';
import { theme } from '../utils/theme';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [allNotifications, count] = await Promise.all([
        notificationsAPI.getAll(true), // Unread only
        notificationsAPI.getUnreadCount(),
      ]);
      setNotifications(allNotifications.slice(0, 5)); // Show only 5 latest
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Bienvenue, {user?.prenom} {user?.nom}
          </Text>
          <Text style={styles.welcomeSubtext}>
            Votre espace Alliance Courtage
          </Text>
        </Card>

        {unreadCount > 0 && (
          <Card style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            </View>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
              >
                <Text style={styles.notificationMessage}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationDate}>
                  {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Card style={styles.quickAccessCard}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Text style={styles.quickAccessIcon}>📚</Text>
              <Text style={styles.quickAccessLabel}>Formations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Text style={styles.quickAccessIcon}>💼</Text>
              <Text style={styles.quickAccessLabel}>Produits</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Text style={styles.quickAccessIcon}>📊</Text>
              <Text style={styles.quickAccessLabel}>Comptabilité</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Text style={styles.quickAccessIcon}>🧮</Text>
              <Text style={styles.quickAccessLabel}>Simulateurs</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  welcomeCard: {
    backgroundColor: theme.colors.primaryDark,
    marginBottom: theme.spacing.md,
  },
  welcomeText: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtext: {
    ...theme.typography.body,
    color: '#E5E7EB',
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  notificationTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  notificationMessage: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  notificationDate: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  quickAccessCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quickAccessIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  quickAccessLabel: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: 'center',
  },
});




