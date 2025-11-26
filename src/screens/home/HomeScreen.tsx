import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Image, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { getOfficialStores } from '../../services/officialStores';
import type { OfficialStore } from '../../types/officialStore';
import { getActiveBanners, type Banner } from '../../services/banners';
import { getHomeSections, HomeSection } from '../../services/homeSections';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import BannerCard from '../../components/BannerCard';
import DynamicSection from '../../components/home/DynamicSection';
import { COLORS } from '../../constants/theme';
import { scale, verticalScale, moderateScale, wp } from '../../utils/responsive';

export default function HomeScreen({ navigation, route }: any) {
  const { categories, loading: loadingCategories, refresh: refreshCategories } = useCategories();
  const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [officialStores, setOfficialStores] = useState<OfficialStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const scrollViewRef = useRef<any>(null);

  // Scroll to top when tab is pressed
  useEffect(() => {
    if (route?.params?.scrollToTop) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [route?.params?.scrollToTop]);

  useEffect(() => {
    loadOfficialStores();
    loadBanners();
    loadHomeSections();
  }, []);

  async function loadHomeSections() {
    setLoadingSections(true);
    const sections = await getHomeSections();
    setHomeSections(sections);
    setLoadingSections(false);
  }

  async function loadOfficialStores() {
    setLoadingStores(true);
    const stores = await getOfficialStores(10);
    setOfficialStores(stores);
    setLoadingStores(false);
  }

  async function loadBanners() {
    setLoadingBanners(true);
    const activeBanners = await getActiveBanners(6); // Máximo 6 banners
    setBanners(activeBanners);
    setLoadingBanners(false);
  }

  // Banners solo en posiciones intermedias (configurables desde CRM)
  // Todos los banners activos se distribuyen entre las secciones
  const banner1 = banners[0]; // Después de Tiendas Oficiales
  const banner2 = banners[1]; // Después de Nuestros elegidos
  const banner3 = banners[2]; // Después de productos
  const banner4 = banners[3]; // Otro más si existe
  const banner5 = banners[4]; // Otro más si existe
  const banner6 = banners[5]; // Otro más si existe

  // Animación del header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_EXPANDED_HEIGHT = verticalScale(280); // Altura total del header expandido
  const HEADER_COLLAPSED_HEIGHT = verticalScale(70); // Altura compacta (igual a SearchScreen)

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
      await Promise.all([refreshCategories(), refetchProducts(), loadOfficialStores(), loadBanners(), loadHomeSections()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }

  function handleProductPress(productId: string) {
    navigation.navigate('ProductDetail', { productId });
  }

  function handleBannerPress(banner: Banner) {
    if (banner.link_type === 'none' || !banner.link_value) return;

    switch (banner.link_type) {
      case 'product':
        navigation.navigate('ProductDetail', { productId: banner.link_value });
        break;
      case 'store':
        navigation.navigate('StoreDetail', { storeId: banner.link_value });
        break;
      case 'category':
        navigation.navigate('Search', { category: banner.link_value });
        break;
      case 'external':
        // For external links, you could open with Linking.openURL
        console.log('External link:', banner.link_value);
        break;
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
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
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

          {/* Hero estático - sin banners */}
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
              {/* Ofertas - siempre visible */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { filter: 'offers' })}
              >
                <View className="bg-yellow-100 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                  <Ionicons name="pricetag" size={28} color="#EAB308" />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Ofertas</Text>
              </TouchableOpacity>

              {/* Categorías reales de la DB */}
              {categories.slice(0, 6).map((category: any) => (
                <TouchableOpacity
                  key={category.id}
                  className="items-center mr-4"
                  onPress={() => navigation.navigate('Search', { categoryId: category.id, categoryName: category.name })}
                >
                  <View
                    className="rounded-full items-center justify-center"
                    style={{
                      width: 55,
                      height: 55,
                      backgroundColor: category.color ? `${category.color}20` : '#F3F4F6'
                    }}
                  >
                    <Ionicons
                      name={(category.icon as any) || 'grid-outline'}
                      size={28}
                      color={category.color || '#6B7280'}
                    />
                  </View>
                  <Text className="text-xs text-gray-900 mt-1" numberOfLines={1} style={{ maxWidth: 60 }}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Ver más */}
              {categories.length > 6 && (
                <TouchableOpacity
                  className="items-center"
                  onPress={() => navigation.navigate('Categories')}
                >
                  <View className="bg-gray-200 rounded-full items-center justify-center" style={{ width: 55, height: 55 }}>
                    <Ionicons name="add" size={28} color="#6B7280" />
                  </View>
                  <Text className="text-xs text-gray-900 mt-1">Ver más</Text>
                </TouchableOpacity>
              )}
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

        {/* BANNER DINÁMICO 1 - Después de Tiendas Oficiales */}
        {banner1 && (
          <View className="px-4">
            <BannerCard banner={banner1} onPress={handleBannerPress} />
          </View>
        )}

        {/* SECCIONES DINÁMICAS DESDE CRM */}
        {loadingSections ? (
          <View className="py-8">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : homeSections.length > 0 ? (
          <>
            {homeSections.map((section, index) => (
              <React.Fragment key={section.id}>
                <DynamicSection
                  section={section}
                  onProductPress={handleProductPress}
                />
                {/* Insertar banners entre secciones */}
                {index === 0 && banner2 && (
                  <View className="px-4">
                    <BannerCard banner={banner2} onPress={handleBannerPress} />
                  </View>
                )}
                {index === 2 && banner3 && (
                  <View className="px-4">
                    <BannerCard banner={banner3} onPress={handleBannerPress} />
                  </View>
                )}
                {index === 4 && banner4 && (
                  <View className="px-4">
                    <BannerCard banner={banner4} onPress={handleBannerPress} />
                  </View>
                )}
              </React.Fragment>
            ))}
          </>
        ) : (
          /* FALLBACK - Secciones estáticas si no hay configuración */
          <View className="bg-white py-4 mb-1">
            <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Seleccionados para ti</Text>
            {loadingProducts ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : products.length > 0 ? (
              <View className="px-4">
                {products.slice(0, 4).map((product: any, index: number) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleProductPress(product.id)}
                    className="flex-row bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden"
                    style={{ height: 151 }}
                  >
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
                    </View>
                    <View className="flex-1 p-3 justify-between">
                      <View>
                        <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                          ${product.price.toLocaleString('es-AR')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text className="text-center text-gray-500 py-8">No hay productos disponibles</Text>
            )}
          </View>
        )}

        {/* BANNER DINÁMICO 5 - Antes del Footer */}
        {banner6 && (
          <View className="px-4 mt-1 mb-4">
            <BannerCard banner={banner6} onPress={handleBannerPress} />
          </View>
        )}

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
