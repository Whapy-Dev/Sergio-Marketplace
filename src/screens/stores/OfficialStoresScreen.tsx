import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getOfficialStores } from '../../services/officialStores';
import type { OfficialStore } from '../../types/officialStore';
import { COLORS } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

export default function OfficialStoresScreen({ navigation }: any) {
  const [stores, setStores] = useState<OfficialStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    const data = await getOfficialStores(50);
    setStores(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  }

  function handleStorePress(store: OfficialStore) {
    navigation.navigate('StoreDetail', { storeId: store.id, storeName: store.store_name });
  }

  function renderStoreCard({ item }: { item: OfficialStore }) {
    return (
      <TouchableOpacity
        onPress={() => handleStorePress(item)}
        className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-200"
        activeOpacity={0.7}
      >
        {/* Banner */}
        {item.banner_url ? (
          <Image
            source={{ uri: item.banner_url }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#2563EB', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-32"
          />
        )}

        {/* Logo */}
        <View className="absolute top-20 left-4 w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg">
          {item.logo_url ? (
            <Image
              source={{ uri: item.logo_url }}
              className="w-full h-full rounded-xl"
              resizeMode="contain"
            />
          ) : (
            <View className="w-full h-full rounded-xl bg-gray-100 items-center justify-center">
              <Ionicons name="storefront" size={scale(40)} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Verified Badge */}
        <View className="absolute top-2 right-2 bg-blue-500 rounded-full px-3 py-1.5 flex-row items-center">
          <Ionicons name="checkmark-circle" size={scale(14)} color="white" />
          <Text className="text-white text-xs font-bold ml-1">OFICIAL</Text>
        </View>

        {/* Store Info */}
        <View className="pt-14 pb-4 px-4">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {item.store_name}
          </Text>

          {item.description && (
            <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Stats */}
          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            {/* Rating */}
            <View className="flex-row items-center">
              <Ionicons name="star" size={scale(16)} color="#FBBF24" />
              <Text className="text-sm font-semibold text-gray-900 ml-1">
                {item.rating.toFixed(1)}
              </Text>
            </View>

            {/* Products */}
            <View className="flex-row items-center">
              <Ionicons name="cube-outline" size={scale(16)} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {item.total_products} productos
              </Text>
            </View>

            {/* Followers */}
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={scale(16)} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {item.followers_count} seguidores
              </Text>
            </View>
          </View>

          {/* Location */}
          {item.city && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="location-outline" size={scale(14)} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {item.city}, {item.state || item.country}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#2563EB', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pb-4"
        >
          <View className="flex-row items-center justify-between px-4 pt-2">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <Ionicons name="arrow-back" size={scale(24)} color="white" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Tiendas Oficiales</Text>
            <View style={{ width: scale(10) }} />
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-gray-500 mt-2">Cargando tiendas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pb-4"
      >
        <View className="flex-row items-center justify-between px-4 pt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={scale(24)} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Tiendas Oficiales</Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="search" size={scale(24)} color="white" />
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View className="mx-4 mt-3 bg-white/20 rounded-xl px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={scale(20)} color="white" />
            <Text className="text-white text-sm font-medium ml-2 flex-1">
              Tiendas verificadas con garantía oficial
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Store List */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={renderStoreCard}
        contentContainerStyle={{ padding: scale(16) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="storefront-outline" size={scale(80)} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              No hay tiendas oficiales
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              Las tiendas oficiales aparecerán aquí una vez que sean aprobadas
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
