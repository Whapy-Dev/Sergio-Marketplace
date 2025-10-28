import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error loading product:', error);
    } else {
      setProduct(data);
    }
    setLoading(false);
  }

  function handleAddToCart() {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url,
      sellerId: product.seller_id,
      stock: product.stock,
    });

    Alert.alert('Agregado', 'Producto agregado al carrito', [
      { text: 'Seguir comprando', style: 'cancel' },
      { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-600">Producto no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavorite(product.id)}>
          <Text className="text-2xl">{isFavorite(product.id) ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Imagen del producto */}
        <View className="bg-gray-50 items-center justify-center" style={{ height: 300 }}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : (
            <Text className="text-6xl">📦</Text>
          )}
        </View>

        {/* Info del producto */}
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>

          <Text className="text-3xl font-bold text-primary mb-4">
            ${product.price.toLocaleString()}
          </Text>

          {product.description && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Descripción
              </Text>
              <Text className="text-base text-gray-700 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-base text-gray-600">
              Stock disponible: <Text className="font-semibold">{product.stock}</Text>
            </Text>
          </View>

          {/* Selector de cantidad */}
          <View className="flex-row items-center mb-6">
            <Text className="text-base text-gray-900 mr-4">Cantidad:</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2"
              >
                <Text className="text-xl font-bold text-gray-700">−</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900 px-4">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-2"
              >
                <Text className="text-xl font-bold text-gray-700">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button
          title="Agregar al carrito"
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        />
      </View>
    </SafeAreaView>
  );
}