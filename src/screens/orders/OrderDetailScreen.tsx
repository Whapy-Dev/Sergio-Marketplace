import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getOrderById, cancelOrder } from '../../services/orders';
import { hasUserReviewedProduct } from '../../services/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';

const STATUS_INFO = {
  pending: {
    label: 'Pendiente',
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    iconColor: '#CA8A04',
    iconName: 'time-outline' as const,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    iconColor: '#2563EB',
    iconName: 'checkmark-circle-outline' as const,
  },
  shipped: {
    label: 'Enviado',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    iconColor: '#9333EA',
    iconName: 'car-outline' as const,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-600',
    bg: 'bg-green-100',
    iconColor: '#16A34A',
    iconName: 'checkmark-done-circle-outline' as const,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-600',
    bg: 'bg-red-100',
    iconColor: '#DC2626',
    iconName: 'close-circle-outline' as const,
  },
};

const PAYMENT_METHODS = {
  cash: { label: 'Efectivo', iconName: 'cash-outline' as const },
  transfer: { label: 'Transferencia', iconName: 'swap-horizontal-outline' as const },
  mercadopago: { label: 'Mercado Pago', iconName: 'card-outline' as const },
};

export default function OrderDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    setLoading(true);
    const data = await getOrderById(orderId);
    setOrder(data);

    // Check which products have been reviewed
    if (data && user && data.order_items) {
      const reviewed: Record<string, boolean> = {};
      for (const item of data.order_items) {
        reviewed[item.product_id] = await hasUserReviewedProduct(user.id, item.product_id);
      }
      setReviewedProducts(reviewed);
    }

    setLoading(false);
  }

  function handleWriteReview(item: any) {
    navigation.navigate('WriteReview', {
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      orderId: orderId,
      userId: user?.id,
    });
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
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
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
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
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
            <View className={`px-3 py-1.5 rounded-full ${statusInfo.bg} flex-row items-center`}>
              <Ionicons name={statusInfo.iconName} size={16} color={statusInfo.iconColor} />
              <Text className={`text-sm font-semibold ${statusInfo.color} ml-1.5`}>
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
            <View key={item.id} className="mb-4 pb-4 border-b border-gray-100">
              <View className="flex-row">
                {/* Imagen del producto */}
                {item.product_image ? (
                  <Image
                    source={{ uri: item.product_image }}
                    className="w-16 h-16 rounded-lg bg-gray-100"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-gray-100 items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                  </View>
                )}

                {/* Info del producto */}
                <View className="flex-1 ml-3">
                  <Text className="text-base text-gray-900 mb-1" numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Cantidad: {item.quantity} x ${item.unit_price.toLocaleString()}
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 mt-1">
                    ${item.subtotal.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Botón de reseña - solo si el pedido está entregado */}
              {(order.status === 'delivered' || order.status === 'completed') && user && (
                <View className="mt-3">
                  {reviewedProducts[item.product_id] ? (
                    <View className="flex-row items-center bg-green-50 rounded-lg px-3 py-2">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text className="text-sm text-green-700 ml-2">Ya dejaste tu opinión</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleWriteReview(item)}
                      className="flex-row items-center justify-center bg-primary/10 rounded-lg px-4 py-3"
                    >
                      <Ionicons name="star-outline" size={18} color={COLORS.primary} />
                      <Text className="text-sm font-medium ml-2" style={{ color: COLORS.primary }}>
                        Dejar mi opinión
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Método de pago */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">Método de Pago</Text>
          <View className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row items-center">
              <Ionicons
                name={PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS]?.iconName || 'card-outline'}
                size={20}
                color="#6B7280"
              />
              <Text className="text-base text-gray-900 ml-2">
                {PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS]?.label || order.payment_method}
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={order.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                size={16}
                color={order.payment_status === 'paid' ? '#16A34A' : '#CA8A04'}
              />
              <Text className={`text-sm ml-1.5 ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notas del comprador */}
        {order.buyer_notes && (
          <View className="px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center mb-3">
              <Ionicons name="document-text-outline" size={18} color="#374151" />
              <Text className="text-base font-semibold text-gray-900 ml-2">Notas</Text>
            </View>
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
              <View className="flex-row items-center">
                {order.shipping_total === 0 && (
                  <Ionicons name="gift-outline" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                )}
                <Text className="text-sm text-green-600">
                  {order.shipping_total === 0 ? 'Gratis' : `$${order.shipping_total.toLocaleString()}`}
                </Text>
              </View>
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