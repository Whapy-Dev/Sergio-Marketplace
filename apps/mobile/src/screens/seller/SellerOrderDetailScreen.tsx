import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { updateOrderStatus } from '../../services/orders';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

const STATUS_INFO = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500', next: 'confirmed' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', next: 'shipped' },
  shipped: { label: 'Enviado', color: 'bg-purple-500', next: 'delivered' },
  delivered: { label: 'Entregado', color: 'bg-green-500', next: null },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', next: null },
};

const STATUS_ACTIONS = {
  pending: { label: 'Confirmar Pedido', icon: '✅', action: 'confirmed' },
  confirmed: { label: 'Marcar como Enviado', icon: '📦', action: 'shipped' },
  shipped: { label: 'Marcar como Entregado', icon: '🎉', action: 'delivered' },
};

export default function SellerOrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      setLoading(true);

      // Obtener la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Obtener order_items del vendedor
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('seller_id', (await supabase.auth.getUser()).data.user?.id);

      if (itemsError) throw itemsError;

      // Obtener datos del comprador
      const { data: buyerData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .eq('id', orderData.buyer_id)
        .single();

      setOrder({
        ...orderData,
        order_items: itemsData || [],
        buyer: buyerData,
      });
    } catch (error: any) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'No se pudo cargar el pedido');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (newStatus === 'shipped' && !trackingNumber.trim() && showTrackingInput) {
      Alert.alert('Error', 'Ingresa el número de seguimiento');
      return;
    }

    Alert.alert(
      'Confirmar',
      `¿Cambiar el estado del pedido a "${STATUS_INFO[newStatus as keyof typeof STATUS_INFO].label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setUpdating(true);

              // Actualizar estado de la orden
              const result = await updateOrderStatus(orderId, newStatus as any);

              if (!result.success) {
                throw new Error(result.error);
              }

              // Si es shipped y hay tracking, actualizar order_items
              if (newStatus === 'shipped' && trackingNumber.trim()) {
                await supabase
                  .from('order_items')
                  .update({
                    shipping_status: 'shipped',
                    tracking_number: trackingNumber.trim(),
                  })
                  .eq('order_id', orderId);
              }

              Alert.alert('¡Listo!', 'El pedido se actualizó correctamente');
              loadOrder();
              setShowTrackingInput(false);
              setTrackingNumber('');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setUpdating(false);
            }
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

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsApp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/54${cleanPhone}`);
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

  if (!order) return null;

  const statusInfo = STATUS_INFO[order.status as keyof typeof STATUS_INFO];
  const canUpdate = order.status !== 'delivered' && order.status !== 'cancelled';
  const nextAction = STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS];

  // Calcular totales
  const subtotal = order.order_items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);
  const commission = order.order_items.reduce((sum: number, item: any) => sum + parseFloat(item.commission_amount), 0);
  const earnings = order.order_items.reduce((sum: number, item: any) => sum + parseFloat(item.seller_payout), 0);

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
        {/* Estado actual */}
        <View className="px-4 py-4 bg-gray-50">
          <Text className="text-sm font-medium text-gray-700 mb-2">Estado del Pedido</Text>
          <View className={`${statusInfo.color} rounded-lg p-4`}>
            <Text className="text-white text-lg font-bold text-center">
              {statusInfo.label.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Datos del comprador */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            👤 Datos del Comprador
          </Text>
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {order.buyer?.full_name || 'Sin nombre'}
            </Text>
            {order.buyer?.phone && (
              <View className="flex-row items-center mt-2">
                <Text className="text-sm text-gray-600 flex-1">
                  📱 {order.buyer.phone}
                </Text>
                <TouchableOpacity
                  onPress={() => handleWhatsApp(order.buyer.phone)}
                  className="bg-green-500 rounded-lg px-3 py-1 mr-2"
                >
                  <Text className="text-white text-xs font-semibold">WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCall(order.buyer.phone)}
                  className="bg-blue-500 rounded-lg px-3 py-1"
                >
                  <Text className="text-white text-xs font-semibold">Llamar</Text>
                </TouchableOpacity>
              </View>
            )}
            {order.buyer?.email && (
              <Text className="text-sm text-gray-600 mt-2">
                ✉️ {order.buyer.email}
              </Text>
            )}
          </View>
        </View>

        {/* Productos */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            📦 Productos
          </Text>
          {order.order_items.map((item: any) => (
            <View key={item.id} className="bg-gray-50 rounded-lg p-4 mb-2">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-base font-semibold text-gray-900 flex-1">
                  {item.product_name}
                </Text>
                <Text className="text-base font-bold text-primary">
                  ${parseFloat(item.subtotal).toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">
                  Cantidad: {item.quantity} × ${parseFloat(item.unit_price).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Método de pago */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            💳 Método de Pago
          </Text>
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-base text-gray-900">
              {order.payment_method === 'cash' && '💵 Efectivo contra entrega'}
              {order.payment_method === 'transfer' && '🏦 Transferencia bancaria'}
              {order.payment_method === 'mercadopago' && '💙 Mercado Pago'}
            </Text>
            {order.payment_status === 'paid' && (
              <Text className="text-sm text-green-600 mt-1">✅ Pagado</Text>
            )}
          </View>
        </View>

        {/* Notas del comprador */}
        {order.buyer_notes && (
          <View className="px-4 py-4 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              📝 Notas del Comprador
            </Text>
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Text className="text-sm text-gray-700">{order.buyer_notes}</Text>
            </View>
          </View>
        )}

        {/* Resumen financiero */}
        <View className="px-4 py-4 bg-gray-50">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            💰 Resumen Financiero
          </Text>
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Subtotal productos</Text>
              <Text className="text-sm font-semibold text-gray-900">
                ${subtotal.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Comisión plataforma (10%)</Text>
              <Text className="text-sm font-semibold text-red-600">
                -${commission.toLocaleString()}
              </Text>
            </View>
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-base font-bold text-gray-900">Tu ganancia</Text>
                <Text className="text-xl font-bold text-green-600">
                  ${earnings.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón de acción */}
      {canUpdate && nextAction && (
        <View className="px-4 py-4 border-t border-gray-200 bg-white">
          {order.status === 'confirmed' && (
            <View className="mb-3">
              <TouchableOpacity
                onPress={() => setShowTrackingInput(!showTrackingInput)}
                className="bg-gray-100 rounded-lg p-3 mb-2"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  {showTrackingInput ? '❌ Cancelar' : '📝 Agregar número de seguimiento (opcional)'}
                </Text>
              </TouchableOpacity>

              {showTrackingInput && (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Ej: AR123456789"
                  editable={!updating}
                />
              )}
            </View>
          )}

          <Button
            title={`${nextAction.icon} ${nextAction.label}`}
            onPress={() => handleUpdateStatus(nextAction.action)}
            loading={updating}
          />
        </View>
      )}

      {order.status === 'delivered' && (
        <View className="px-4 py-4 border-t border-gray-200 bg-green-50">
          <Text className="text-center text-green-700 font-semibold">
            🎉 ¡Pedido completado exitosamente!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}