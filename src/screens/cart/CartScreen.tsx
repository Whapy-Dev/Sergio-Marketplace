import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import Button from '../../components/common/Button';

export default function CartScreen({ navigation }: any) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }
    Alert.alert('Checkout', 'Funcionalidad de pago próximamente');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de eliminar todos los productos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mi Carrito</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Explora nuestros productos y agrega lo que te guste
          </Text>
          <Button
            title="Ver productos"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">
          Mi Carrito ({totalItems})
        </Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text className="text-sm text-red-500 font-semibold">Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {items.map((item) => (
          <View
            key={item.id}
            className="flex-row p-4 border-b border-gray-100"
          >
            {/* Imagen del producto */}
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

            {/* Info del producto */}
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-lg font-bold text-primary mb-2">
                ${item.price.toLocaleString()}
              </Text>

              {/* Controles de cantidad */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 bg-gray-100 rounded items-center justify-center"
                >
                  <Text className="text-lg font-bold text-gray-700">−</Text>
                </TouchableOpacity>

                <Text className="mx-4 text-base font-semibold text-gray-900">
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 bg-gray-100 rounded items-center justify-center"
                  disabled={item.quantity >= item.stock}
                >
                  <Text className={`text-lg font-bold ${item.quantity >= item.stock ? 'text-gray-300' : 'text-gray-700'}`}>
                    +
                  </Text>
                </TouchableOpacity>

                <Text className="ml-2 text-xs text-gray-500">
                  (Stock: {item.stock})
                </Text>
              </View>
            </View>

            {/* Botón eliminar */}
            <TouchableOpacity
              onPress={() => removeItem(item.id)}
              className="ml-2 items-center justify-center"
            >
              <Text className="text-2xl">🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Footer con totales */}
      <View className="border-t border-gray-200 bg-white p-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-600">Subtotal ({totalItems} productos)</Text>
          <Text className="text-base font-semibold text-gray-900">
            ${totalPrice.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row justify-between mb-4">
          <Text className="text-base text-gray-600">Envío</Text>
          <Text className="text-base font-semibold text-green-600">GRATIS</Text>
        </View>

        <View className="flex-row justify-between mb-4 pt-2 border-t border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Total</Text>
          <Text className="text-xl font-bold text-primary">
            ${totalPrice.toLocaleString()}
          </Text>
        </View>

        <Button
          title="Continuar compra"
          onPress={handleCheckout}
        />
      </View>
    </SafeAreaView>
  );
}