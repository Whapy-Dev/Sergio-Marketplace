import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Image, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { getOfficialStores } from '../../services/officialStores';
import type { OfficialStore } from '../../types/officialStore';
import { COLORS } from '../../constants/theme';

export default function HomeScreen({ navigation }: any) {
  const { categories, loading: loadingCategories, refresh: refreshCategories } = useCategories();
  const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [officialStores, setOfficialStores] = useState<OfficialStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    loadOfficialStores();
  }, []);

  async function loadOfficialStores() {
    setLoadingStores(true);
    const stores = await getOfficialStores(10);
    setOfficialStores(stores);
    setLoadingStores(false);
  }

  // Animación del header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_EXPANDED_HEIGHT = 280; // Altura total del header expandido
  const HEADER_COLLAPSED_HEIGHT = 70; // Altura compacta (igual a SearchScreen)

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshCategories(), refetchProducts(), loadOfficialStores()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Sticky Compacto */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          opacity: scrollY.interpolate({
            inputRange: [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT - 50, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
          }),
        }}
      >
        <LinearGradient
          colors={['#2563EB', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-b-[40px]"
          style={{ height: 70 }}
        >
          <SafeAreaView edges={['top']} className="flex-1">
            <View className="px-5 py-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">Inicio</Text>
              <View className="flex-row items-center">
                <TouchableOpacity className="mr-4" onPress={() => navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                  <Ionicons name="cart-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HERO SECTION - Animado */}
        <Animated.View
          style={{
            height: headerHeight,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#11CCEE', '#850910', '#FF450A']}
            locations={[0, 0.73, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 10,
              paddingBottom: 16,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              height: HEADER_EXPANDED_HEIGHT,
            }}
          >
          {/* Header con notificaciones y carrito */}
          <View className="flex-row items-center justify-between px-5 py-2">
            <Text className="text-base font-bold text-white">Inicio</Text>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4" onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de búsqueda */}
          <View className="px-4 mt-2 mb-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              className="bg-white rounded-full px-4 py-2 flex-row items-center justify-between"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-gray-400 flex-1 text-sm">Buscar producto</Text>
              <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center">
                <Ionicons name="search" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Banner "Hasta 40% OFF" */}
          <View className="px-4">
            <View className="relative" style={{ height: 160 }}>
              <View className="absolute left-0 top-3 z-10" style={{ maxWidth: '55%' }}>
                <Text className="text-white text-xl font-bold mb-1">
                  Hasta 40% OFF
                </Text>
                <Text className="text-white text-xs leading-4">
                  La manera más práctica de hacer tus compras del súper
                </Text>
              </View>
              <View className="absolute right-0 bottom-0" style={{ opacity: 0.3 }}>
                <Ionicons name="cart" size={110} color="white" />
              </View>
              {/* Indicadores de scroll */}
              <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                <View style={{ width: 24, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginHorizontal: 2 }} />
                <View style={{ width: 10, height: 3, backgroundColor: '#FFFFFF', borderRadius: 2, marginHorizontal: 2 }} />
                <View style={{ width: 24, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginHorizontal: 2 }} />
              </View>
            </View>
          </View>
        </LinearGradient>
        </Animated.View>

        {/* CATEGORÍAS */}
        <View className="bg-white py-5 px-5 mb-1">
          {loadingCategories ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {/* Ofertas */}
              <TouchableOpacity className="items-center mr-4">
                <View className="bg-yellow-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="pricetag" size={28} color="#EAB308" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Ofertas</Text>
              </TouchableOpacity>

              {/* Cupones */}
              <TouchableOpacity className="items-center mr-4">
                <View className="bg-blue-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="ticket" size={28} color="#3B82F6" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Cupones</Text>
              </TouchableOpacity>

              {/* Supermercado */}
              <TouchableOpacity className="items-center mr-4">
                <View className="bg-green-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="cart" size={28} color="#16A34A" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Supermercado</Text>
              </TouchableOpacity>

              {/* Celulares */}
              <TouchableOpacity className="items-center mr-4">
                <View className="bg-purple-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="phone-portrait" size={28} color="#9333EA" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Celulares</Text>
              </TouchableOpacity>

              {/* Ver más */}
              <TouchableOpacity className="items-center">
                <View className="bg-gray-200 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="add" size={28} color="#6B7280" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Ver más</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* TIENDAS OFICIALES */}
        <View className="bg-white py-5 mb-1">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-900">Tiendas Oficiales</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Verificadas y de confianza</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('OfficialStores')}>
              <Text className="text-blue-600 font-semibold text-sm">Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loadingStores ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : officialStores.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {officialStores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
                  className="mr-4"
                  style={{ width: 160 }}
                >
                  <View className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                    {/* Store Logo */}
                    <View className="bg-white items-center justify-center p-4" style={{ height: 120 }}>
                      {store.logo_url ? (
                        <Image
                          source={{ uri: store.logo_url }}
                          className="w-full h-full"
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name="storefront" size={48} color="#9CA3AF" />
                      )}
                    </View>

                    {/* Store Info */}
                    <View className="p-3">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={1}>
                          {store.store_name}
                        </Text>
                        <View className="bg-blue-100 rounded-full w-5 h-5 items-center justify-center">
                          <Ionicons name="checkmark" size={12} color="#3B82F6" />
                        </View>
                      </View>

                      {/* Rating */}
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text className="text-xs font-semibold text-gray-900 ml-1">
                          {store.rating.toFixed(1)}
                        </Text>
                        <Text className="text-xs text-gray-500 ml-1">
                          ({store.total_products})
                        </Text>
                      </View>

                      {/* Followers */}
                      <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-600 ml-1">
                          {store.followers_count} seguidores
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Ver más card */}
              <TouchableOpacity
                onPress={() => navigation.navigate('OfficialStores')}
                className="items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300"
                style={{ width: 160, height: 205 }}
              >
                <Ionicons name="add-circle-outline" size={48} color="#9CA3AF" />
                <Text className="text-sm font-semibold text-gray-600 mt-2">Ver más tiendas</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View className="px-4 py-8 items-center">
              <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No hay tiendas oficiales disponibles</Text>
            </View>
          )}
        </View>

        {/* BANNER PUBLICITARIO 1 */}
        <View className="px-4 mb-1">
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ height: 150 }}
          >
            <View style={{ maxWidth: '60%' }}>
              <Text className="text-white text-xs font-semibold mb-1 uppercase">
                HASTA EL 15 DE NOVIEMBRE
              </Text>
              <Text className="text-white text-lg font-bold leading-6">
                Grandes ofertas en electrodomésticos
              </Text>
            </View>
            <View className="absolute bottom-3 right-5" style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20
            }}>
              <Text className="font-bold" style={{ color: '#FF6B6B', fontSize: 24 }}>
                50%
              </Text>
            </View>
            {/* Indicadores de scroll */}
            <View className="absolute bottom-3 left-5 flex-row">
              <View style={{ width: 14, height: 3, backgroundColor: '#FFFFFF', borderRadius: 2, marginRight: 4 }} />
              <View style={{ width: 10, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginRight: 4 }} />
            </View>
          </LinearGradient>
        </View>

        {/* SELECCIONADOS PARA TI - Lista vertical */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Seleccionados para ti</Text>

          {loadingProducts ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : products.length > 0 ? (
            <View className="px-4">
              {products.slice(0, 4).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="flex-row bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden"
                  style={{ height: 151 }}
                >
                  {/* Imagen */}
                  <View className="bg-gray-100 items-center justify-center relative" style={{ width: 151 }}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={{ width: 151, height: 151 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="image-outline" size={50} color="#9CA3AF" />
                    )}
                    {index % 2 === 0 && (
                      <View
                        className="absolute top-2 left-2 rounded px-2 py-1"
                        style={{ backgroundColor: '#FF3B30' }}
                      >
                        <Text className="text-white text-xs font-bold">-20%</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                        {product.name}
                      </Text>

                      {/* Precio */}
                      <View className="mb-2">
                        <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                          ${product.price.toLocaleString('es-AR')}
                        </Text>
                        {index % 2 === 0 && (
                          <Text className="text-xs text-gray-500 line-through">
                            ${Math.round(product.price * 1.25).toLocaleString('es-AR')}
                          </Text>
                        )}
                      </View>

                      {/* Rating */}
                      <View className="flex-row items-center mb-2">
                        <View className="flex-row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name="star" size={12} color="#FBBF24" />
                          ))}
                        </View>
                        <Text className="text-xs text-gray-600 ml-2">
                          ({Math.floor(Math.random() * 500) + 100})
                        </Text>
                      </View>
                    </View>

                    {/* Envío gratis */}
                    {index % 3 !== 2 && (
                      <View className="bg-green-50 rounded px-2 py-1 self-start flex-row items-center">
                        <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                        <Text className="text-green-600 text-xs font-semibold ml-1">Envío GRATIS</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-center text-gray-500 py-8">No hay productos disponibles</Text>
          )}
        </View>

        {/* BANNER PUBLICITARIO 2 */}
        <View className="px-4 mb-1">
          <LinearGradient
            colors={['#1E5EBE', '#2563EB']}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ height: 150 }}
          >
            <View style={{ maxWidth: '65%' }}>
              <Text className="text-white text-xs font-semibold mb-1 uppercase">
                Special Offer
              </Text>
              <Text className="text-white text-lg font-bold leading-6">
                We make your life easier with our service
              </Text>
            </View>
            <View className="absolute bottom-3 right-5" style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20
            }}>
              <Text className="font-bold" style={{ color: '#1E5EBE', fontSize: 24 }}>
                30%
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* NUESTRAS TIENDAS - Categorías de marcas */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Nuestras tiendas</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {/* Philco */}
            <TouchableOpacity className="items-center mr-4">
              <View className="bg-red-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                <Text className="text-xl font-bold text-red-600">P</Text>
              </View>
              <Text className="text-xs text-gray-900 mt-1">Philco</Text>
            </TouchableOpacity>

            {/* Samsung */}
            <TouchableOpacity className="items-center mr-4">
              <View className="bg-blue-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                <Text className="text-xl font-bold text-blue-600">S</Text>
              </View>
              <Text className="text-xs text-gray-900 mt-1">Samsung</Text>
            </TouchableOpacity>

            {/* Sony */}
            <TouchableOpacity className="items-center mr-4">
              <View className="bg-gray-200 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                <Text className="text-xl font-bold text-gray-700">S</Text>
              </View>
              <Text className="text-xs text-gray-900 mt-1">Sony</Text>
            </TouchableOpacity>

            {/* Philips */}
            <TouchableOpacity className="items-center mr-4">
              <View className="bg-blue-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                <Text className="text-xl font-bold text-blue-700">P</Text>
              </View>
              <Text className="text-xs text-gray-900 mt-1">Philips</Text>
            </TouchableOpacity>

            {/* Hitachi */}
            <TouchableOpacity className="items-center">
              <View className="bg-red-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                <Text className="text-xl font-bold text-red-600">H</Text>
              </View>
              <Text className="text-xs text-gray-900 mt-1">Hitachi</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* PRODUCTOS CARRUSEL HORIZONTAL */}
        <View className="bg-white py-4 mb-1">
          {loadingProducts ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : products.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {products.slice(0, 3).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    {/* Imagen */}
                    <View className="bg-gray-100 items-center justify-center relative" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image
                          source={{ uri: product.image_url }}
                          style={{ width: 133, height: 133 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      )}
                      {index === 0 && (
                        <View
                          className="absolute top-2 right-2 rounded px-2 py-1"
                          style={{ backgroundColor: '#FF3B30' }}
                        >
                          <Text className="text-white text-xs font-bold">-15%</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>
                        {product.name}
                      </Text>

                      {/* Precio */}
                      <View className="mb-1">
                        <Text className="text-sm font-bold" style={{ color: COLORS.primary }}>
                          ${product.price.toLocaleString('es-AR')}
                        </Text>
                        {index === 0 && (
                          <Text className="text-xs text-gray-500 line-through">
                            ${Math.round(product.price * 1.18).toLocaleString('es-AR')}
                          </Text>
                        )}
                      </View>

                      {/* Rating */}
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>

                      {/* Botón comprar */}
                      <TouchableOpacity
                        className="mt-2 rounded-full py-2"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        <Text className="text-white text-xs font-semibold text-center">
                          Comprar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* NUESTROS ELEGIDOS DEL MOMENTO */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Nuestros elegidos del momento</Text>

          {loadingProducts ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : products.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {products.slice(0, 3).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <View className="bg-gray-100 items-center justify-center relative" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={{ width: 133, height: 133 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      )}
                      {index === 0 && (
                        <View className="absolute top-2 right-2 rounded px-2 py-1" style={{ backgroundColor: '#FF3B30' }}>
                          <Text className="text-white text-xs font-bold">-15%</Text>
                        </View>
                      )}
                    </View>
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>{product.name}</Text>
                      <View className="mb-1">
                        <Text className="text-sm font-bold" style={{ color: COLORS.primary }}>
                          ${product.price.toLocaleString('es-AR')}
                        </Text>
                        {index === 0 && (
                          <Text className="text-xs text-gray-500 line-through">
                            ${Math.round(product.price * 1.18).toLocaleString('es-AR')}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>
                      <TouchableOpacity className="mt-2 rounded-full py-2" style={{ backgroundColor: COLORS.primary }}>
                        <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* BANNER PUBLICITARIO 3 */}
        <View className="px-4 mb-1">
          <LinearGradient
            colors={['#10B981', '#34D399']}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ height: 150 }}
          >
            <View style={{ maxWidth: '65%' }}>
              <Text className="text-white text-xs font-semibold mb-1 uppercase">
                Cyber Monday
              </Text>
              <Text className="text-white text-lg font-bold leading-6">
                Las mejores ofertas del año
              </Text>
            </View>
            <View className="absolute bottom-3 right-5" style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20
            }}>
              <Text className="font-bold" style={{ color: '#10B981', fontSize: 24 }}>
                40%
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* NUESTROS PRODUCTOS */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Nuestros Productos</Text>

          {loadingProducts && products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {products.slice(0, 3).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <View className="bg-gray-100 items-center justify-center relative" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={{ width: 133, height: 133 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>{product.name}</Text>
                      <Text className="text-sm font-bold mb-1" style={{ color: COLORS.primary }}>
                        ${product.price.toLocaleString('es-AR')}
                      </Text>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>
                      <TouchableOpacity className="mt-2 rounded-full py-2" style={{ backgroundColor: COLORS.primary }}>
                        <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* LO MEJOR PARA EL HOGAR */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Lo mejor para el hogar</Text>

          {loadingProducts && products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {products.slice(3, 6).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <View className="bg-gray-100 items-center justify-center" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={{ width: 133, height: 133 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="home-outline" size={40} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>{product.name}</Text>
                      <Text className="text-sm font-bold mb-1" style={{ color: COLORS.primary }}>
                        ${product.price.toLocaleString('es-AR')}
                      </Text>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>
                      <TouchableOpacity className="mt-2 rounded-full py-2" style={{ backgroundColor: COLORS.primary }}>
                        <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* BANNER PUBLICITARIO 4 */}
        <View className="px-4 mb-1">
          <LinearGradient
            colors={['#F59E0B', '#FBBF24']}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ height: 150 }}
          >
            <View style={{ maxWidth: '65%' }}>
              <Text className="text-white text-xs font-semibold mb-1 uppercase">
                Último día
              </Text>
              <Text className="text-white text-lg font-bold leading-6">
                No te pierdas estas ofertas increíbles
              </Text>
            </View>
            <View className="absolute bottom-3 right-5" style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20
            }}>
              <Text className="font-bold" style={{ color: '#F59E0B', fontSize: 24 }}>
                60%
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* MARKETPLACE */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Marketplace</Text>

          {loadingProducts && products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {products.slice(0, 3).map((product: any) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <View className="bg-gray-100 items-center justify-center" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={{ width: 133, height: 133 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="storefront-outline" size={40} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>{product.name}</Text>
                      <Text className="text-sm font-bold mb-1" style={{ color: COLORS.primary }}>
                        ${product.price.toLocaleString('es-AR')}
                      </Text>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>
                      <TouchableOpacity className="mt-2 rounded-full py-2" style={{ backgroundColor: COLORS.primary }}>
                        <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* TAMBIÉN PUEDE INTERESARTE */}
        <View className="bg-white py-4 mb-1">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">También puede interesarte</Text>

          {loadingProducts && products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {products.slice(3, 6).map((product: any, index: number) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3"
                  style={{ width: 133 }}
                >
                  <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <View className="bg-gray-100 items-center justify-center relative" style={{ height: 133 }}>
                      {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={{ width: 133, height: 133 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="sparkles-outline" size={40} color="#9CA3AF" />
                      )}
                      {index === 0 && (
                        <View className="absolute top-2 right-2 rounded px-2 py-1" style={{ backgroundColor: '#FF3B30' }}>
                          <Text className="text-white text-xs font-bold">-25%</Text>
                        </View>
                      )}
                    </View>
                    <View className="p-2">
                      <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>{product.name}</Text>
                      <View className="mb-1">
                        <Text className="text-sm font-bold" style={{ color: COLORS.primary }}>
                          ${product.price.toLocaleString('es-AR')}
                        </Text>
                        {index === 0 && (
                          <Text className="text-xs text-gray-500 line-through">
                            ${Math.round(product.price * 1.33).toLocaleString('es-AR')}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={10} color="#FBBF24" />
                        ))}
                      </View>
                      <TouchableOpacity className="mt-2 rounded-full py-2" style={{ backgroundColor: COLORS.primary }}>
                        <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* FOOTER */}
        <View className="bg-gray-100 mt-4" style={{ borderTopLeftRadius: 70, borderTopRightRadius: 70, paddingBottom: 90 }}>
          {/* Atención al cliente */}
          <View className="px-5 pt-8 pb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Atención al cliente
            </Text>
            <Text className="text-base text-gray-900 mb-3">
              0800 123 456
            </Text>
            <Text className="text-sm text-gray-900 leading-5">
              Lunes a Viernes de 09:00 a 18:00{'\n'}
              Sábados de 9:00 a 13:00
            </Text>
          </View>

          {/* Newsletter */}
          <View className="px-5 pb-6">
            <Text className="text-sm text-gray-900 mb-3">
              Recibí ofertas y promociones
            </Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-white rounded-full px-5 py-3 text-sm"
                placeholder="Ingresá tu email"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-1 rounded-full px-6 py-2"
                style={{
                  backgroundColor: email ? COLORS.primary : '#D1D5DB',
                }}
                disabled={!email}
              >
                <LinearGradient
                  colors={email ? ['#2563EB', '#DC2626'] : ['#D1D5DB', '#D1D5DB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text className="text-white text-sm font-medium">
                    Suscribirme
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}
