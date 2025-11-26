import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationListener,
  addNotificationResponseListener,
  getUnreadCount,
} from '../services/notifications';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  notifications: NotificationItem[];
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (user) {
      setupPushNotifications();
      refreshUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  async function setupPushNotifications() {
    if (!user) return;

    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(user.id, token);
    }
  }

  // Subscribe to real-time notification updates
  function subscribeToNotifications() {
    if (!user) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // New notification received
          const newNotification = payload.new as NotificationItem;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Set up notification listeners
  useEffect(() => {
    // When notification is received while app is foregrounded
    const notificationListener = addNotificationListener((notification) => {
      refreshUnreadCount();
    });

    // When user taps on notification
    const responseListener = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  function handleNotificationTap(data: any) {
    // Navigate based on notification type
    // This would need access to navigation - can be handled via a callback
    console.log('Notification tapped:', data);
  }

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        notifications,
        loadNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
