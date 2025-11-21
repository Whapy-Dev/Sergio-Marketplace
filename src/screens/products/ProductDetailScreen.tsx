import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, FlatList, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Button from '../../components/common/Button';
import AddToListModal from '../../components/favorites/AddToListModal';
import VariantSelector from '../../components/product/VariantSelector';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSpec, setExpandedSpec] = useState<string | null>('camera');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [showAddToListModal, setShowAddToListModal] = useState(false);

  // Variant system
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<VariantData | undefined>(undefined);

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
  }, [productId]);

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

  function toggleSpecSection(section: string) {
    setExpandedSpec(expandedSpec === section ? null : section);
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[40px]"
      >
        <View className="px-5 py-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-4">
              <Ionicons name="notifications-outline" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} className="mr-4">
              <Ionicons name="cart-outline" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} style={{ paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <View className="px-5 py-4 bg-gray-50 rounded-[20px] mx-5 mt-3">
          <View className="flex-row items-center">
            <Ionicons name="chevron-back" size={14} color="#000" />
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
              <View style={{ width: width - 40, height: 359 }} className="mx-5">
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
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
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
                  <Ionicons name="bookmarks-outline" size={16} color="#000" />
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
                    width: 24,
                    height: 8,
                    borderRadius: 50,
                    marginHorizontal: 4,
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
              <Text className="text-[8px]">💳</Text>
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
              <Ionicons name="car-outline" size={24} color="#000" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-gray-900">Envío a </Text>
                <Text className="text-sm font-medium text-gray-900">$3.749</Text>
              </View>
              <Text className="text-sm" style={{ color: COLORS.primary }}>Dirección 123</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Entrega estimada 3 días hábiles
              </Text>
            </View>
          </View>

          {/* Retiro en sucursal */}
          <View className="flex-row items-start">
            <View className="mr-3">
              <Ionicons name="bag-outline" size={24} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-900 mb-1">Retiro GRATIS en sucursal</Text>
              <TouchableOpacity>
                <Text className="text-sm" style={{ color: COLORS.primary }}>Ver sucursales</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Variantes */}
        {variantTypes.length > 0 && (
          <View className="border border-gray-300 rounded mx-5 my-4 overflow-hidden" style={{ backgroundColor: 'white' }}>
            <LinearGradient
              colors={['#2563EB', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 31, justifyContent: 'center', paddingHorizontal: 12 }}
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
              <Ionicons name="arrow-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Especificaciones técnicas */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Especificaciones técnicas
          </Text>

          <Text className="text-lg font-semibold text-center text-gray-900 mb-2">
            {product.name}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Artículo: <Text className="underline">22101758</Text>
          </Text>

          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Características técnicas
          </Text>

          {/* Acordeón Cámara */}
          <View className="border-t border-b border-gray-200">
            <TouchableOpacity
              className="py-4 flex-row items-center justify-between"
              onPress={() => toggleSpecSection('camera')}
            >
              <Text className="text-base font-medium text-gray-900">Cámara</Text>
              <Ionicons
                name={expandedSpec === 'camera' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
            {expandedSpec === 'camera' && (
              <View className="pb-4">
                <View className="bg-gray-50 flex-row justify-between py-2 px-3 mb-1">
                  <Text className="text-sm text-gray-600">Cámara principal</Text>
                  <Text className="text-sm text-gray-900">Dual 48 MP y 12 MP</Text>
                </View>
                <View className="flex-row justify-between py-2 px-3 mb-1">
                  <Text className="text-sm text-gray-600">Cámara frontal</Text>
                  <Text className="text-sm text-gray-900">12 MP</Text>
                </View>
                <View className="bg-gray-50 flex-row justify-between py-2 px-3">
                  <Text className="text-sm text-gray-600">Flash</Text>
                  <Text className="text-sm text-gray-900">Sí</Text>
                </View>
              </View>
            )}
          </View>

          {/* Acordeón Memoria */}
          <TouchableOpacity
            className="border-b border-gray-200 py-4 flex-row items-center justify-between"
            onPress={() => toggleSpecSection('memory')}
          >
            <Text className="text-base font-medium text-gray-900">Memoria</Text>
            <Ionicons
              name={expandedSpec === 'memory' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>

          {/* Acordeón Imagen */}
          <TouchableOpacity
            className="border-b border-gray-200 py-4 flex-row items-center justify-between"
            onPress={() => toggleSpecSection('display')}
          >
            <Text className="text-base font-medium text-gray-900">Imágen</Text>
            <Ionicons
              name={expandedSpec === 'display' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>

          {/* Acordeón Red */}
          <TouchableOpacity
            className="border-b border-gray-200 py-4 flex-row items-center justify-between"
            onPress={() => toggleSpecSection('network')}
          >
            <Text className="text-base font-medium text-gray-900">Red</Text>
            <Ionicons
              name={expandedSpec === 'network' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            className="h-20 -mt-20 pointer-events-none"
          />

          <TouchableOpacity className="mt-4 flex-row items-center justify-center">
            <Text className="text-lg text-gray-600 mr-2">Ver todas las especificaciones</Text>
            <Ionicons name="chevron-down" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Descripción del producto */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Descripción del producto
          </Text>

          <View className="relative">
            <Text
              className="text-xs text-gray-900 leading-5"
              numberOfLines={showFullDescription ? undefined : 10}
            >
              {product.description ||
                `iPhone 14 128GB, un smartphone que combina diseño elegante, rendimiento potente y tecnología avanzada.\n\nPantalla: Cuenta con una pantalla Super Retina XDR OLED de 6.1 pulgadas, que ofrece imágenes nítidas y colores vibrantes para una experiencia visual inigualable.\n\nMemoria: Con 128GB de almacenamiento interno y 6GB de RAM, tendrás espacio y velocidad suficientes para tus fotos, videos, aplicaciones y más.\n\nProcesador: Equipado con el chip A15 Bionic, garantiza un rendimiento rápido y eficiente en todas tus tareas diarias.\n\nCámara: Su sistema de cámara dual incluye una cámara principal de 12MP y una ultra gran angular de 12MP, permitiéndote capturar imágenes detalladas y de alta calidad.`
              }
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
              size={18}
              color="#666"
            />
          </TouchableOpacity>
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

        {/* Footer */}
        <View className="bg-gray-100 rounded-t-[70px] pt-8 pb-6 px-5">
          {/* Atención al cliente */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Atención al cliente
            </Text>
            <Text className="text-base text-gray-900 mb-3">0800 123 456</Text>
            <Text className="text-sm text-gray-900 leading-5">
              Lunes a Viernes de 09:00 a 18:00{'\n'}Sábados de 9:00 a 13:00
            </Text>
          </View>

          {/* Newsletter */}
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
        className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3 border-t border-gray-200"
        style={{
          zIndex: 100,
          elevation: 10,
          paddingBottom: 90 // Espacio para el navbar
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
    </SafeAreaView>
  );
}
