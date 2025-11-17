import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';
import Button from '../../components/common/Button';

export default function CartScreen({ navigation }: any) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [validating, setValidating] = useState(false);

  async function validateStock() {
    setValidating(true);
    
    try {
      // Verificar stock de cada producto
      for (const item of items) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.id)
          .single();

        if (error) {
          Alert.alert('Error', 'No se pudo verificar el stock');
          setValidating(false);
          return false;
        }

        if (!product) {
          Alert.alert('Producto no disponible', `El producto "${item.name}" ya no está disponible`);
          removeItem(item.id);
          setValidating(false);
          return false;
        }

        if (product.stock < item.quantity) {
          Alert.alert(
            'Stock insuficiente',
            `Solo hay ${product.stock} unidades disponibles de "${item.name}". Se ajustará la cantidad.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (product.stock === 0) {
                    removeItem(item.id);
                  } else {
                    updateQuantity(item.id, product.stock);
                  }
                }
              }
            ]
          );
          setValidating(false);
          return false;
        }
      }

      setValidating(false);
      return true;
    } catch (error) {
      console.error('Error validating stock:', error);
      Alert.alert('Error', 'Hubo un problema al validar el stock');
      setValidating(false);
      return false;
    }
  }

  async function handleCheckout() {
    const isValid = await validateStock();
    if (isValid) {
      navigation.navigate('Checkout');
    }
  }

  function handleUpdateQuantity(itemId: string, newQuantity: number) {
    const item = items.find(i => i.id === itemId);
    if (item && newQuantity > item.stock) {
      Alert.alert(
        'Stock máximo',
        `Solo hay ${item.stock} unidades disponibles`
      );
      return;
    }
    updateQuantity(itemId, newQuantity);
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Carrito (0 productos)</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cart-outline" size={100} color="#D1D5DB" />
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center mt-6">
            Tu carrito está vacío
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Agrega productos para comenzar tu compra
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="bg-primary rounded-xl px-6 py-3"
            style={{ backgroundColor: COLORS.primary }}
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
                <Ionicons name="cube-outline" size={36} color="#9CA3AF" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                {item.name}
              </Text>
              
              {/* Indicador de stock */}
              {item.stock < 5 && (
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle-outline" size={14} color="#EA580C" />
                  <Text className="text-xs text-orange-600 font-semibold ml-1">
                    Solo quedan {item.stock} disponibles
                  </Text>
                </View>
              )}

              <Text className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
                ${item.price.toLocaleString()}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center border border-gray-300 rounded-lg">
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1"
                    disabled={validating}
                  >
                    <Ionicons name="remove" size={18} color="#374151" />
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-gray-900 px-3">
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1"
                    disabled={validating || item.quantity >= item.stock}
                  >
                    <Ionicons 
                      name="add" 
                      size={18} 
                      color={item.quantity >= item.stock ? '#D1D5DB' : '#374151'} 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={() => removeItem(item.id)}
                  disabled={validating}
                  className="flex-row items-center"
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text className="text-red-600 font-semibold ml-1">Eliminar</Text>
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
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-base text-gray-700">Envío</Text>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text className="text-base font-semibold text-green-600 ml-1">Gratis</Text>
            </View>
          </View>
          <View className="flex-row justify-between pt-2 border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              ${totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        <Button
          title="Finalizar Compra"
          onPress={handleCheckout}
          loading={validating}
        />
      </View>
    </SafeAreaView>
  );
}