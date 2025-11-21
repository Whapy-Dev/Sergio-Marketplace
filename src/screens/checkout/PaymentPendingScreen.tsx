import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function PaymentPendingScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  useEffect(() => {
    // Poll for payment status (optional)
    const checkPaymentInterval = setInterval(async () => {
      // TODO: Check payment status from database
      // If paid, navigate to success
      // If failed, navigate to failure
    }, 5000);

    return () => clearInterval(checkPaymentInterval);
  }, [orderId]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-yellow-100 rounded-full p-6 mb-6">
          <Ionicons name="time" size={64} color="#EAB308" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Esperando confirmación de pago
        </Text>

        <Text className="text-gray-600 text-center mb-6">
          Estamos procesando tu pago. Te notificaremos cuando se confirme.
        </Text>

        <View className="bg-gray-50 rounded-lg p-4 mb-6 w-full">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600">Número de orden:</Text>
            <Text className="font-semibold text-gray-900">{orderId.slice(0, 8)}</Text>
          </View>
        </View>

        <ActivityIndicator size="large" color={COLORS.primary} className="mb-6" />

        <Text className="text-sm text-gray-500 text-center mb-8">
          Puedes cerrar esta pantalla.{'\n'}
          Te avisaremos cuando el pago se confirme.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          className="bg-primary rounded-lg py-4 px-8 w-full"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Ir al Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile', params: { screen: 'MyOrders' } })}
          className="mt-3 py-3 px-8 w-full"
        >
          <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
            Ver Mis Compras
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
