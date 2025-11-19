import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder } from '../../services/orders';
import { createPaymentPreference } from '../../services/mercadopago';
import { getUserProfile } from '../../services/profile';
import { COLORS } from '../../constants/theme';

interface CheckoutScreenProps {
  route: {
    params: {
      product: {
        id: string;
        name: string;
        price: number;
        image_url?: string;
        seller_id?: string;
        description?: string;
      };
      quantity?: number;
    };
  };
  navigation: any;
}

export default function CheckoutScreen({ route, navigation }: CheckoutScreenProps) {
  const { product, quantity = 1 } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    if (!user) return;

    const profile = await getUserProfile(user.id);
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setPostalCode(profile.postal_code || '');
    }
  }

  async function handleCheckout() {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar');
      return;
    }

    if (!fullName || !email || !phone || !address || !city || !state) {
      Alert.alert('Datos incompletos', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      // 1. Create order in database
      const shippingAddress = `${address}, ${city}, ${state}${postalCode ? ` (${postalCode})` : ''}`;

      const orderData = {
        buyer_id: user.id,
        items: [{
          product_id: product.id,
          product_name: product.name,
          product_image_url: product.image_url,
          quantity,
          unit_price: product.price,
          seller_id: product.seller_id,
          shipping_address: shippingAddress,
        }],
        payment_method: 'mercadopago',
        buyer_notes: notes,
      };

      const order = await createOrder(orderData);

      if (!order) {
        throw new Error('Failed to create order');
      }

      // 2. Create MercadoPago preference
      const preference = await createPaymentPreference({
        items: [{
          title: product.name,
          description: product.description,
          picture_url: product.image_url,
          quantity,
          currency_id: 'ARS',
          unit_price: product.price,
        }],
        payer: {
          name: fullName.split(' ')[0],
          surname: fullName.split(' ').slice(1).join(' '),
          email,
          phone: {
            number: phone,
          },
        },
        back_urls: {
          success: `sergiomarketplace://payment/success?order_id=${order.id}`,
          failure: `sergiomarketplace://payment/failure?order_id=${order.id}`,
          pending: `sergiomarketplace://payment/pending?order_id=${order.id}`,
        },
        auto_return: 'approved',
        external_reference: order.id,
      });

      if (!preference) {
        throw new Error('Failed to create payment preference');
      }

      // 3. Open MercadoPago checkout
      const checkoutUrl = preference.sandbox_init_point; // Use init_point for production

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);

        // Navigate to pending screen
        navigation.replace('PaymentPending', { orderId: order.id });
      } else {
        Alert.alert('Error', 'No se pudo abrir el checkout de MercadoPago');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al procesar tu compra. Por favor intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  const subtotal = product.price * quantity;
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Finalizar Compra</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Summary */}
        <View className="bg-gray-50 p-4 border-b border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Resumen del pedido</Text>
          <View className="bg-white rounded-lg p-3">
            <Text className="font-semibold text-gray-900">{product.name}</Text>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-600">Cantidad: {quantity}</Text>
              <Text className="font-semibold text-gray-900">
                ${(product.price * quantity).toLocaleString('es-AR')}
              </Text>
            </View>
          </View>

          {/* Totals */}
          <View className="mt-3 space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-900">${subtotal.toLocaleString('es-AR')}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Envío</Text>
              <Text className="text-green-600 font-semibold">GRATIS</Text>
            </View>
            <View className="h-px bg-gray-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                ${total.toLocaleString('es-AR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Información de contacto</Text>

          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Nombre completo *</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Juan Pérez"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="juan@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Teléfono *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="+54 11 1234-5678"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View className="p-4 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Dirección de envío</Text>

          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Dirección *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Av. Corrientes 1234"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Ciudad *</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                  placeholder="Buenos Aires"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Provincia *</Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                  placeholder="CABA"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Código Postal</Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="1043"
                keyboardType="numeric"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Notas (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Instrucciones de entrega, timbre, etc."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="p-4 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Método de pago</Text>
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-row items-center">
            <View className="bg-blue-600 rounded-lg p-2 mr-3">
              <Ionicons name="card" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">MercadoPago</Text>
              <Text className="text-xs text-gray-600">Pago seguro con tarjeta o efectivo</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Bar */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={loading}
          className="rounded-lg py-4"
          style={{ backgroundColor: loading ? '#9CA3AF' : COLORS.primary }}
        >
          <Text className="text-white text-center font-bold text-lg">
            {loading ? 'Procesando...' : `Pagar $${total.toLocaleString('es-AR')}`}
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-gray-500 text-center mt-2">
          Al continuar aceptas los términos y condiciones
        </Text>
      </View>
    </SafeAreaView>
  );
}
