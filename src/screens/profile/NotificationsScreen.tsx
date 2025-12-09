import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../../services/notifications';
import { COLORS } from '../../constants/theme';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [ordersEnabled, setOrdersEnabled] = useState(true);
  const [offersEnabled, setOffersEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  async function loadNotifications() {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserNotifications(user.id);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  async function handleNotificationPress(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    // Navigate based on notification type
    if (notification.data?.orderId) {
      navigation.navigate('OrderDetail', { orderId: notification.data.orderId });
    } else if (notification.data?.conversationId) {
      navigation.navigate('Chat', { conversationId: notification.data.conversationId });
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'order':
        return 'bag-check-outline';
      case 'message':
        return 'chatbubble-outline';
      case 'offer':
        return 'pricetag-outline';
      case 'shipping':
        return 'car-outline';
      default:
        return 'notifications-outline';
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'order':
        return '#10B981';
      case 'message':
        return COLORS.primary;
      case 'offer':
        return '#F59E0B';
      case 'shipping':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 12,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="px-5 py-2 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white flex-1">Notificaciones</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View className="flex-row px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'history' ? 'border-primary' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('history')}
        >
          <Text
            className={`text-base ${
              activeTab === 'history' ? 'font-semibold text-primary' : 'font-normal text-gray-400'
            }`}
          >
            Historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'settings' ? 'border-primary' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('settings')}
        >
          <Text
            className={`text-base ${
              activeTab === 'settings' ? 'font-semibold text-primary' : 'font-normal text-gray-400'
            }`}
          >
            Preferencias
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        /* Historial de notificaciones */
        loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">Sin notificaciones</Text>
            <Text className="text-base text-gray-500 text-center mt-2">
              Cuando recibas notificaciones de pedidos, mensajes u ofertas, aparecerán aquí
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          >
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                className={`flex-row px-5 py-4 border-b border-gray-100 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${getNotificationColor(notification.type)}20` }}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type) as any}
                    size={20}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-base ${
                        !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      }`}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </Text>
                    <Text className="text-xs text-gray-400 ml-2">
                      {formatTime(notification.created_at)}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}
                    numberOfLines={2}
                  >
                    {notification.body}
                  </Text>
                </View>
                {!notification.read && (
                  <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-2" />
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        )
      ) : (
        /* Preferencias de notificaciones */
        <ScrollView className="flex-1">
          {/* Canales de notificación */}
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-400 mb-4">CANALES</Text>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Notificaciones Push</Text>
                  <Text className="text-sm text-gray-500">Alertas en tu dispositivo</Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Email</Text>
                  <Text className="text-sm text-gray-500">Recibir emails informativos</Text>
                </View>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Tipos de notificación */}
          <View className="px-5 py-4">
            <Text className="text-sm font-semibold text-gray-400 mb-4">TIPOS DE NOTIFICACIONES</Text>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="bag-check-outline" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Pedidos</Text>
                  <Text className="text-sm text-gray-500">Estado de tus compras</Text>
                </View>
              </View>
              <Switch
                value={ordersEnabled}
                onValueChange={setOrdersEnabled}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                  <Ionicons name="pricetag-outline" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Ofertas y Promociones</Text>
                  <Text className="text-sm text-gray-500">Descuentos especiales</Text>
                </View>
              </View>
              <Switch
                value={offersEnabled}
                onValueChange={setOffersEnabled}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Mensajes</Text>
                  <Text className="text-sm text-gray-500">Chat con vendedores</Text>
                </View>
              </View>
              <Switch
                value={messagesEnabled}
                onValueChange={setMessagesEnabled}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      )}
    </View>
  );
}
