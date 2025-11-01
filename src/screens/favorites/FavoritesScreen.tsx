import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
}

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [favorites]);

  async function loadProducts() {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites);

      if (error) {
        console.error('Error loading products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Favoritos</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">❤️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Sin favoritos aún
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Guarda tus productos favoritos aquí para encontrarlos fácilmente
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="rounded-xl px-6 py-3"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-semibold">Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap justify-between">
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: product.id })
                }
                className="w-[48%] mb-4 bg-white rounded-xl overflow-hidden border border-gray-200"
              >
                {/* Imagen */}
                <View className="aspect-square bg-gray-100">
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-4xl">📦</Text>
                    </View>
                  )}
                  {/* Botón quitar de favoritos */}
                  <TouchableOpacity
                    onPress={() => toggleFavorite(product.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  >
                    <Text className="text-lg">❤️</Text>
                  </TouchableOpacity>
                </View>

                {/* Info */}
                <View className="p-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                    ${product.price.toLocaleString('es-AR')}
                  </Text>
                  {product.stock === 0 && (
                    <Text className="text-xs text-red-600 font-semibold mt-1">
                      Sin stock
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View className="h-4" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}