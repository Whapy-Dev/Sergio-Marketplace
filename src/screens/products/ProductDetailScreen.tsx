import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string | null;
  seller_id: string;
  condition: 'new' | 'used';
  free_shipping: boolean;
  status: string;
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error loading product:', error);
        Alert.alert('Error', 'No se pudo cargar el producto');
      } else {
        setProduct(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    if (product.stock === 0) {
      Alert.alert('Sin stock', 'Este producto no está disponible');
      return;
    }

    if (quantity > product.stock) {
      Alert.alert('Stock insuficiente', `Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url || undefined,
      sellerId: product.seller_id,
      stock: product.stock,
    });

    Alert.alert('¡Agregado! 🛒', 'Producto agregado al carrito', [
      { text: 'Seguir comprando', style: 'cancel' },
      { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') },
    ]);
  }

  function handleBuyNow() {
    if (!product) return;

    if (product.stock === 0) {
      Alert.alert('Sin stock', 'Este producto no está disponible');
      return;
    }

    // Agregar al carrito y navegar a checkout
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url || undefined,
      sellerId: product.seller_id,
      stock: product.stock,
    });

    navigation.navigate('Cart');
  }

  function getStockStatus() {
    if (!product) return null;

    if (product.stock === 0) {
      return (
        <View className="bg-red-50 rounded-lg px-3 py-2 mb-4">
          <Text className="text-red-600 font-semibold text-center">
            ❌ Sin stock disponible
          </Text>
        </View>
      );
    }

    if (product.stock <= 5) {
      return (
        <View className="bg-orange-50 rounded-lg px-3 py-2 mb-4">
          <Text className="text-orange-600 font-semibold text-center">
            ⚠️ ¡Solo quedan {product.stock} unidades!
          </Text>
        </View>
      );
    }

    if (product.stock <= 10) {
      return (
        <View className="bg-yellow-50 rounded-lg px-3 py-2 mb-4">
          <Text className="text-yellow-700 font-semibold text-center">
            ⏰ Pocas unidades disponibles ({product.stock})
          </Text>
        </View>
      );
    }

    return null;
  }

  function getDiscountPercentage() {
    if (!product?.compare_at_price || product.compare_at_price <= product.price) {
      return null;
    }

    const discount = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
    return discount;
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
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Este producto ya no está disponible
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const discount = getDiscountPercentage();

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
        <View className="bg-gray-50 items-center justify-center relative" style={{ height: 300 }}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : (
            <Text className="text-6xl">📦</Text>
          )}
          
          {/* Badge de descuento */}
          {discount && (
            <View className="absolute top-4 left-4 bg-red-500 rounded-lg px-3 py-1">
              <Text className="text-white font-bold text-sm">-{discount}%</Text>
            </View>
          )}

          {/* Badge de condición */}
          <View className="absolute top-4 right-4 bg-white rounded-lg px-3 py-1 shadow-sm">
            <Text className="text-gray-700 font-semibold text-xs">
              {product.condition === 'new' ? '✨ Nuevo' : '📦 Usado'}
            </Text>
          </View>
        </View>

        {/* Info del producto */}
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-3">
            {product.name}
          </Text>

          {/* Precio */}
          <View className="mb-4">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <Text className="text-base text-gray-500 line-through mb-1">
                ${product.compare_at_price.toLocaleString()}
              </Text>
            )}
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-primary">
                ${product.price.toLocaleString()}
              </Text>
              {discount && (
                <Text className="text-base text-green-600 font-semibold ml-2">
                  {discount}% OFF
                </Text>
              )}
            </View>
          </View>

          {/* Envío gratis */}
          {product.free_shipping && (
            <View className="bg-green-50 rounded-lg px-3 py-2 mb-4 flex-row items-center">
              <Text className="text-lg mr-2">🚚</Text>
              <Text className="text-green-700 font-semibold">Envío gratis</Text>
            </View>
          )}

          {/* Estado del stock */}
          {getStockStatus()}

          {/* Descripción */}
          {product.description && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Descripción
              </Text>
              <Text className="text-base text-gray-700 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          {/* Características */}
          <View className="mb-6 bg-gray-50 rounded-xl p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Características
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-sm text-gray-600">Condición</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {product.condition === 'new' ? 'Nuevo' : 'Usado'}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-sm text-gray-600">Stock disponible</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {product.stock} unidades
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-600">Envío</Text>
                <Text className="text-sm font-semibold text-green-600">
                  {product.free_shipping ? 'Gratis' : 'A coordinar'}
                </Text>
              </View>
            </View>
          </View>

          {/* Selector de cantidad */}
          {product.stock > 0 && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Cantidad
              </Text>
              <View className="flex-row items-center">
                <View className="flex-row items-center border border-gray-300 rounded-lg">
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3"
                  >
                    <Text className="text-xl font-bold text-gray-700">−</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-gray-900 px-6">
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-3"
                    disabled={quantity >= product.stock}
                  >
                    <Text 
                      className={`text-xl font-bold ${quantity >= product.stock ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-500 ml-4">
                  Disponibles: {product.stock}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View className="px-4 py-3 border-t border-gray-200 bg-white">
        {product.stock > 0 ? (
          <View className="space-y-2">
            <Button
              title={`Agregar al carrito (${quantity})`}
              onPress={handleAddToCart}
            />
            <TouchableOpacity
              onPress={handleBuyNow}
              className="bg-blue-600 rounded-xl py-4"
            >
              <Text className="text-white font-bold text-center text-base">
                Comprar ahora
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-gray-100 rounded-xl py-4">
            <Text className="text-gray-500 font-semibold text-center text-base">
              Producto no disponible
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}