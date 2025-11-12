import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Header() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="bg-white border-b border-gray-200">
      <View className="px-4 py-3">
        {/* Logo y Avatar */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-primary">
            Marketplace
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
          >
            <Text className="text-white text-lg">👤</Text>
          </TouchableOpacity>
        </View>
        
        {/* Barra de búsqueda - Navega a SearchScreen */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Search')}
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