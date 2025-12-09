import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function SplashScreen() {
  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4">
        <Ionicons name="bag-handle" size={48} color={COLORS.primary} />
      </View>
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