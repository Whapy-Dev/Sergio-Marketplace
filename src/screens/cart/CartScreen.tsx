import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import Button from '../../components/common/Button';

export default function CartScreen({ navigation }: any) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Carrito (0 productos)</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Tu carrito está vacío
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Agrega productos para comenzar tu compra
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Explorar productos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">
          Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {items.map((item) => (
          <View key={item.id} className="flex-row bg-white rounded-xl mb-3 p-3 border border-gray-200">
            <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-3">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-full h-full rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl">📦</Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-lg font-bold text-primary mb-2">
                ${item.price.toLocaleString()}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center border border-gray-300 rounded-lg">
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1"
                  >
                    <Text className="text-lg font-bold text-gray-700">−</Text>
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-gray-900 px-3">
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1"
                  >
                    <Text className="text-lg font-bold text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text className="text-red-600 font-semibold">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-700">Subtotal</Text>
            <Text className="text-base font-semibold text-gray-900">${totalPrice.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-700">Envío</Text>
            <Text className="text-base font-semibold text-green-600">Gratis 🎉</Text>
          </View>
          <View className="flex-row justify-between pt-2 border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-2xl font-bold text-primary">${totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        <Button
          title="Finalizar Compra"
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
    </SafeAreaView>
  );
}