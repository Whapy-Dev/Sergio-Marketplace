import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import ProductCard from '../../components/home/ProductCard';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  free_shipping: boolean;
}

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, loading: favoritesLoading, refreshFavorites } = useFavorites();
  const { user } = useAuth();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavoriteProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favorites, user]);

  async function loadFavoriteProducts() {
    if (!user || favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_at_price, stock, free_shipping')
        .in('id', favorites)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading favorite products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">❤️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Inicia sesión</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Debes iniciar sesión para guardar tus productos favoritos
          </Text>
          <Button
            title="Iniciar sesión"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading || favoritesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">❤️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">No tienes favoritos</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Explora productos y guarda los que más te gusten
          </Text>
          <Button
            title="Explorar productos"
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
          Mis Favoritos ({products.length})
        </Text>
        <TouchableOpacity onPress={refreshFavorites}>
          <Text className="text-sm text-primary font-semibold">Actualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row flex-wrap justify-between">
          {products.map((product) => (
            <View key={product.id} className="w-[48%]">
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                compareAtPrice={product.compare_at_price}
                onPress={() => navigation.navigate('Home', {
                  screen: 'HomeMain',
                  params: {
                    screen: 'ProductDetail',
                    params: { productId: product.id }
                  }
                })}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}