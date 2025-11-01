import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Header() {
  return (
    <SafeAreaView className="bg-white border-b border-gray-200">
      <View className="px-4 py-3">
        {/* Logo y Avatar */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-primary">
            Yo Compro
          </Text>
          
          {/* Avatar - Por ahora un círculo simple */}
          <TouchableOpacity className="w-10 h-10 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-lg">👤</Text>
          </TouchableOpacity>
        </View>
        
        {/* Barra de búsqueda */}
        <TouchableOpacity 
          className="bg-gray-100 rounded-lg px-4 py-3 flex-row items-center"
          activeOpacity={0.7}
        >
          <Text className="text-lg mr-2">🔍</Text>
          <Text className="text-gray-500">Buscar productos...</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}