import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface CategoryItemProps {
  name: string;
  icon: string;
  onPress: () => void;
}

export default function CategoryItem({ name, icon, onPress }: CategoryItemProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="items-center mr-4"
      activeOpacity={0.7}
    >
      <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-2">
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className="text-xs text-gray-700 text-center w-20" numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}