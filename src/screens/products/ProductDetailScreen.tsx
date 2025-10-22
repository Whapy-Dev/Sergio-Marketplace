import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem: addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          sellers(store_name)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error loading product:', error);
        Alert.alert('Error', 'No se pudo cargar el producto');
        navigation.goBack();
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      sellerId: product.seller_id,
    }, quantity);

    Alert.alert(
      '¡Agregado!',
      `${product.name} se agregó al carrito`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  }

  function handleToggleFavorite() {
    if (!product) return;
    toggleFavorite(product.id);
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

  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const favorite = isFavorite(product.id);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Text className="text-3xl">{favorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Imagen del producto */}
        <View className="bg-gray-100 h-80 items-center justify-center">
          {product.image_url ? (
            <Image 
              source={{ uri: product.image_url }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-8xl">📦</Text>
          )}
          {discount > 0 && (
            <View className="absolute top-4 left-4 bg-primary rounded-lg px-3 py-2">
              <Text className="text-white text-base font-bold">{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Información del producto */}
        <View className="px-4 py-4">
          {/* Nombre */}
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>

          {/* Categoría y condición */}
          <View className="flex-row items-center mb-3">
            {product.categories && (
              <View className="bg-gray-100 rounded px-2 py-1 mr-2">
                <Text className="text-xs text-gray-700">{product.categories.name}</Text>
              </View>
            )}
            <View className="bg-blue-100 rounded px-2 py-1">
              <Text className="text-xs text-blue-700">
                {product.condition === 'new' ? 'Nuevo' : 'Usado'}
              </Text>
            </View>
          </View>

          {/* Precio */}
          <View className="mb-4">
            {product.compare_at_price && (
              <Text className="text-base text-gray-400 line-through mb-1">
                ${product.compare_at_price.toLocaleString()}
              </Text>
            )}
            <View className="flex-row items-end">
              <Text className="text-4xl font-bold text-primary">
                ${product.price.toLocaleString()}
              </Text>
              {product.free_shipping && (
                <Text className="text-sm text-green-600 ml-2 mb-2">
                  Envío gratis 🚚
                </Text>
              )}
            </View>
          </View>

          {/* Stock */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600">
              Stock disponible: {product.stock} unidades
            </Text>
          </View>

          {/* Descripción */}
          {product.description && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-2">
                Descripción
              </Text>
              <Text className="text-base text-gray-700 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          {/* Vendedor */}
          {product.sellers && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                Vendido por
              </Text>
              <Text className="text-base text-gray-700">
                {product.sellers.store_name || 'Vendedor'}
              </Text>
            </View>
          )}

          {/* Selector de cantidad */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Cantidad
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
              >
                <Text className="text-2xl font-bold text-gray-700">-</Text>
              </TouchableOpacity>

              <Text className="text-2xl font-semibold text-gray-900 mx-6">
                {quantity}
              </Text>

              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
                disabled={quantity >= product.stock}
              >
                <Text className="text-2xl font-bold text-gray-700">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button
          title="Agregar al Carrito"
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        />
      </View>
    </SafeAreaView>
  );
}