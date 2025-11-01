import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  compare_at_price?: number | null;
  free_shipping?: boolean;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden border border-gray-200"
    >
      {/* Imagen */}
      <View className="aspect-square bg-gray-100 relative">
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">📦</Text>
          </View>
        )}
        {discount && (
          <View 
            className="absolute top-2 left-2 rounded-lg px-2 py-1"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white text-xs font-bold">-{discount}%</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="p-3">
        <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.compare_at_price && product.compare_at_price > product.price && (
          <Text className="text-xs text-gray-500 line-through">
            ${product.compare_at_price.toLocaleString('es-AR')}
          </Text>
        )}
        
        <Text className="text-lg font-bold mb-1" style={{ color: COLORS.primary }}>
          ${product.price.toLocaleString('es-AR')}
        </Text>

        {product.free_shipping && (
          <Text className="text-xs text-green-600 font-semibold">
            ✓ Envío gratis
          </Text>
        )}

        {product.stock === 0 && (
          <Text className="text-xs text-red-600 font-semibold mt-1">
            Sin stock
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}