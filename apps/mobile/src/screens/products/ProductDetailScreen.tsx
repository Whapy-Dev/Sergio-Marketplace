import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProductById, getProductsBySeller, ProductWithDetails, Product } from '../../services/products';
import ImageGallery from '../../components/products/ImageGallery';
import ProductCard from '../../components/home/ProductCard';
import Button from '../../components/common/Button';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';

interface ProductDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  const { addItem, items } = useCart();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const { user } = useAuth();

  const isProductFavorite = product ? isFavorite(product.id) : false;

  console.log('🎨 ProductDetail render - productId:', productId?.slice(0, 8));
  console.log('🎨 Todos los favoritos:', favorites);
  console.log('🎨 isProductFavorite:', isProductFavorite);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      const data = await getProductById(productId);
      setProduct(data);

      if (data?.seller_id) {
        const sellerProds = await getProductsBySeller(data.seller_id, 6);
        setSellerProducts(sellerProds.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    const itemInCart = items.find(item => item.id === product.id);
    
    if (itemInCart && itemInCart.quantity >= product.stock) {
      Alert.alert(
        'Stock insuficiente',
        `Ya tienes ${itemInCart.quantity} unidades en el carrito (stock máximo: ${product.stock})`
      );
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.images?.[0]?.url,
    });

    Alert.alert(
      '¡Agregado al carrito!',
      `${product.name} fue agregado a tu carrito`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  }

  function handleBuyNow() {
    if (!product) return;
    handleAddToCart();
    setTimeout(() => {
      navigation.navigate('Cart');
    }, 500);
  }

  async function handleToggleFavorite() {
    if (!product) return;

    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Debes iniciar sesión para guardar favoritos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (isTogglingFavorite) {
      console.log('⏳ Ya hay un toggle en progreso');
      return;
    }

    try {
      setIsTogglingFavorite(true);
      console.log('🔥 handleToggleFavorite - productId:', product.id.slice(0, 8));
      
      const success = await toggleFavorite(product.id);
      console.log('🔥 toggleFavorite result:', success);
      
      if (!success) {
        Alert.alert('Error', 'No se pudo actualizar favoritos');
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-6xl mb-4">😕</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</Text>
        <Text className="text-base text-gray-600 text-center mb-6">
          Este producto no está disponible o fue eliminado
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = product.images?.map((img) => img.url) || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-lg">← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
          disabled={isTogglingFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-3xl">
            {isProductFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ImageGallery images={images} />

        <View className="p-4">
          {product.condition && (
            <View className="mb-2">
              <Text className="text-xs text-gray-500 uppercase">
                {product.condition === 'new' ? '✨ Nuevo' : '📦 Usado'}
              </Text>
            </View>
          )}

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>

          {product.seller && (
            <TouchableOpacity className="mb-4">
              <Text className="text-sm text-gray-600">
                Vendido por{' '}
                <Text className="text-primary font-semibold">
                  {product.seller.business_name}
                </Text>
              </Text>
              <Text className="text-xs text-gray-500">
                ⭐ {product.seller.rating?.toFixed(1)} · {product.seller.total_sales} ventas
              </Text>
            </TouchableOpacity>
          )}

          {product.compare_at_price && (
            <Text className="text-base text-gray-400 line-through">
              ${product.compare_at_price.toLocaleString()}
            </Text>
          )}

          <View className="flex-row items-center mb-4">
            <Text className="text-3xl font-bold text-gray-900">
              ${product.price.toLocaleString()}
            </Text>
            {discount > 0 && (
              <View className="ml-3 bg-primary rounded px-2 py-1">
                <Text className="text-white text-sm font-bold">{discount}% OFF</Text>
              </View>
            )}
          </View>

          <View className="bg-blue-50 rounded-lg p-3 mb-4">
            <Text className="text-sm font-semibold text-primary mb-1">
              🎉 ¡Nuestras promociones bancarias!
            </Text>
            <Text className="text-sm text-gray-700">
              3 cuotas sin interés de ${(product.price / 3).toLocaleString()}
            </Text>
          </View>

          <View className="border border-gray-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-lg mr-2">🚚</Text>
              <Text className="text-base font-semibold text-gray-900">
                {product.free_shipping ? 'Envío GRATIS' : 'Envío a coordinar'}
              </Text>
            </View>
            {product.free_shipping && (
              <View className="bg-green-50 rounded px-2 py-1 mb-2 self-start">
                <Text className="text-xs text-green-700 font-semibold">
                  ¡Llega gratis!
                </Text>
              </View>
            )}
            <Text className="text-sm text-gray-600">
              Llega en 3-5 días hábiles
            </Text>
          </View>

          {product.description && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-2">
                Descripción
              </Text>
              <Text className="text-base text-gray-700 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          {sellerProducts.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Más productos del vendedor
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sellerProducts.map((prod) => (
                  <View key={prod.id} className="w-40 mr-3">
                    <ProductCard
                      id={prod.id}
                      name={prod.name}
                      price={prod.price}
                      compareAtPrice={prod.compare_at_price}
                      onPress={() => {
                        navigation.push('ProductDetail', { productId: prod.id });
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-gray-200 p-4 bg-white">
        <View className="flex-row" style={{ gap: 12 }}>
          <View className="flex-1">
            <Button
              title="Agregar al carrito"
              onPress={handleAddToCart}
              variant="outline"
              disabled={product.stock === 0}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Comprar ahora"
              onPress={handleBuyNow}
              disabled={product.stock === 0}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}