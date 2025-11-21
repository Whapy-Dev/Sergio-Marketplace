import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { HomeSection } from '../../services/homeSections';

interface DynamicSectionProps {
  section: HomeSection;
  onProductPress: (productId: string) => void;
}

export default function DynamicSection({ section, onProductPress }: DynamicSectionProps) {
  if (section.products.length === 0) return null;

  const renderHorizontalProduct = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => onProductPress(item.product.id)}
      className="mr-3"
      style={{ width: 133 }}
    >
      <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
        <View className="bg-gray-100 items-center justify-center relative" style={{ height: 133 }}>
          {item.product.image_url ? (
            <Image
              source={{ uri: item.product.image_url }}
              style={{ width: 133, height: 133 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          )}
          {item.custom_label && (
            <View
              className="absolute top-2 right-2 rounded px-2 py-1"
              style={{ backgroundColor: item.custom_label_color }}
            >
              <Text className="text-white text-xs font-bold">{item.custom_label}</Text>
            </View>
          )}
        </View>
        <View className="p-2">
          <Text className="text-xs font-medium text-gray-900 mb-1" numberOfLines={2}>
            {item.product.name}
          </Text>
          <View className="mb-1">
            <Text className="text-sm font-bold" style={{ color: COLORS.primary }}>
              ${item.product.price.toLocaleString('es-AR')}
            </Text>
            {item.product.compare_at_price && item.product.compare_at_price > item.product.price && (
              <Text className="text-xs text-gray-500 line-through">
                ${item.product.compare_at_price.toLocaleString('es-AR')}
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name="star" size={10} color="#FBBF24" />
            ))}
          </View>
          <TouchableOpacity
            className="mt-2 rounded-full py-2"
            style={{ backgroundColor: COLORS.primary }}
            onPress={() => onProductPress(item.product.id)}
          >
            <Text className="text-white text-xs font-semibold text-center">Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVerticalProduct = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => onProductPress(item.product.id)}
      className="flex-row bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden"
      style={{ height: 151 }}
    >
      <View className="bg-gray-100 items-center justify-center relative" style={{ width: 151 }}>
        {item.product.image_url ? (
          <Image
            source={{ uri: item.product.image_url }}
            style={{ width: 151, height: 151 }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="image-outline" size={50} color="#9CA3AF" />
        )}
        {item.custom_label && (
          <View
            className="absolute top-2 left-2 rounded px-2 py-1"
            style={{ backgroundColor: item.custom_label_color }}
          >
            <Text className="text-white text-xs font-bold">{item.custom_label}</Text>
          </View>
        )}
      </View>
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {item.product.name}
          </Text>
          <View className="mb-2">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
              ${item.product.price.toLocaleString('es-AR')}
            </Text>
            {item.product.compare_at_price && item.product.compare_at_price > item.product.price && (
              <Text className="text-xs text-gray-500 line-through">
                ${item.product.compare_at_price.toLocaleString('es-AR')}
              </Text>
            )}
          </View>
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
        {index % 3 !== 2 && (
          <View className="bg-green-50 rounded px-2 py-1 self-start flex-row items-center">
            <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
            <Text className="text-green-600 text-xs font-semibold ml-1">Envío GRATIS</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white py-4 mb-1">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View>
          <Text className="text-lg font-bold text-gray-900">{section.title}</Text>
          {section.subtitle && (
            <Text className="text-xs text-gray-500 mt-0.5">{section.subtitle}</Text>
          )}
        </View>
      </View>

      {section.layout_type === 'vertical' ? (
        <View className="px-4">
          {section.products.map((item, index) => renderVerticalProduct(item, index))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {section.products.map((item, index) => renderHorizontalProduct(item, index))}
        </ScrollView>
      )}
    </View>
  );
}
