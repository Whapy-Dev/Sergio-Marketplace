/**
 * Push Notifications Service
 * Handles Expo push notifications registration and sending
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  device_name?: string;
  is_active: boolean;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Register for push notifications and get token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if physical device
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '72af8675-7bdc-48f3-8297-e1f420a656de', // From app.json
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to database
 */
export async function savePushToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const platform = Platform.OS;
    const deviceName = Device.modelName || Device.deviceName;

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          device_name: deviceName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

/**
 * Remove push token from database
 */
export async function removePushToken(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
}

/**
 * Deactivate all tokens for a user (on logout)
 */
export async function deactivateUserTokens(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deactivating tokens:', error);
    return false;
  }
}

/**
 * Send push notification via Expo's push service
 * This should ideally be called from a backend/cloud function
 */
export async function sendPushNotification(
  expoPushToken: string,
  notification: NotificationData
): Promise<boolean> {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Push notification error:', result.data.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send notification to user by userId
 */
export async function sendNotificationToUser(
  userId: string,
  notification: NotificationData
): Promise<boolean> {
  try {
    // Get user's active tokens
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      console.warn('No active tokens for user:', userId);
      return false;
    }

    // Send to all user's devices
    const results = await Promise.all(
      tokens.map((t) => sendPushNotification(t.token, notification))
    );

    // Save to notification history
    await supabase.from('notification_history').insert({
      user_id: userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      status: results.some((r) => r) ? 'sent' : 'failed',
    });

    return results.some((r) => r);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return false;
  }
}

/**
 * Get user's notification history
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_history')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Add notification listener
 */
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule local notification
 */
export async function scheduleLocalNotification(
  notification: NotificationData,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
    trigger,
  });

  return id;
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Get notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}
