import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { scale, moderateScale, verticalScale, wp } from '../../utils/responsive';

interface CategoryItemProps {
  name: string;
  icon: string;
  onPress: () => void;
}

export default function CategoryItem({ name, icon, onPress }: CategoryItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center"
      activeOpacity={0.7}
      style={{ marginRight: scale(16) }}
    >
      <View
        className="rounded-full bg-blue-50 items-center justify-center"
        style={{
          width: scale(64),
          height: scale(64),
          marginBottom: scale(8),
        }}
      >
        <Text style={{ fontSize: scale(32) }}>{icon}</Text>
      </View>
      <Text
        className="text-xs text-gray-700 text-center"
        numberOfLines={2}
        style={{ width: scale(80) }}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}