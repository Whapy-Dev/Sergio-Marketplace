import React from 'react';
import { View, ScrollView, Text, ActivityIndicator } from 'react-native';
import Header from '../../components/home/Header';
import CategoryItem from '../../components/home/CategoryItem';
import ProductCard from '../../components/home/ProductCard';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { COLORS } from '../../constants/theme';

const CATEGORY_EMOJIS: { [key: string]: string } = {
  Electrónica: '💻',
  Hogar: '🏠',
  Moda: '👕',
  Deportes: '⚽',
  Juguetes: '🧸',
  Belleza: '💄',
  Libros: '📚',
  Supermercado: '🛒',
};

export default function HomeScreen({ navigation }: any) {
  const { categories, loading, error } = useCategories();
  const { products, loading: loadingProducts } = useProducts(6);

  return (
    <View className="flex-1 bg-white">
      <Header />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-blue-100 h-48 mx-4 my-4 rounded-lg items-center justify-center">
          <Text className="text-4xl">🎉</Text>
          <Text className="text-lg font-bold text-primary mt-2">Ofertas especiales</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Categorías</Text>

          {loading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <Text className="text-red-500 text-center px-4">{error}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4"
            >
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  name={category.name}
                  icon={CATEGORY_EMOJIS[category.name] || '📦'}
                  onPress={() => console.log('Categoría:', category.name)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Ofertas únicas 🔥</Text>

          {loadingProducts ? (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => (
                <View key={product.id} className="w-[48%]">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compare_at_price}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { productId: product.id })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
