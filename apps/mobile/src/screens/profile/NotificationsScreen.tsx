import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function NotificationsScreen({ navigation }: any) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [ordersEnabled, setOrdersEnabled] = useState(true);
  const [offersEnabled, setOffersEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Notificaciones</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Canales de notificación */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-500 mb-3">CANALES</Text>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Notificaciones Push</Text>
              <Text className="text-sm text-gray-500">Recibir alertas en tu dispositivo</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Notificaciones por Email</Text>
              <Text className="text-sm text-gray-500">Recibir emails informativos</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Tipos de notificación */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-gray-500 mb-3">TIPOS DE NOTIFICACIONES</Text>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Pedidos</Text>
              <Text className="text-sm text-gray-500">Actualizaciones de tus compras</Text>
            </View>
            <Switch
              value={ordersEnabled}
              onValueChange={setOrdersEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Ofertas y Promociones</Text>
              <Text className="text-sm text-gray-500">Descuentos especiales para ti</Text>
            </View>
            <Switch
              value={offersEnabled}
              onValueChange={setOffersEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Mensajes</Text>
              <Text className="text-sm text-gray-500">Comunicación con vendedores</Text>
            </View>
            <Switch
              value={messagesEnabled}
              onValueChange={setMessagesEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}