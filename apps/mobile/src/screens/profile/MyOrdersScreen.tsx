import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: any;
  order_items: any[];
}

export default function MyOrdersScreen({ navigation }: any) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  async function loadOrders() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadOrders();
  }

  function getStatusText(status: string) {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      shipped: 'Enviado',
      in_transit: 'En tránsito',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return statusMap[status] || status;
  }

  function getStatusColor(status: string) {
    const colorMap: { [key: string]: string } = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      preparing: '#8B5CF6',
      shipped: '#06B6D4',
      in_transit: '#06B6D4',
      delivered: '#10B981',
      cancelled: '#EF4444',
      refunded: '#EF4444',
    };
    return colorMap[status] || '#6B7280';
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getTotalItems(order: Order) {
    return order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Mis Compras</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            No hay compras aún
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Cuando realices una compra, aparecerá aquí
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="rounded-xl px-6 py-3"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-semibold">Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View className="px-4 py-4">
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                className="bg-white rounded-xl p-4 mb-4 border border-gray-200"
              >
                {/* Header de la orden */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      Orden #{order.order_number}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {formatDate(order.created_at)}
                    </Text>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                {/* Productos */}
                <View className="space-y-2 mb-3">
                  {order.order_items?.slice(0, 2).map((item: any, index: number) => (
                    <View key={index} className="flex-row items-center">
                      <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center mr-3 overflow-hidden">
                        {item.products?.image_url ? (
                          <Image
                            source={{ uri: item.products.image_url }}
                            className="w-12 h-12"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-xl">📦</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                          {item.products?.name || 'Producto'}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Cantidad: {item.quantity}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-gray-900">
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </Text>
                    </View>
                  ))}
                  {order.order_items && order.order_items.length > 2 && (
                    <Text className="text-xs text-gray-500 ml-15">
                      +{order.order_items.length - 2} producto(s) más
                    </Text>
                  )}
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                  <View>
                    <Text className="text-xs text-gray-500">Total</Text>
                    <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                      ${order.total.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 mr-1">
                      {getTotalItems(order)} {getTotalItems(order) === 1 ? 'artículo' : 'artículos'}
                    </Text>
                    <Text className="text-gray-400">→</Text>
                  </View>
                </View>

                {/* Banner para dejar reseña si está entregado */}
                {order.status === 'delivered' && (
                  <View className="mt-3 pt-3 border-t border-gray-200">
                    <View className="bg-blue-50 rounded-lg p-3 flex-row items-center">
                      <Text className="text-2xl mr-2">⭐</Text>
                      <Text className="text-xs font-semibold text-blue-900 flex-1">
                        ¡Deja tu opinión sobre estos productos!
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}