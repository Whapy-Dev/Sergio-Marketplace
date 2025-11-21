/**
 * Custom hook for push notifications
 */

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationListener,
  addNotificationResponseListener,
  getUnreadCount,
} from '../services/notifications';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for notifications when user logs in
    if (user) {
      registerForPushNotifications().then(async (token) => {
        if (token) {
          setExpoPushToken(token);
          await savePushToken(user.id, token);
        }
      });

      // Load unread count
      getUnreadCount(user.id).then(setUnreadCount);
    }

    // Listen for incoming notifications
    notificationListener.current = addNotificationListener((notification) => {
      setNotification(notification);
      // Update unread count
      if (user) {
        getUnreadCount(user.id).then(setUnreadCount);
      }
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      // Handle navigation based on notification data
      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  const handleNotificationNavigation = (data: any) => {
    // Handle different notification types
    // This should navigate to the appropriate screen
    // Example:
    // if (data.type === 'order') {
    //   navigation.navigate('OrderDetail', { orderId: data.orderId });
    // }
    console.log('Notification tapped with data:', data);
  };

  const refreshUnreadCount = async () => {
    if (user) {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    }
  };

  return {
    expoPushToken,
    notification,
    unreadCount,
    refreshUnreadCount,
  };
}

export default useNotifications;
