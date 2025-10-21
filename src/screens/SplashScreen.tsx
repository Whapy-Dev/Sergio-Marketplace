import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

export default function SplashScreen() {
  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <Text className="text-5xl mb-4">🛍️</Text>
      <Text className="text-3xl font-bold text-white mb-2">
        Marketplace
      </Text>
      <Text className="text-base text-white mb-8">
        Formosa, Argentina
      </Text>
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}