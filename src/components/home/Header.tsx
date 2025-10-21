import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  navigation?: any;
}

export default function Header({ navigation }: HeaderProps) {
  return (
    <SafeAreaView className="bg-white border-b border-gray-200">
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-primary">Marketplace</Text>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-lg">👤</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-gray-100 rounded-lg px-4 py-3 flex-row items-center"
          activeOpacity={0.7}
          onPress={() => navigation?.push('Search')}
        >
          <Text className="text-lg mr-2">🔍</Text>
          <Text className="text-gray-500">Buscar productos...</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}