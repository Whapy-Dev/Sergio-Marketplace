import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrderById, cancelOrder } from '../../services/orders';
import { COLORS } from '../../constants/theme';

const STATUS_INFO = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-100',
    icon: '⏳'
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    icon: '✓'
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    icon: '🚚'
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-600', 
    bg: 'bg-green-100',
    icon: '✓✓'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    icon: '✗'
  },
};

const PAYMENT_METHODS = {
  cash: '💵 Efectivo',
  transfer: '🏦 Transferencia',
  mercadopago: '💙 Mercado Pago',
};

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    setLoading(true);
    const data = await getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  }

  async function handleCancelOrder() {
    Alert.alert(
      'Cancelar Pedido',
      '¿Estás seguro que deseas cancelar este pedido? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const result = await cancelOrder(orderId);
            
            if (result.success) {
              Alert.alert('Pedido Cancelado', 'El pedido fue cancelado exitosamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Error', result.error || 'No se pudo cancelar el pedido');
            }
            setCancelling(false);
          },
        },
      ]
    );
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-primary text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Detalle del Pedido</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-600">No se encontró el pedido</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_INFO[order.status as keyof typeof STATUS_INFO];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">Pedido #{order.order_number}</Text>
          <Text className="text-sm text-gray-600">{formatDate(order.created_at)}</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Estado */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-900">Estado del Pedido</Text>
            <View className={`px-3 py-1 rounded-full ${statusInfo.bg} flex-row items-center`}>
              <Text className="text-base mr-1">{statusInfo.icon}</Text>
              <Text className={`text-sm font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row items-center mb-2">
              <View className={`w-3 h-3 rounded-full mr-3 ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary' : 'bg-gray-300'}`} />
              <Text className="text-sm text-gray-700">Pedido recibido</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <View className={`w-3 h-3 rounded-full mr-3 ${order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary' : 'bg-gray-300'}`} />
              <Text className="text-sm text-gray-700">Pedido confirmado</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <View className={`w-3 h-3 rounded-full mr-3 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary' : 'bg-gray-300'}`} />
              <Text className="text-sm text-gray-700">En camino</Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-3 ${order.status === 'delivered' ? 'bg-primary' : 'bg-gray-300'}`} />
              <Text className="text-sm text-gray-700">Entregado</Text>
            </View>
          </View>
        </View>

        {/* Productos */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">Productos</Text>
          {order.order_items.map((item: any) => (
            <View key={item.id} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base text-gray-900 mb-1" numberOfLines={2}>
                  {item.product_name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Cantidad: {item.quantity} • ${item.unit_price.toLocaleString()} c/u
                </Text>
              </View>
              <Text className="text-base font-bold text-gray-900 ml-2">
                ${item.subtotal.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Método de pago */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">Método de Pago</Text>
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-base text-gray-900">
              {PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS]}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Estado: {order.payment_status === 'paid' ? '✓ Pagado' : '⏳ Pendiente'}
            </Text>
          </View>
        </View>

        {/* Notas del comprador */}
        {order.buyer_notes && (
          <View className="px-4 py-4 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">📝 Notas</Text>
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="text-sm text-gray-700">{order.buyer_notes}</Text>
            </View>
          </View>
        )}

        {/* Resumen */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Resumen</Text>
          <View className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-700">Subtotal</Text>
              <Text className="text-sm text-gray-900">${order.subtotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-700">Envío</Text>
              <Text className="text-sm text-green-600">
                {order.shipping_total === 0 ? 'Gratis 🎉' : `$${order.shipping_total.toLocaleString()}`}
              </Text>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
              <Text className="text-base font-bold text-gray-900">Total</Text>
              <Text className="text-xl font-bold text-primary">${order.total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Botón cancelar */}
        {order.status === 'pending' && (
          <View className="px-4 pb-6">
            <TouchableOpacity
              onPress={handleCancelOrder}
              disabled={cancelling}
              className="bg-red-50 border border-red-200 rounded-lg py-3 items-center"
            >
              {cancelling ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <Text className="text-red-600 font-semibold">Cancelar Pedido</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}