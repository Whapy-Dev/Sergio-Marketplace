import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import Button from '../../components/common/Button';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalAmount, removeItem, updateQuantity } = useCart();

  // Altura del footer + safe area + tab bar
  const footerHeight = 200 + insets.bottom + TAB_BAR_HEIGHT;

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="px-5 py-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Carrito</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
          <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Agrega productos para comenzar tu compra
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="bg-primary rounded-xl px-8 py-4"
          >
            <Text className="text-white font-semibold text-base">Explorar Productos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">
          Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: footerHeight }}>
        {items.map((item) => (
          <View
            key={item.id}
            className="mx-4 my-2 p-4 bg-white border border-gray-200 rounded-lg"
          >
            <View className="flex-row">
              {/* Imagen */}
              <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-3">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-full h-full rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                )}
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="text-lg font-bold text-primary mb-2">
                  ${item.price.toLocaleString()}
                </Text>

                {/* Controles de cantidad */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Text className="text-lg font-bold text-gray-700">-</Text>
                    </TouchableOpacity>

                    <Text className="text-base font-semibold text-gray-900 mx-4">
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Text className="text-lg font-bold text-gray-700">+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    className="px-3 py-1"
                  >
                    <Text className="text-red-600 font-semibold">Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Subtotal */}
            <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Subtotal</Text>
              <Text className="text-base font-bold text-gray-900">
                ${(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* Footer con total y botón - Posición absoluta */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 border-t border-gray-100"
        style={{
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 20,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base text-gray-600">Subtotal</Text>
          <Text className="text-base font-semibold text-gray-900">
            ${totalAmount.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base text-gray-600">Envío</Text>
          <Text className="text-base font-semibold text-green-600">Gratis</Text>
        </View>
        <View className="flex-row justify-between items-center mb-4 pt-3 border-t border-gray-100">
          <Text className="text-lg font-bold text-gray-900">Total</Text>
          <Text className="text-2xl font-bold text-primary">
            ${totalAmount.toLocaleString()}
          </Text>
        </View>

        <Button
          title="Finalizar Compra"
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
    </SafeAreaView>
  );
}