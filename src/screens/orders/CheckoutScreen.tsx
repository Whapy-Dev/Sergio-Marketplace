import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../services/orders';
import { getUserProfile } from '../../services/profile';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

export default function CheckoutScreen({ navigation }: any) {
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mercadopago'>('cash');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    if (!user) return;

    const profile = await getUserProfile(user.id);
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
      setPostalCode(profile.postal_code || '');
    }
    setLoading(false);
  }

  async function handleCreateOrder() {
    if (!user) return;

    // Validaciones
    if (!fullName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre completo');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Ingresa tu teléfono');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Ingresa tu dirección de entrega');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Ingresa tu ciudad');
      return;
    }

    if (!postalCode.trim()) {
      Alert.alert('Error', 'Ingresa tu código postal');
      return;
    }

    try {
      setCreating(true);

      const orderData = {
        buyer_id: user.id,
        items: items.map(item => ({
          product_id: item.id,
          seller_id: item.sellerId,
          product_name: item.name,
          product_image_url: item.imageUrl,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        payment_method: paymentMethod,
        buyer_notes: notes.trim() || undefined,
      };

      const result = await createOrder(orderData);

      if (result.success) {
        clearCart();
        Alert.alert(
          '¡Pedido Realizado! 🎉',
          `Tu pedido #${result.data.order_number} fue creado exitosamente.\n\nPuedes verlo en "Mis Compras" desde tu perfil.`,
          [
            {
              text: 'Ir a Mis Compras',
              onPress: () => {
                navigation.navigate('MainTabs', {
                  screen: 'Profile',
                  params: {
                    screen: 'MyOrders',
                  }
                });
              },
            },
            {
              text: 'Seguir Comprando',
              style: 'cancel',
              onPress: () => {
                navigation.navigate('MainTabs', {
                  screen: 'Home'
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el pedido');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
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

  const shippingCost = 0; // Envío gratis
  const total = totalAmount + shippingCost;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Finalizar Compra</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Resumen de productos */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cube-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-gray-900">Resumen del Pedido</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                {item.name} x{item.quantity}
              </Text>
              <Text className="text-sm font-semibold text-gray-900">
                ${(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Datos de contacto */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="person-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-gray-900">Datos de Contacto</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Nombre completo *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Pérez"
              editable={!creating}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Teléfono *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={phone}
              onChangeText={setPhone}
              placeholder="3704123456"
              keyboardType="phone-pad"
              editable={!creating}
            />
          </View>
        </View>

        {/* Dirección de envío */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-gray-900">Dirección de Envío</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Dirección *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={address}
              onChangeText={setAddress}
              placeholder="Calle, Número, Barrio"
              editable={!creating}
            />
          </View>

          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-sm text-gray-700 mb-1">Ciudad *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={city}
                onChangeText={setCity}
                placeholder="Formosa"
                editable={!creating}
              />
            </View>
            <View className="w-24">
              <Text className="text-sm text-gray-700 mb-1">CP *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="3600"
                keyboardType="number-pad"
                maxLength={4}
                editable={!creating}
              />
            </View>
          </View>
        </View>

        {/* Método de pago */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="card-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-gray-900">Método de Pago</Text>
          </View>

          <TouchableOpacity
            onPress={() => setPaymentMethod('cash')}
            className={`flex-row items-center p-4 rounded-lg mb-2 border ${
              paymentMethod === 'cash' ? 'bg-blue-50 border-primary' : 'bg-gray-50 border-gray-200'
            }`}
            disabled={creating}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'cash' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color={paymentMethod === 'cash' ? COLORS.primary : '#374151'} style={{ marginRight: 6 }} />
                <Text className={`text-base font-medium ${paymentMethod === 'cash' ? 'text-primary' : 'text-gray-900'}`}>
                  Efectivo contra entrega
                </Text>
              </View>
              <Text className="text-xs text-gray-600 mt-1">Paga cuando recibas tu pedido</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('transfer')}
            className={`flex-row items-center p-4 rounded-lg mb-2 border ${
              paymentMethod === 'transfer' ? 'bg-blue-50 border-primary' : 'bg-gray-50 border-gray-200'
            }`}
            disabled={creating}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                paymentMethod === 'transfer' ? 'border-primary' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'transfer' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Ionicons name="swap-horizontal-outline" size={16} color={paymentMethod === 'transfer' ? COLORS.primary : '#374151'} style={{ marginRight: 6 }} />
                <Text className={`text-base font-medium ${paymentMethod === 'transfer' ? 'text-primary' : 'text-gray-900'}`}>
                  Transferencia bancaria
                </Text>
              </View>
              <Text className="text-xs text-gray-600 mt-1">Te enviaremos los datos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('mercadopago')}
            className={`flex-row items-center p-4 rounded-lg border ${
              paymentMethod === 'mercadopago' ? 'bg-blue-50 border-primary' : 'bg-gray-50 border-gray-200'
            }`}
            disabled={creating}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                paymentMethod === 'mercadopago' ? 'border-primary' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'mercadopago' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Ionicons name="logo-apple-appstore" size={16} color={paymentMethod === 'mercadopago' ? COLORS.primary : '#374151'} style={{ marginRight: 6 }} />
                <Text className={`text-base font-medium ${paymentMethod === 'mercadopago' ? 'text-primary' : 'text-gray-900'}`}>
                  Mercado Pago
                </Text>
              </View>
              <Text className="text-xs text-gray-600 mt-1">Paga con tarjeta o efectivo</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notas adicionales */}
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="document-text-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-gray-900">Notas (opcional)</Text>
          </View>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: Tocar timbre, dejar con portero..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!creating}
          />
        </View>
      </ScrollView>

      {/* Footer con total y botón */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700">Subtotal</Text>
          <Text className="text-base font-semibold text-gray-900">${totalAmount.toLocaleString()}</Text>
        </View>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700">Envío</Text>
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-green-600">Gratis</Text>
            <Ionicons name="gift-outline" size={16} color="#16A34A" style={{ marginLeft: 4 }} />
          </View>
        </View>
        <View className="flex-row justify-between items-center mb-4 pt-3 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Total</Text>
          <Text className="text-2xl font-bold text-primary">${total.toLocaleString()}</Text>
        </View>

        <Button
          title="Confirmar Pedido"
          onPress={handleCreateOrder}
          loading={creating}
        />
      </View>
    </SafeAreaView>
  );
}