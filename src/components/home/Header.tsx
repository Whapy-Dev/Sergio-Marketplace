import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scale, moderateScale, verticalScale, wp } from '../../utils/responsive';

export default function Header() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="bg-white border-b border-gray-200">
      <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(12) }}>
        {/* Logo y Avatar */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: scale(12) }}>
          <Text style={{ fontSize: moderateScale(22), fontWeight: 'bold' }} className="text-primary">
            Marketplace
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            className="rounded-full bg-primary items-center justify-center"
            style={{
              width: scale(40),
              height: scale(40),
            }}
          >
            <Ionicons name="person" size={scale(18)} color="white" />
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda - Navega a SearchScreen */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          className="bg-gray-100 rounded-lg flex-row items-center"
          style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(12),
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={scale(18)} color="#6B7280" style={{ marginRight: scale(8) }} />
          <Text className="text-gray-500">Buscar productos...</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}