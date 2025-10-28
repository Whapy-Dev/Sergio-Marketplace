import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface CategoryItemProps {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
}

export default function CategoryItem({ emoji, label, color, onPress }: CategoryItemProps) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center">
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-1.5"
        style={{ backgroundColor: color }}
      >
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      </View>
      <Text 
        className="text-[11px] text-gray-700 text-center font-medium" 
        style={{ maxWidth: 70 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}