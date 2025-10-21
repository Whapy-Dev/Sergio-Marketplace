import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
  items_count: number;
}

const STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado', color: 'text-blue-600', bg: 'bg-blue-100' },
  delivered: { label: 'Entregado', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100' },
};

export default function MyOrdersScreen({ navigation }: any) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        return;
      }

      // Formatear datos
      const formattedOrders = await Promise.all(
        (data || []).map(async (order: any) => {
          // Contar items de la orden
          const { count } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);

          return {
            id: order.id,
            order_number: order.order_number,
            total: order.total,
            status: order.status,
            created_at: order.created_at,
            items_count: count || 0,
          };
        })
      );

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
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
          <Text className="text-xl font-bold text-gray-900 mb-2">No hay compras</Text>
          <Text className="text-base text-gray-600 text-center">
            Todavía no realizaste ninguna compra
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status];
            
            return (
              <TouchableOpacity
                key={order.id}
                className="mx-4 my-2 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <View className="flex-row justify-between items-start mb-2">
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

                <View className="border-t border-gray-100 pt-2 mt-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600">
                      {order.items_count} {order.items_count === 1 ? 'producto' : 'productos'}
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