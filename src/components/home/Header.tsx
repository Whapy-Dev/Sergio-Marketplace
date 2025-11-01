import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Header() {
  return (
    <LinearGradient
      colors={['#11CCEE', '#0EA5C9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      {/* Logo y notificaciones */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">tofit</Text>
        <TouchableOpacity>
          <Text className="text-white text-2xl">🔔</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}