import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface ProductCardProps {
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  onPress: () => void;
}

export default function ProductCard({ 
  name, 
  price, 
  compareAtPrice,
  imageUrl,
  onPress 
}: ProductCardProps) {
  
  const discount = compareAtPrice 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3"
      activeOpacity={0.7}
    >
      {/* Imagen */}
      <View className="bg-gray-100 h-40 items-center justify-center">
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-5xl">📦</Text>
        )}
        
        {/* Badge de descuento */}
        {discount > 0 && (
          <View className="absolute top-2 left-2 bg-primary rounded px-2 py-1">
            <Text className="text-white text-xs font-bold">{discount}% OFF</Text>
          </View>
        )}
      </View>
      
      {/* Info */}
      <View className="p-3">
        <Text className="text-sm text-gray-700 mb-1" numberOfLines={2}>
          {name}
        </Text>
        
        {compareAtPrice && (
          <Text className="text-xs text-gray-400 line-through">
            ${compareAtPrice.toLocaleString()}
          </Text>
        )}
        
        <Text className="text-lg font-bold text-gray-900">
          ${price.toLocaleString()}
        </Text>
        
        <Text className="text-xs text-green-600 mt-1">Envío gratis</Text>
      </View>
    </TouchableOpacity>
  );
}