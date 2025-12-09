import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, RefreshControl, Image, TextInput, Animated, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CATEGORY_3D_ICONS } from '../../constants/categoryIcons';

export default function HomeScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
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

  // Animación del header - valores fijos para mejor rendimiento
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_EXPANDED_HEIGHT = 260 + insets.top; // Altura total incluyendo safe area
  const HEADER_COLLAPSED_HEIGHT = 56 + insets.top; // Altura compacta con safe area
  const SCROLL_DISTANCE = HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT;

  // Interpolaciones optimizadas
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  // Opacidad del header sticky (aparece cuando se colapsa)
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [SCROLL_DISTANCE - 60, SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Opacidad del contenido expandido (desaparece al hacer scroll)
  const expandedContentOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.5],
    outputRange: [1, 0],
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
      {/* StatusBar transparente para el header con gradiente */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header Sticky Compacto - aparece al hacer scroll */}
      <Animated.View
        pointerEvents={stickyHeaderOpacity.interpolate({
          inputRange: [0, 0.5],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }) as any > 0.5 ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          opacity: stickyHeaderOpacity,
        }}
      >
        <LinearGradient
          colors={['#2563EB', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingTop: insets.top,
            paddingBottom: 12,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <View className="px-5 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Inicio</Text>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4 p-1" onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="p-1" onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
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
            progressViewOffset={insets.top}
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
              paddingTop: insets.top,
              paddingBottom: 16,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              height: HEADER_EXPANDED_HEIGHT,
            }}
          >
          {/* Header con notificaciones y carrito */}
          <View className="flex-row items-center justify-between px-5 py-2">
            <Text className="text-lg font-bold text-white">Inicio</Text>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4 p-1" onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="p-1" onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de búsqueda - se desvanece al hacer scroll */}
          <Animated.View
            className="px-4 mt-2 mb-3"
            style={{ opacity: expandedContentOpacity }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              className="bg-white rounded-full px-4 py-3 flex-row items-center justify-between"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-gray-400 flex-1 text-base">Buscar producto</Text>
              <View className="bg-orange-500 rounded-full w-9 h-9 items-center justify-center">
                <Ionicons name="search" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Hero estático - se desvanece al hacer scroll */}
          <Animated.View
            className="px-4 flex-1"
            style={{ opacity: expandedContentOpacity }}
          >
            <View className="relative flex-1">
              <View className="absolute left-0 top-3 z-10" style={{ maxWidth: '60%' }}>
                <Text className="text-white text-2xl font-bold mb-2">
                  Hasta 40% OFF
                </Text>
                <Text className="text-white text-sm leading-5">
                  La manera más práctica de hacer tus compras del súper
                </Text>
              </View>
              <View className="absolute right-0 bottom-2" style={{ opacity: 0.25 }}>
                <Ionicons name="cart" size={120} color="white" />
              </View>
            </View>
          </Animated.View>
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
              {/* Ofertas - siempre visible con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { filter: 'offers' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.ofertas.source}
                    style={{ width: CATEGORY_3D_ICONS.ofertas.size, height: CATEGORY_3D_ICONS.ofertas.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Ofertas</Text>
              </TouchableOpacity>

              {/* Supermercado con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { categoryName: 'Supermercado' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.supermercado.source}
                    style={{ width: CATEGORY_3D_ICONS.supermercado.size, height: CATEGORY_3D_ICONS.supermercado.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Supermercado</Text>
              </TouchableOpacity>

              {/* Tecnología con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { categoryName: 'Tecnología' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.tecnologia.source}
                    style={{ width: CATEGORY_3D_ICONS.tecnologia.size, height: CATEGORY_3D_ICONS.tecnologia.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Tecnología</Text>
              </TouchableOpacity>

              {/* Moda con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { categoryName: 'Moda' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.moda.source}
                    style={{ width: CATEGORY_3D_ICONS.moda.size, height: CATEGORY_3D_ICONS.moda.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Moda</Text>
              </TouchableOpacity>

              {/* Hogar con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { categoryName: 'Hogar' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.hogar.source}
                    style={{ width: CATEGORY_3D_ICONS.hogar.size, height: CATEGORY_3D_ICONS.hogar.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Hogar</Text>
              </TouchableOpacity>

              {/* Deportes con icono 3D */}
              <TouchableOpacity
                className="items-center mr-4"
                onPress={() => navigation.navigate('Search', { categoryName: 'Deportes' })}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS.deportes.source}
                    style={{ width: CATEGORY_3D_ICONS.deportes.size, height: CATEGORY_3D_ICONS.deportes.size }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xs text-gray-900 mt-1">Deportes</Text>
              </TouchableOpacity>

              {/* Ver más con icono 3D */}
              <TouchableOpacity
                className="items-center"
                onPress={() => navigation.navigate('Categories')}
              >
                <View className="items-center justify-center" style={{ width: 60, height: 60 }}>
                  <Image
                    source={CATEGORY_3D_ICONS['ver-mas'].source}
                    style={{ width: CATEGORY_3D_ICONS['ver-mas'].size, height: CATEGORY_3D_ICONS['ver-mas'].size }}
                    resizeMode="contain"
                  />
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
        <View className="bg-gray-100 mt-4" style={{ borderTopLeftRadius: 70, borderTopRightRadius: 70, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}>
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
