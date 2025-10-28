import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, favoriteProducts, toggleFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos ({favorites.length})</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">❤️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            No tienes favoritos
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Agrega productos a tus favoritos para verlos aquí
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Mis Favoritos ({favorites.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text className="text-primary font-semibold">Actualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {favoriteProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            className="flex-row bg-white rounded-xl mb-3 overflow-hidden border border-gray-200"
          >
            <View className="w-24 h-24 bg-gray-100 items-center justify-center">
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl">📦</Text>
              )}
            </View>

            <View className="flex-1 p-3 justify-between">
              <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="text-lg font-bold text-primary">
                ${product.price.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleFavorite(product.id)}
              className="p-3 justify-center"
            >
              <Text className="text-2xl">❤️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}