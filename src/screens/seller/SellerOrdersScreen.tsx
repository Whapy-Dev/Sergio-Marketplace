import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerOrders } from '../../services/orders';
import { COLORS } from '../../constants/theme';

const STATUS_INFO = {
  pending: { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado', color: 'text-blue-600', bg: 'bg-blue-100' },
  shipped: { label: 'Enviado', color: 'text-purple-600', bg: 'bg-purple-100' },
  delivered: { label: 'Entregado', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100' },
};

export default function SellerOrdersScreen({ navigation }: any) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    if (!user) return;

    setLoading(true);
    const data = await getSellerOrders(user.id);
    setOrders(data);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Pedidos</Text>
      </View>

      {/* Filtros */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-100 px-4 py-3"
      >
        <TouchableOpacity
          onPress={() => setFilter('all')}
          className={`mr-2 px-4 py-2 rounded-full ${filter === 'all' ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <Text className={`text-sm font-semibold ${filter === 'all' ? 'text-white' : 'text-gray-700'}`}>
            Todos ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('pending')}
          className={`mr-2 px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <Text className={`text-sm font-semibold ${filter === 'pending' ? 'text-white' : 'text-gray-700'}`}>
            Pendientes ({orders.filter(o => o.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('confirmed')}
          className={`mr-2 px-4 py-2 rounded-full ${filter === 'confirmed' ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <Text className={`text-sm font-semibold ${filter === 'confirmed' ? 'text-white' : 'text-gray-700'}`}>
            Confirmados ({orders.filter(o => o.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('shipped')}
          className={`mr-2 px-4 py-2 rounded-full ${filter === 'shipped' ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <Text className={`text-sm font-semibold ${filter === 'shipped' ? 'text-white' : 'text-gray-700'}`}>
            Enviados ({orders.filter(o => o.status === 'shipped').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'all' ? 'Sin pedidos' : `Sin pedidos ${STATUS_INFO[filter as keyof typeof STATUS_INFO]?.label.toLowerCase()}`}
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Los pedidos de tus productos aparecerán aquí
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_INFO[order.status as keyof typeof STATUS_INFO];
            const itemsCount = order.order_items?.length || 0;

            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => navigation.navigate('SellerOrderDetail', { orderId: order.id })}
                className="mx-4 my-2 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-1">
                      Pedido #{order.order_number}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${statusInfo.bg}`}>
                    <Text className={`text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View className="border-t border-gray-100 pt-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-gray-600">
                      Cliente: {order.profiles?.full_name || 'Sin nombre'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600">
                      {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                    </Text>
                    <Text className="text-lg font-bold text-primary">
                      ${order.total.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}