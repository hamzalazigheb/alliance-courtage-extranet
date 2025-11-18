import { apiRequest } from './config';

export interface Notification {
  id: number;
  user_id?: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'reservation' | 'reservation_public';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsAPI = {
  getAll: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const params = unreadOnly ? '?unread_only=true' : '';
    return apiRequest(`/notifications${params}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiRequest('/notifications/unread-count');
    return response.count || 0;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
};




