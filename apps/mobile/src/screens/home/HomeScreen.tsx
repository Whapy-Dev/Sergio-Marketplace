import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { COLORS } from '../../constants/theme';
import CategoryItem from '../../components/home/CategoryItem';
import ProductCard from '../../components/home/ProductCard';
import Footer from '../../components/common/Footer';

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

const BANNERS = [
  {
    id: 1,
    title: 'Hasta 40% OFF',
    subtitle: 'La manera más práctica\nde hacer tus compras\ndel súper',
    emoji: '🛒',
  },
  {
    id: 2,
    title: 'Envío Gratis',
    subtitle: 'En todas tus\ncompras',
    emoji: '🚚',
  },
  {
    id: 3,
    title: 'Nuevos Productos',
    subtitle: 'Las últimas novedades\nde la semana',
    emoji: '✨',
  },
];

export default function HomeScreen({ navigation }: any) {
  const { categories, loading: loadingCategories, refresh: refreshCategories } = useCategories();
  const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [productsIndex, setProductsIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const productsScrollRef = useRef<ScrollView>(null);

  // Auto-scroll del carrusel de banners
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNERS.length;
        
        scrollViewRef.current?.scrollTo({
          y: nextIndex * 220,
          animated: true,
        });
        
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll del carrusel de productos
  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setProductsIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % Math.min(products.length, 5);
        
        productsScrollRef.current?.scrollTo({
          y: nextIndex * 140,
          animated: true,
        });
        
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [products.length]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshCategories(), refetchProducts()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
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
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white text-base font-semibold mr-1">Dirección 123</Text>
              <Text className="text-white text-sm">▼</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4">
                <Text className="text-white text-2xl">🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
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

          {/* Carrusel vertical de banners */}
          <View style={{ height: 220, overflow: 'hidden' }}>
            <ScrollView
              ref={scrollViewRef}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event) => {
                const slideIndex = Math.round(event.nativeEvent.contentOffset.y / 220);
                setBannerIndex(slideIndex);
              }}
            >
              {BANNERS.map((banner) => (
                <View key={banner.id} className="px-4 pb-6" style={{ height: 220 }}>
                  <View className="flex-1 relative">
                    <View className="absolute left-2 top-4 z-10">
                      <Text className="text-white text-3xl font-bold mb-2" style={{ lineHeight: 36 }}>
                        {banner.title}
                      </Text>
                      <Text className="text-white text-sm leading-5 opacity-95">
                        {banner.subtitle}
                      </Text>
                    </View>
                    <View className="absolute right-0 bottom-0">
                      <Text style={{ fontSize: 140 }}>{banner.emoji}</Text>
                    </View>
                    <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                      {BANNERS.map((_, index) => (
                        <View
                          key={index}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            marginHorizontal: 4,
                            backgroundColor: index === bannerIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
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
              {categories.slice(0, 5).map((category: any) => (
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

        {/* Ofertas únicas - CARRUSEL VERTICAL ESTILO ML */}
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
            <View style={{ height: 280, position: 'relative' }} className="px-4">
              <ScrollView
                ref={productsScrollRef}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                  const slideIndex = Math.round(event.nativeEvent.contentOffset.y / 90);
                  setProductsIndex(slideIndex);
                }}
              >
                {products.slice(0, 5).map((product: any, index: number) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                    style={{ height: 90, marginBottom: 8 }}
                  >
                    {/* Layout horizontal: imagen izq + info derecha */}
                    <View className="flex-row bg-white rounded-xl overflow-hidden border border-gray-200">
                      {/* Imagen izquierda */}
                      <View className="w-24 bg-gray-100 items-center justify-center">
                        {product.image_url ? (
                          <Image
                            source={{ uri: product.image_url }}
                            style={{ width: 96, height: 82 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 36 }}>📦</Text>
                        )}
                        {index % 3 === 0 && (
                          <View 
                            className="absolute top-1 left-1 rounded px-1.5 py-0.5"
                            style={{ backgroundColor: COLORS.primary }}
                          >
                            <Text className="text-white text-[9px] font-bold">30% OFF</Text>
                          </View>
                        )}
                      </View>

                      {/* Info derecha */}
                      <View className="flex-1 p-2 justify-between">
                        <View>
                          <Text className="text-xs font-semibold text-gray-900 mb-0.5" numberOfLines={2}>
                            {product.name}
                          </Text>
                          {index % 3 === 0 && (
                            <Text className="text-[10px] text-gray-500 line-through mb-0.5">
                              ${Math.round(product.price * 1.7).toLocaleString('es-AR')}
                            </Text>
                          )}
                          <Text className="text-base font-bold mb-0.5" style={{ color: COLORS.primary }}>
                            ${product.price.toLocaleString('es-AR')}
                          </Text>
                        </View>
                        {index % 2 === 0 && (
                          <View className="bg-green-50 rounded px-1.5 py-0.5 self-start">
                            <Text className="text-green-600 text-[9px] font-semibold">✓ Envío GRATIS</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Indicadores VERTICALES a la derecha */}
              <View className="absolute right-2 top-0 bottom-0 justify-center">
                {products.slice(0, 5).map((_, index: number) => (
                  <View
                    key={index}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      marginVertical: 3,
                      backgroundColor: index === productsIndex ? '#FFD700' : '#D1D5DB',
                    }}
                  />
                ))}
              </View>
            </View>
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

        {/* 🎯 FOOTER AGREGADO AQUÍ 🎯 */}
        <Footer 
          showNewsletter={true}
          showSocialMedia={true}
          showLinks={true}
          backgroundColor="#F9FAFB"
        />
      </ScrollView>
    </View>
  );
}