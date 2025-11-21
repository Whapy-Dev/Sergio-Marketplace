import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

export default function PaymentSuccessScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <LinearGradient
          colors={['#10B981', '#34D399']}
          className="rounded-full p-6 mb-6"
        >
          <Ionicons name="checkmark" size={64} color="white" />
        </LinearGradient>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          ¡Pago exitoso!
        </Text>

        <Text className="text-gray-600 text-center mb-6">
          Tu compra fue procesada correctamente.{'\n'}
          Recibirás un email con los detalles.
        </Text>

        <View className="bg-green-50 rounded-lg p-4 mb-6 w-full border border-green-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600">Número de orden:</Text>
            <Text className="font-semibold text-gray-900">{orderId.slice(0, 8)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">Estado:</Text>
            <View className="bg-green-500 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">PAGADO</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile', params: { screen: 'MyOrders' } })}
          className="bg-primary rounded-lg py-4 px-8 w-full mb-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Ver Mi Compra
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          className="py-3 px-8 w-full"
        >
          <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
            Seguir Comprando
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
