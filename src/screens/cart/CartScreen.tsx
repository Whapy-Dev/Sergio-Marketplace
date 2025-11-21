import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import Button from '../../components/common/Button';

export default function CartScreen({ navigation }: any) {
  const { items, totalItems, totalAmount, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Carrito</Text>
        </View>
        
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Agrega productos para comenzar tu compra
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="bg-primary rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Explorar Productos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">
          Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
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
                  <Text className="text-3xl">📦</Text>
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

        <View className="h-20" />
      </ScrollView>

      {/* Footer con total y botón */}
      <View className="px-4 pt-4 pb-24 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700">Subtotal</Text>
          <Text className="text-base font-semibold text-gray-900">
            ${totalAmount.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700">Envío</Text>
          <Text className="text-base font-semibold text-green-600">Gratis 🎉</Text>
        </View>
        <View className="flex-row justify-between items-center mb-4 pt-3 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Total</Text>
          <Text className="text-2xl font-bold text-primary">
            ${totalAmount.toLocaleString()}
          </Text>
        </View>

        <Button
          title={`Finalizar Compra`}
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
    </SafeAreaView>
  );
}