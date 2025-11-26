import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function PaymentFailureScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-red-100 rounded-full p-6 mb-6">
          <Ionicons name="close" size={scale(64)} color="#EF4444" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Pago rechazado
        </Text>

        <Text className="text-gray-600 text-center mb-6">
          No pudimos procesar tu pago.{'\n'}
          Por favor verifica los datos e intenta nuevamente.
        </Text>

        <View className="bg-red-50 rounded-lg p-4 mb-6 w-full border border-red-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-600">Orden:</Text>
            <Text className="font-semibold text-gray-900">{orderId.slice(0, 8)}</Text>
          </View>

          <Text className="text-sm text-gray-700 mb-2 font-medium">Posibles causas:</Text>
          <View className="space-y-1">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={scale(16)} color="#EF4444" className="mr-2" />
              <Text className="text-sm text-gray-600 flex-1">Fondos insuficientes</Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={scale(16)} color="#EF4444" className="mr-2" />
              <Text className="text-sm text-gray-600 flex-1">Datos incorrectos de la tarjeta</Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={scale(16)} color="#EF4444" className="mr-2" />
              <Text className="text-sm text-gray-600 flex-1">Límite de compra excedido</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary rounded-lg py-4 px-8 w-full mb-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Intentar Nuevamente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          className="py-3 px-8 w-full"
        >
          <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
            Volver al Inicio
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
