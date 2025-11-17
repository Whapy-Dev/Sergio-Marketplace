import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';
import Button from '../../components/common/Button';
import SimpleFooter from '../../components/common/SimpleFooter';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  image?: string;
  stock: number;
  price?: number;
}

interface Specification {
  category: string;
  icon: string;
  items: { label: string; value: string }[];
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);

  // Variantes de ejemplo (esto vendría de la BD)
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Especificaciones técnicas
  const [specifications, setSpecifications] = useState<Specification[]>([]);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);

      // Cargar producto
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setProduct(productData);

      // Incrementar vistas
      await supabase.rpc('increment_product_views', { product_id: productId });

      // Cargar vendedor
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', productData.seller_id)
        .single();

      setSeller(sellerData);

      // Cargar productos relacionados (misma categoría)
      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', productData.category_id)
        .neq('id', productId)
        .eq('status', 'active')
        .limit(6);

      setRelatedProducts(relatedData || []);

      // Cargar más productos del vendedor
      const { data: sellerProductsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', productData.seller_id)
        .neq('id', productId)
        .eq('status', 'active')
        .limit(4);

      setSellerProducts(sellerProductsData || []);

      // Generar especificaciones técnicas de ejemplo
      generateSpecifications(productData);

    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  function generateSpecifications(productData: any) {
    // Esto es de ejemplo - idealmente vendría de la BD
    const specs: Specification[] = [
      {
        category: 'Características generales',
        icon: 'information-circle',
        items: [
          { label: 'Marca', value: productData.brand || 'N/A' },
          { label: 'Modelo', value: productData.name },
          { label: 'Condición', value: productData.condition === 'new' ? 'Nuevo' : 'Usado' },
          { label: 'Garantía', value: '6 meses' },
        ],
      },
      {
        category: 'Detalles del producto',
        icon: 'cube',
        items: [
          { label: 'Stock disponible', value: `${productData.stock} unidades` },
          { label: 'Peso', value: '500g' },
          { label: 'Dimensiones', value: '20x15x10 cm' },
        ],
      },
      {
        category: 'Envío',
        icon: 'car',
        items: [
          { label: 'Envío gratis', value: productData.free_shipping ? 'Sí' : 'No' },
          { label: 'Tiempo estimado', value: '2-3 días hábiles' },
          { label: 'Retiro en tienda', value: 'Disponible' },
        ],
      },
    ];

    setSpecifications(specs);
  }

  function handleAddToCart() {
    if (!product) return;

    if (product.stock < quantity) {
      Alert.alert('Stock insuficiente', `Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url,
      stock: product.stock,
      sellerId: product.seller_id,
    });

    Alert.alert('¡Agregado!', `${quantity} ${quantity === 1 ? 'producto' : 'productos'} agregado(s) al carrito`, [
      { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') },
      { text: 'Seguir comprando', style: 'cancel' },
    ]);
  }

  function handleBuyNow() {
    if (!product) return;

    if (product.stock < quantity) {
      Alert.alert('Stock insuficiente', `Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.image_url,
      stock: product.stock,
      sellerId: product.seller_id,
    });

    navigation.navigate('Checkout');
  }

  function handleContactSeller() {
    if (!seller?.phone) {
      Alert.alert('No disponible', 'El vendedor no tiene número de contacto');
      return;
    }

    Alert.alert('Contactar vendedor', '¿Cómo deseas contactar?', [
      {
        text: 'WhatsApp',
        onPress: () => {
          const cleanPhone = seller.phone.replace(/\D/g, '');
          const message = `Hola, estoy interesado en: ${product.name}`;
          Linking.openURL(`https://wa.me/54${cleanPhone}?text=${encodeURIComponent(message)}`);
        },
      },
      {
        text: 'Llamar',
        onPress: () => Linking.openURL(`tel:${seller.phone}`),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function handleToggleFavorite() {
    if (!product) return;
    toggleFavorite(product.id);
  }

  function calculateDiscount() {
    if (!product || !product.compare_at_price) return 0;
    return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
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

  if (!product) return null;

  const discount = calculateDiscount();
  const hasDiscount = discount > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex-row items-center justify-between bg-white/90">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <Ionicons name={isFavorite(product.id) ? 'heart' : 'heart-outline'} size={24} color={isFavorite(product.id) ? '#EF4444' : '#000'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Galería de imágenes */}
        <View className="relative">
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/400' }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            resizeMode="cover"
          />
          
          {/* Badge de descuento */}
          {hasDiscount && (
            <View className="absolute top-4 left-4 bg-cyan-500 rounded-lg px-3 py-1">
              <Text className="text-white font-bold">-{discount}%</Text>
            </View>
          )}

          {/* Indicador de stock bajo */}
          {product.stock < 5 && product.stock > 0 && (
            <View className="absolute bottom-4 left-4 bg-orange-500 rounded-lg px-3 py-2 flex-row items-center">
              <Ionicons name="alert-circle" size={16} color="white" />
              <Text className="text-white font-semibold ml-1 text-xs">
                ¡Solo quedan {product.stock}!
              </Text>
            </View>
          )}
        </View>

        {/* Variantes de producto */}
        {variants.length > 0 && (
          <View className="px-4 py-4 bg-cyan-50 border-b border-cyan-100">
            <Text className="text-base font-bold text-gray-900 mb-3">Variantes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  onPress={() => setSelectedVariant(variant.id)}
                  className={`mr-3 border-2 rounded-lg p-2 ${selectedVariant === variant.id ? 'border-cyan-500' : 'border-gray-200'}`}
                  style={{ width: 80 }}
                >
                  {variant.image ? (
                    <Image source={{ uri: variant.image }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded items-center justify-center">
                      <Text className="text-xs">{variant.name}</Text>
                    </View>
                  )}
                  <Text className="text-xs text-center mt-1" numberOfLines={1}>
                    {variant.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Información del producto */}
        <View className="px-4 py-4 border-b border-gray-100">
          {/* Marca/Categoría */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{product.category_name || 'Sin categoría'}</Text>
          </View>

          {/* Nombre */}
          <Text className="text-2xl font-bold text-gray-900 mb-3">{product.name}</Text>

          {/* Vendido por */}
          <View className="flex-row items-center mb-4">
            <Text className="text-sm text-gray-600">Vendido por </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SellerProfile', { sellerId: seller?.id })}>
              <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                {seller?.store_name || 'Yo Compro'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Precio */}
          <View className="mb-4">
            {hasDiscount && (
              <View className="flex-row items-center mb-1">
                <Text className="text-lg text-gray-500 line-through mr-2">
                  ${product.compare_at_price?.toLocaleString()}
                </Text>
                <View className="bg-blue-500 rounded px-2 py-1">
                  <Text className="text-white text-xs font-bold">{discount}% OFF</Text>
                </View>
              </View>
            )}
            <Text className="text-4xl font-bold" style={{ color: COLORS.primary }}>
              ${product.price.toLocaleString()}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">Precio sin imp. inc. ${(product.price * 1.08).toLocaleString('es-AR')}</Text>
          </View>

          {/* Promociones bancarias */}
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="card" size={20} color={COLORS.primary} />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                ¡Nuestras promociones bancarias!
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={16} color={COLORS.primary} />
              <Text className="text-sm text-gray-700 ml-2">
                6 Cuotas Yo Compro Crédito
              </Text>
            </View>
            <Text className="text-sm font-semibold text-gray-900 mt-1 ml-6">
              3 cuotas sin interés de ${(product.price / 3).toLocaleString()}
            </Text>
            <TouchableOpacity className="mt-2">
              <Text className="text-cyan-500 text-sm font-semibold">Ver todos los medios de pago</Text>
            </TouchableOpacity>
          </View>

          {/* Envío */}
          <View className="border-t border-gray-100 pt-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="car" size={20} color="#6B7280" />
              <Text className="text-base font-semibold text-gray-900 ml-2">Envío a</Text>
              <Text className="text-base font-semibold ml-1" style={{ color: COLORS.primary }}>
                Dirección 123
              </Text>
              <Text className="text-base font-bold text-gray-900 ml-2">
                ${product.free_shipping ? 0 : 3749}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 ml-7">Entrega estimada 3 días hábiles</Text>

            <View className="flex-row items-center mt-3">
              <Ionicons name="storefront" size={20} color="#6B7280" />
              <Text className="text-base font-semibold text-gray-900 ml-2">Retiro GRATIS en sucursal</Text>
            </View>
            <TouchableOpacity className="mt-1 ml-7">
              <Text className="text-cyan-500 text-sm font-semibold">Ver sucursales</Text>
            </TouchableOpacity>
          </View>

          {/* Selector de cantidad */}
          <View className="mt-4 flex-row items-center">
            <Text className="text-base font-semibold text-gray-900 mr-4">Cantidad:</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2"
              >
                <Ionicons name="remove" size={20} color="#374151" />
              </TouchableOpacity>
              <Text className="text-base font-semibold text-gray-900 px-4">{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-2"
                disabled={quantity >= product.stock}
              >
                <Ionicons name="add" size={20} color={quantity >= product.stock ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-600 ml-3">({product.stock} disponibles)</Text>
          </View>
        </View>

        {/* Más productos de esta tienda */}
        {sellerProducts.length > 0 && (
          <View className="px-4 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Más Productos De Esta Tienda
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sellerProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.push('ProductDetail', { productId: item.id })}
                  className="mr-3 border border-gray-200 rounded-lg"
                  style={{ width: 150 }}
                >
                  {item.compare_at_price && (
                    <View className="absolute top-2 left-2 bg-cyan-500 rounded px-2 py-1 z-10">
                      <Text className="text-white text-xs font-bold">
                        {Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)}% OFF
                      </Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={{ width: 148, height: 148 }}
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    {item.stock < 5 && (
                      <View className="bg-cyan-500 rounded px-2 py-1 mb-1 self-start">
                        <Text className="text-white text-xs font-bold">3 sin interés</Text>
                      </View>
                    )}
                    <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.compare_at_price && (
                      <Text className="text-xs text-gray-500 line-through">
                        ${item.compare_at_price.toLocaleString()}
                      </Text>
                    )}
                    <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                      ${item.price.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      Precio sin imp. ${(item.price * 1.08).toLocaleString()}
                    </Text>
                    {item.free_shipping && (
                      <View className="bg-green-100 rounded mt-2 px-2 py-1">
                        <Text className="text-green-600 text-xs font-semibold">Envío GRATIS</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity className="mt-3 py-2 items-center">
              <Text className="font-semibold" style={{ color: COLORS.primary }}>
                Ir a la tienda →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Especificaciones técnicas */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900 mb-3">Especificaciones técnicas</Text>
          
          <Text className="text-lg font-bold text-gray-900 mb-3">{product.name}</Text>
          <Text className="text-sm text-gray-600 mb-4">Artículo: {product.id.substring(0, 8)}</Text>

          <Text className="text-base font-bold text-gray-900 mb-3">Características técnicas</Text>

          {specifications.map((spec, index) => (
            <View key={index} className="mb-2">
              <TouchableOpacity
                onPress={() => setExpandedSpec(expandedSpec === spec.category ? null : spec.category)}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name={spec.icon as any} size={20} color="#6B7280" />
                  <Text className="text-base font-semibold text-gray-900 ml-3">{spec.category}</Text>
                </View>
                <Ionicons
                  name={expandedSpec === spec.category ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {expandedSpec === spec.category && (
                <View className="bg-gray-50 rounded-lg p-3 mt-2">
                  {spec.items.map((item, itemIndex) => (
                    <View key={itemIndex} className="flex-row justify-between py-2">
                      <Text className="text-sm text-gray-600">{item.label}</Text>
                      <Text className="text-sm font-semibold text-gray-900">{item.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity className="mt-3 py-2">
            <Text className="text-cyan-500 text-sm font-semibold text-center">
              Ver todas las especificaciones ↓
            </Text>
          </TouchableOpacity>
        </View>

        {/* Descripción del producto */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900 mb-3">Descripción del producto</Text>
          <Text className="text-base text-gray-700 leading-6">
            {showFullDescription
              ? product.description || 'Sin descripción disponible.'
              : `${(product.description || 'Sin descripción disponible.').substring(0, 200)}...`}
          </Text>
          <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} className="mt-3 py-2">
            <Text className="text-cyan-500 text-sm font-semibold text-center">
              {showFullDescription ? 'Ver menos ↑' : 'Ver descripción completa ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Productos similares */}
        {relatedProducts.length > 0 && (
          <View className="px-4 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900 mb-3">Productos similares</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.push('ProductDetail', { productId: item.id })}
                  className="mr-3 border border-gray-200 rounded-lg"
                  style={{ width: 150 }}
                >
                  {item.compare_at_price && (
                    <View className="absolute top-2 left-2 bg-cyan-500 rounded px-2 py-1 z-10">
                      <Text className="text-white text-xs font-bold">
                        {Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)}% OFF
                      </Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={{ width: 148, height: 148 }}
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.compare_at_price && (
                      <Text className="text-xs text-gray-500 line-through">
                        ${item.compare_at_price.toLocaleString()}
                      </Text>
                    )}
                    <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                      ${item.price.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 🎯 SIMPLE FOOTER AGREGADO AQUÍ 🎯 */}
        <SimpleFooter backgroundColor="#F9FAFB" />
      </ScrollView>

      {/* Barra de acciones inferior */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <Button
          title={`Agregar al carrito (${quantity})`}
          onPress={handleAddToCart}
          variant="primary"
        />
        <View className="mt-2">
          <Button
            title="Comprar ahora"
            onPress={handleBuyNow}
            variant="primary"
          />
        </View>
        <TouchableOpacity
          onPress={handleContactSeller}
          className="mt-2 border-2 rounded-xl py-3 flex-row items-center justify-center"
          style={{ borderColor: COLORS.primary }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          <Text className="font-semibold text-base ml-2" style={{ color: COLORS.primary }}>
            Contactar vendedor
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}