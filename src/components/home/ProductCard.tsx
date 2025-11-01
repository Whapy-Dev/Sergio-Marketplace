import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  originalPrice?: number;
  discount?: number;
  hasFreeShipping?: boolean;
  hasInstallments?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  originalPrice,
  discount,
  hasFreeShipping,
  hasInstallments,
}: ProductCardProps) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ProductDetail', { productId: id })}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ 
        width: 155, 
        borderWidth: 1, 
        borderColor: '#F3F4F6',
      }}
    >
      {/* Badges superiores - posición exacta Figma */}
      {(hasInstallments || discount) && (
        <View className="absolute top-2 left-2 z-10" style={{ gap: 4 }}>
          {hasInstallments && (
            <View 
              className="rounded-md px-2 py-1" 
              style={{ backgroundColor: '#11CCEE' }}
            >
              <Text className="text-white text-[8px] font-bold leading-[10px]">12 MESES</Text>
              <Text className="text-white text-[8px] font-bold leading-[10px]">SIN INTERÉS</Text>
            </View>
          )}
          {discount && (
            <View 
              className="rounded-md px-2 py-1" 
              style={{ backgroundColor: '#11CCEE' }}
            >
              <Text className="text-white text-[10px] font-bold">{discount}% OFF</Text>
            </View>
          )}
        </View>
      )}

      {/* Imagen */}
      <View className="bg-gray-50 items-center justify-center" style={{ height: 130 }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 48 }}>📦</Text>
        )}
      </View>

      {/* Info del producto */}
      <View className="p-2.5">
        <Text 
          className="text-xs text-gray-900 mb-2" 
          numberOfLines={2} 
          style={{ height: 32, lineHeight: 16 }}
        >
          {name}
        </Text>

        {/* Precio anterior tachado - MÁS VISIBLE */}
        {originalPrice && (
          <Text 
            className="text-[11px] text-gray-400 line-through mb-0.5"
            style={{ textDecorationLine: 'line-through', textDecorationColor: '#9CA3AF' }}
          >
            ${originalPrice.toLocaleString('es-AR')}
          </Text>
        )}

        {/* Precio actual */}
        <Text className="text-lg font-bold text-gray-900 mb-1.5">
          ${price.toLocaleString('es-AR')}
        </Text>

        {/* Badge envío gratis - exacto a Figma */}
        {hasFreeShipping && (
          <View 
            className="rounded px-1.5 py-0.5 self-start" 
            style={{ backgroundColor: '#00A650' }}
          >
            <Text className="text-white text-[8px] font-bold">Envío GRATIS</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}