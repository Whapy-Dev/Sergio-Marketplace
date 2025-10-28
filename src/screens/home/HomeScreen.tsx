import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { COLORS } from '../../constants/theme';
import CategoryItem from '../../components/home/CategoryItem';
import ProductCard from '../../components/home/ProductCard';

const CATEGORY_EMOJIS: { [key: string]: string } = {
  'Electrónica': '📱',
  'Moda': '👗',
  'Hogar': '🏠',
  'Deportes': '⚽',
  'Juguetes': '🧸',
  'Belleza': '💄',
  'Libros': '📚',
  'Supermercado': '🛒',
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Electrónica': '#FFD700',
  'Moda': '#11CCEE',
  'Hogar': '#FF69B4',
  'Deportes': '#1E5EBE',
  'Juguetes': '#FFD700',
  'Belleza': '#FF69B4',
  'Libros': '#11CCEE',
  'Supermercado': '#00A650',
};

export default function HomeScreen({ navigation }: any) {
  const { categories, loading: loadingCategories } = useCategories();
  const { products, loading: loadingProducts } = useProducts();
  const [bannerIndex, setBannerIndex] = useState(0);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header con gradiente completo */}
        <LinearGradient
          colors={['#11CCEE', '#850910', '#FF450A']}
          locations={[0, 0.73, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ 
            paddingTop: 50,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: 'hidden',
          }}
        >
          {/* Logo y notificaciones */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white text-base font-semibold mr-1">Dirección 123</Text>
              <Text className="text-white text-sm">▼</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4">
                <Text className="text-white text-2xl">🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-white text-2xl">🛒</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de búsqueda */}
          <View className="px-4 mb-5">
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              className="bg-white rounded-full px-4 py-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-gray-400 text-base mr-2">🔍</Text>
              <Text className="text-gray-400 flex-1 text-sm">Buscar producto</Text>
            </TouchableOpacity>
          </View>

          {/* Contenido del banner */}
          <View className="px-4 pb-6">
            <View className="relative" style={{ height: 190 }}>
              {/* Texto */}
              <View className="absolute left-2 top-4 z-10">
                <Text className="text-white text-3xl font-bold mb-2" style={{ lineHeight: 36 }}>
                  Hasta 40% OFF
                </Text>
                <Text className="text-white text-sm leading-5 opacity-95">
                  La manera más práctica{'\n'}de hacer tus compras{'\n'}del súper
                </Text>
              </View>

              {/* Ilustración del carrito */}
              <View className="absolute right-0 bottom-0">
                <Text style={{ fontSize: 140 }}>🛒</Text>
                <Text style={{ fontSize: 48, position: 'absolute', top: 25, left: 35 }}></Text>
                <Text style={{ fontSize: 40, position: 'absolute', top: 40, left: 62 }}></Text>
                <Text style={{ fontSize: 38, position: 'absolute', top: 55, left: 40 }}></Text>
              </View>

              {/* Dots indicador */}
              <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                {[].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                      backgroundColor: i === bannerIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Categorías */}
        <View className="bg-white py-4 mb-1">
          {loadingCategories ? (
            <View className="py-8">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {categories.slice(0, 5).map((category) => (
                <View key={category.id} style={{ marginRight: 12 }}>
                  <CategoryItem
                    emoji={CATEGORY_EMOJIS[category.name] || '📦'}
                    label={category.name}
                    color={CATEGORY_COLORS[category.name] || '#11CCEE'}
                    onPress={() => navigation.navigate('CategoryProducts', { 
                      categoryId: category.id,
                      categoryName: category.name 
                    })}
                  />
                </View>
              ))}
              <CategoryItem
                emoji="➕"
                label="Ver más"
                color="#E5E7EB"
                onPress={() => navigation.navigate('Categories')}
              />
            </ScrollView>
          )}
        </View>

        {/* Ofertas únicas */}
        <View className="bg-white pt-4 pb-4 mb-1">
          <View className="px-4 mb-3">
            <View 
              className="px-6 py-2 rounded-full items-center" 
              style={{ backgroundColor: '#11CCEE', alignSelf: 'stretch' }}
            >
              <Text className="text-white text-base font-bold">Ofertas únicas 🔥</Text>
            </View>
          </View>

          {loadingProducts ? (
            <View className="py-8">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : products.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
            >
              {products.slice(0, 10).map((product, index) => (
                <View key={product.id} style={{ marginRight: 12 }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.image_url}
                    originalPrice={index % 3 === 0 ? Math.round(product.price * 1.7) : undefined}
                    discount={index % 3 === 0 ? 30 : undefined}
                    hasFreeShipping={index % 2 === 0}
                    hasInstallments={index % 4 === 0}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="px-4">
              <Text className="text-center text-gray-500 py-8">
                No hay productos disponibles
              </Text>
            </View>
          )}
        </View>

        {/* Banner electrodomésticos */}
        <View className="px-4 my-2">
          <LinearGradient
            colors={['#1E5EBE', '#1545A0']}
            className="rounded-3xl p-5"
            style={{ minHeight: 130 }}
          >
            <Text className="text-white text-[10px] font-semibold mb-1">
              ¡HASTA EL 15 DE NOVIEMBRE!
            </Text>
            <Text className="text-white text-xl font-bold mb-2">
              Grandes ofertas en{'\n'}electrodomésticos
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-sm mr-2">HASTA</Text>
              <Text className="font-bold" style={{ color: '#FFD700', fontSize: 44, lineHeight: 44 }}>
                50%
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}