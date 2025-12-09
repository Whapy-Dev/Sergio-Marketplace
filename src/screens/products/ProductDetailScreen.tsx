import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, FlatList, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { getOrCreateConversation } from '../../services/chat';
import {
  getProductVariants,
  findVariantByOptions,
  getVariantDisplayImage,
  VariantType,
  ProductVariant as VariantData
} from '../../services/variants';
import { getProductReviews, getProductReviewStats, Review, ReviewStats } from '../../services/reviews';
import Button from '../../components/common/Button';
import AddToListModal from '../../components/favorites/AddToListModal';
import VariantSelector from '../../components/product/VariantSelector';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale, wp } from '../../utils/responsive';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [showAddToListModal, setShowAddToListModal] = useState(false);

  // Variant system
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<VariantData | undefined>(undefined);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  const { addItem: addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();

  // Get display image based on selected variant
  const displayImage = getVariantDisplayImage(selectedVariant, product?.image_url);

  // Images for carousel - use variant images if available
  const productImages = selectedVariant?.images?.length
    ? selectedVariant.images.map(img => img.image_url)
    : product ? [product.image_url] : [];

  // Get effective price and stock
  const effectivePrice = selectedVariant?.price || product?.price || 0;
  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const effectiveComparePrice = selectedVariant?.compare_at_price || product?.compare_at_price;

  useEffect(() => {
    loadProduct();
    loadRelatedProducts();
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    try {
      const [reviewsData, statsData] = await Promise.all([
        getProductReviews(productId, { limit: 5, sortBy: 'recent' }),
        getProductReviewStats(productId)
      ]);
      setReviews(reviewsData);
      setReviewStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  async function loadProduct() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          sellers(store_name, id)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error loading product:', error);
        Alert.alert('Error', 'No se pudo cargar el producto');
        navigation.goBack();
        return;
      }

      setProduct(data);

      // Load variants
      loadVariants();

      // Load products from same store
      if (data.seller_id) {
        loadStoreProducts(data.seller_id, data.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVariants() {
    const { variantTypes: types, variants: vars } = await getProductVariants(productId);
    setVariantTypes(types);
    setVariants(vars);

    // Auto-select first options if variants exist
    if (types.length > 0 && vars.length > 0) {
      const initialOptions: Record<string, string> = {};
      types.forEach(type => {
        if (type.options && type.options.length > 0) {
          initialOptions[type.name] = type.options[0].value;
        }
      });
      setSelectedOptions(initialOptions);

      // Find matching variant
      const matchingVariant = findVariantByOptions(vars, initialOptions);
      setSelectedVariant(matchingVariant);
    }
  }

  function handleSelectOption(typeName: string, value: string) {
    const newOptions = { ...selectedOptions, [typeName]: value };
    setSelectedOptions(newOptions);

    // Find matching variant
    const matchingVariant = findVariantByOptions(variants, newOptions);
    setSelectedVariant(matchingVariant);
    setCurrentImageIndex(0);
  }

  async function loadStoreProducts(sellerId: string, currentProductId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .neq('id', currentProductId)
        .limit(5);

      if (!error && data) {
        setStoreProducts(data);
      }
    } catch (error) {
      console.error('Error loading store products:', error);
    }
  }

  async function handleContactSeller() {
    if (!user) {
      Alert.alert(
        'Iniciar sesión',
        'Necesitas iniciar sesión para contactar al vendedor',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }

    if (!product?.seller_id) {
      Alert.alert('Error', 'No se encontró información del vendedor');
      return;
    }

    // Don't allow seller to contact themselves
    if (user.id === product.seller_id) {
      Alert.alert('Info', 'Este es tu propio producto');
      return;
    }

    try {
      const conversation = await getOrCreateConversation(user.id, product.seller_id, productId);
      if (conversation) {
        navigation.navigate('Chat', { conversationId: conversation.id });
      } else {
        Alert.alert('Error', 'No se pudo iniciar la conversación');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'No se pudo contactar al vendedor');
    }
  }

  async function loadRelatedProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .neq('id', productId)
        .limit(5);

      if (!error && data) {
        setRelatedProducts(data);
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    // Check if product has variants but none selected
    if (variantTypes.length > 0 && !selectedVariant) {
      Alert.alert('Selecciona una variante', 'Por favor selecciona todas las opciones antes de agregar al carrito');
      return;
    }

    // Check stock
    if (effectiveStock <= 0) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible');
      return;
    }

    // Build product name with variant info
    let productName = product.name;
    if (selectedVariant && Object.keys(selectedOptions).length > 0) {
      const optionValues = Object.values(selectedOptions).join(' - ');
      productName = `${product.name} (${optionValues})`;
    }

    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: productName,
      price: effectivePrice,
      imageUrl: displayImage || product.image_url,
      sellerId: product.seller_id,
    }, quantity);

    Alert.alert(
      '¡Agregado!',
      `${productName} se agregó al carrito`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  }

  function handleToggleFavorite() {
    if (!product) return;
    toggleFavorite(product.id);
  }

  async function handleContactSeller() {
    if (!user || !product) {
      Alert.alert('Error', 'Debes iniciar sesión para contactar al vendedor');
      return;
    }

    if (user.id === product.seller_id) {
      Alert.alert('Info', 'No puedes contactarte a ti mismo');
      return;
    }

    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        product.seller_id,
        product.id
      );

      if (conversationId) {
        navigation.navigate('Chat', { conversationId });
      } else {
        Alert.alert('Error', 'No se pudo iniciar la conversación');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error al contactar al vendedor');
    }
  }

  function handleSubscribe() {
    if (email) {
      Alert.alert('¡Suscrito!', 'Te has suscrito exitosamente a nuestro newsletter');
      setEmail('');
    }
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
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-600">Producto no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const discount = effectiveComparePrice
    ? Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)
    : 0;

  const priceWithoutTax = Math.round(effectivePrice / 1.21 * 100) / 100;
  const favorite = isFavorite(product.id);

  const renderProductCard = ({ item }: any) => {
    const itemDiscount = item.compare_at_price
      ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
      : 0;
    const itemPriceWithoutTax = Math.round(item.price / 1.21 * 100) / 100;

    return (
      <TouchableOpacity
        className="mr-5 w-[133px]"
        onPress={() => navigation.push('ProductDetail', { productId: item.id })}
      >
        <View className="bg-gray-100 rounded-lg overflow-hidden mb-2">
          <Image
            source={{ uri: item.image_url }}
            className="w-[133px] h-[133px]"
            resizeMode="cover"
          />
          {item.free_shipping && (
            <View className="absolute bottom-0 left-0 right-0 bg-green-600/80 px-2 py-1">
              <Text className="text-white text-[10px] text-center">
                Envío <Text className="font-bold">GRATIS</Text>
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs font-medium text-gray-900 mb-1 h-8" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center mb-1">
          {itemDiscount > 0 && (
            <>
              <View className="bg-primary rounded px-2 py-0.5 mr-2">
                <Text className="text-white text-[10px] font-medium">{itemDiscount}% OFF</Text>
              </View>
              <Text className="text-[12px] text-gray-400 line-through">
                ${item.compare_at_price?.toLocaleString()}
              </Text>
            </>
          )}
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-0.5">
          ${item.price.toLocaleString()}
        </Text>
        <Text className="text-[10px] text-gray-500">
          Precio sin imp. nac. ${itemPriceWithoutTax.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header con gradiente */}
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
        <View className="px-5 py-2 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-4 p-1">
              <Ionicons name="notifications-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} className="mr-4 p-1">
              <Ionicons name="cart-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite} className="p-1">
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={26}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Breadcrumb */}
        <View className="px-5 py-4 bg-gray-50 rounded-[20px] mx-5 mt-3">
          <View className="flex-row items-center">
            <Ionicons name="chevron-back" size={scale(14)} color="#000" />
            <Text className="text-sm text-gray-500 ml-2">
              {product.categories?.name || 'Categoría'} / {product.name.split(' ')[0]}
            </Text>
          </View>
        </View>

        {/* Carrusel de imágenes del producto */}
        <View className="mt-5">
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={{ width: width - scale(40), height: verticalScale(359) }} className="mx-5">
                <Image
                  source={{ uri: item }}
                  className="w-full h-full rounded-2xl"
                  resizeMode="contain"
                />
                {/* Botoncito minimalista para agregar a lista */}
                <TouchableOpacity
                  className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: scale(2) },
                    shadowOpacity: 0.1,
                    shadowRadius: scale(4),
                    elevation: 3
                  }}
                  onPress={() => {
                    if (!user) {
                      Alert.alert('Inicia sesión', 'Debes iniciar sesión para agregar productos a listas');
                      return;
                    }
                    setShowAddToListModal(true);
                  }}
                >
                  <Ionicons name="bookmarks-outline" size={scale(16)} color="#000" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => `image-${index}`}
          />
          {/* Scroll Indicator */}
          <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
            <View className="bg-white/20 rounded-full px-2 py-1 flex-row">
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: scale(24),
                    height: scale(8),
                    borderRadius: scale(50),
                    marginHorizontal: scale(4),
                    backgroundColor: index === currentImageIndex ? '#D9D9D9' : 'rgba(217, 217, 217, 0.5)'
                  }}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Datos principales del producto */}
        <View className="px-5 mt-4">
          {/* Logo de marca - placeholder vacío */}
          <View className="border border-gray-200 rounded-lg w-10 h-10 items-center justify-center mb-4">
            {/* Logo se mostraría aquí si existiera en la BD */}
          </View>

          {/* Nombre del producto */}
          <Text className="text-[22px] font-semibold text-gray-900 mb-2">
            {product.name}
          </Text>

          {/* Vendido por */}
          <View className="flex-row items-center mb-4">
            <Text className="text-base text-gray-900">Vendido por </Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.primary }}>
              {product.sellers?.store_name || 'Vendedor'}
            </Text>
          </View>

          {/* Precio anterior tachado y badge de descuento */}
          {effectiveComparePrice && discount > 0 && (
            <View className="flex-row items-center mb-2">
              <Text className="text-xl text-gray-400 line-through mr-2">
                ${effectiveComparePrice.toLocaleString()}
              </Text>
              <LinearGradient
                colors={['#2563EB', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded px-3 py-1"
              >
                <Text className="text-white text-sm font-medium">{discount}% OFF</Text>
              </LinearGradient>
            </View>
          )}

          {/* Precio principal */}
          <Text className="text-2xl font-semibold text-gray-900 mb-1">
            ${effectivePrice.toLocaleString()}
          </Text>

          {/* Precio sin impuestos */}
          <Text className="text-xs text-gray-500 mb-4">
            Precio sin imp. nac. ${priceWithoutTax.toLocaleString()}
          </Text>

          {/* Stock indicator */}
          {effectiveStock <= 5 && effectiveStock > 0 && (
            <Text className="text-sm text-orange-600 mb-2">
              ¡Solo quedan {effectiveStock} unidades!
            </Text>
          )}
          {effectiveStock === 0 && (
            <Text className="text-sm text-red-600 mb-2">
              Sin stock
            </Text>
          )}
        </View>

        {/* Promociones bancarias */}
        <View className="border-t border-gray-200 px-5 py-4">
          <Text className="text-base font-medium text-gray-900 mb-3">
            ¡Nuestras promociones bancarias!
          </Text>

          {/* Tarjeta Yo Compro */}
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-5 bg-gray-200 rounded mr-2 items-center justify-center">
              <Ionicons name="card-outline" size={12} color="#6B7280" />
            </View>
            <Text className="text-base font-medium" style={{ color: COLORS.primary }}>
              6 Cuotas Yo Compro Crédito
            </Text>
          </View>

          {/* 3 cuotas sin interés */}
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-green-700">
              <Text className="font-semibold">3</Text> cuotas sin interés de ${Math.round(product.price / 3).toLocaleString()}
            </Text>
            <View className="flex-row">
              <View className="border border-gray-200 rounded w-9 h-6 items-center justify-center mr-1">
                <Text className="text-[8px]">MC</Text>
              </View>
              <View className="border border-gray-200 rounded w-9 h-6 items-center justify-center">
                <Text className="text-[8px]">VISA</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="mt-2">
            <Text className="text-base" style={{ color: COLORS.primary }}>
              Ver todos los medios de pago
            </Text>
          </TouchableOpacity>
        </View>

        {/* Envíos */}
        <View className="border-t border-b border-gray-200 px-5 py-4">
          {/* Envío a domicilio */}
          <View className="flex-row items-start mb-4">
            <View className="mr-3">
              <Ionicons name="car-outline" size={scale(24)} color="#000" />
            </View>
            <View className="flex-1">
              {product.free_shipping ? (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={scale(16)} color="#16A34A" />
                  <Text className="text-sm font-semibold text-green-600 ml-1">Envío GRATIS</Text>
                </View>
              ) : (
                <Text className="text-sm text-gray-900">Envío a calcular en checkout</Text>
              )}
              <Text className="text-sm text-gray-600 mt-1">
                Entrega estimada 3-5 días hábiles
              </Text>
            </View>
          </View>

          {/* Retiro en sucursal */}
          <View className="flex-row items-start">
            <View className="mr-3">
              <Ionicons name="bag-outline" size={scale(24)} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-900 mb-1">Retiro GRATIS en sucursal</Text>
              <Text className="text-sm text-gray-500">Disponible en puntos de retiro</Text>
            </View>
          </View>
        </View>

        {/* Vendedor y Contactar */}
        <View className="px-5 py-4 bg-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Ionicons name="storefront-outline" size={24} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500">Vendido por</Text>
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {product?.sellers?.store_name || 'Tienda'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleContactSeller}
              className="flex-row items-center bg-white border border-primary rounded-xl px-4 py-3"
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: COLORS.primary }}>
                Contactar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Variantes */}
        {variantTypes.length > 0 && (
          <View className="border border-gray-300 rounded mx-5 my-4 overflow-hidden" style={{ backgroundColor: 'white' }}>
            <LinearGradient
              colors={['#2563EB', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: verticalScale(31), justifyContent: 'center', paddingHorizontal: scale(12) }}
            >
              <Text className="text-white text-lg font-medium">Variantes</Text>
            </LinearGradient>

            <View className="px-3 pt-3 pb-3">
              <VariantSelector
                variantTypes={variantTypes}
                variants={variants}
                selectedOptions={selectedOptions}
                onSelectOption={handleSelectOption}
              />
            </View>
          </View>
        )}

        {/* Más Productos de esta tienda */}
        {storeProducts.length > 0 && (
          <View className="mb-6">
            <View className="px-5 mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                Más Productos de esta tienda
              </Text>
            </View>
            <FlatList
              data={storeProducts}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
            <TouchableOpacity className="px-5 mt-3 flex-row items-center justify-center">
              <Text className="text-lg text-gray-600 mr-2">Ir a la tienda</Text>
              <Ionicons name="arrow-forward" size={scale(18)} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Información del producto */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-center text-gray-900 mb-2">
            {product.name}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            ID: {product.id.slice(0, 8).toUpperCase()}
          </Text>

          {/* Detalles básicos */}
          <View className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-sm text-gray-600">Condición</Text>
              <Text className="text-sm text-gray-900 font-medium">
                {product.condition === 'new' ? 'Nuevo' : 'Usado'}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-sm text-gray-600">Stock disponible</Text>
              <Text className="text-sm text-gray-900 font-medium">{product.stock} unidades</Text>
            </View>
            {product.category && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-600">Categoría</Text>
                <Text className="text-sm text-gray-900 font-medium">{product.category.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Descripción del producto */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Descripción del producto
          </Text>

          <View className="relative">
            <Text
              className="text-sm text-gray-900 leading-5"
              numberOfLines={showFullDescription ? undefined : 10}
            >
              {product.description || 'Sin descripción disponible para este producto.'}
            </Text>

            {!showFullDescription && (
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              />
            )}
          </View>

          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center"
            onPress={() => setShowFullDescription(!showFullDescription)}
          >
            <Text className="text-lg text-gray-600 mr-2">
              {showFullDescription ? 'Ver menos' : 'Ver descripción completa'}
            </Text>
            <Ionicons
              name={showFullDescription ? 'chevron-up' : 'chevron-down'}
              size={scale(18)}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Opiniones y Reseñas */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Opiniones del producto
          </Text>

          {reviewStats && reviewStats.total > 0 ? (
            <>
              {/* Stats Summary */}
              <View className="flex-row items-center mb-4">
                <View className="items-center mr-6">
                  <Text className="text-4xl font-bold text-gray-900">
                    {reviewStats.average.toFixed(1)}
                  </Text>
                  <View className="flex-row mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(reviewStats.average) ? 'star' : 'star-outline'}
                        size={scale(16)}
                        color="#FBBF24"
                      />
                    ))}
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {reviewStats.total} {reviewStats.total === 1 ? 'opinión' : 'opiniones'}
                  </Text>
                </View>

                {/* Distribution bars */}
                <View className="flex-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.distribution[rating as keyof typeof reviewStats.distribution];
                    const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    return (
                      <View key={rating} className="flex-row items-center mb-1">
                        <Text className="text-xs text-gray-600 w-3">{rating}</Text>
                        <Ionicons name="star" size={scale(10)} color="#FBBF24" />
                        <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                          <View
                            className="h-2 bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                        <Text className="text-xs text-gray-500 w-6">{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Individual Reviews */}
              {reviews.map((review) => (
                <View key={review.id} className="border-t border-gray-200 py-4">
                  <View className="flex-row items-center mb-2">
                    {review.user?.avatar_url ? (
                      <Image
                        source={{ uri: review.user.avatar_url }}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
                        <Ionicons name="person" size={scale(16)} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900">
                        {review.user?.full_name || 'Usuario'}
                      </Text>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= review.rating ? 'star' : 'star-outline'}
                            size={scale(12)}
                            color="#FBBF24"
                          />
                        ))}
                        <Text className="text-xs text-gray-500 ml-2">
                          {new Date(review.created_at).toLocaleDateString('es-AR')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {review.title && (
                    <Text className="text-sm font-semibold text-gray-900 mb-1">
                      {review.title}
                    </Text>
                  )}
                  {review.comment && (
                    <Text className="text-sm text-gray-700">{review.comment}</Text>
                  )}
                  {review.seller_response && (
                    <View className="bg-gray-50 rounded-lg p-3 mt-2">
                      <Text className="text-xs font-medium text-gray-600 mb-1">
                        Respuesta del vendedor:
                      </Text>
                      <Text className="text-sm text-gray-700">{review.seller_response}</Text>
                    </View>
                  )}
                </View>
              ))}

              {reviewStats.total > 5 && (
                <TouchableOpacity className="mt-2 flex-row items-center justify-center">
                  <Text className="text-base" style={{ color: COLORS.primary }}>
                    Ver todas las opiniones ({reviewStats.total})
                  </Text>
                  <Ionicons name="chevron-forward" size={scale(16)} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="items-center py-6">
              <Ionicons name="chatbubble-outline" size={scale(40)} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">Aún no hay opiniones</Text>
              <Text className="text-xs text-gray-400">Sé el primero en opinar</Text>
            </View>
          )}
        </View>

        {/* Productos similares */}
        {relatedProducts.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3 px-5">
              Productos similares
            </Text>
            <FlatList
              data={relatedProducts}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          </View>
        )}

        {/* Footer - Newsletter */}
        <View className="bg-gray-100 rounded-t-[70px] pt-8 pb-6 px-5">
          <View>
            <Text className="text-sm text-gray-900 mb-3">
              Recibí ofertas y promociones
            </Text>
            <View className="bg-white rounded-full flex-row items-center pr-1 pl-4 h-11">
              <TextInput
                className="flex-1 text-sm"
                placeholder="Ingresá tu email"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={handleSubscribe}
                disabled={!email}
              >
                <LinearGradient
                  colors={email ? ['#2563EB', '#DC2626'] : ['#D1D5DB', '#D1D5DB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-full px-4 py-2"
                >
                  <Text className="text-white text-sm font-medium">Suscribirme</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón de acción flotante */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-3 border-t border-gray-200"
        style={{
          zIndex: 100,
          elevation: 20,
          paddingBottom: insets.bottom + 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }}
      >
        <Button
          title={effectiveStock === 0 ? "Sin Stock" : "Agregar al Carrito"}
          onPress={handleAddToCart}
          disabled={effectiveStock === 0}
        />
      </View>

      {/* Modal Agregar a lista */}
      {user && (
        <AddToListModal
          visible={showAddToListModal}
          onClose={() => setShowAddToListModal(false)}
          productId={productId}
          userId={user.id}
        />
      )}
    </View>
  );
}
