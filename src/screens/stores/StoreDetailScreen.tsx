import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getOfficialStoreById,
  followStore,
  unfollowStore,
} from '../../services/officialStores';
import type { OfficialStoreWithDetails } from '../../types/officialStore';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function StoreDetailScreen({ route, navigation }: any) {
  const { storeId } = route.params;
  const { user } = useAuth();
  const [store, setStore] = useState<OfficialStoreWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadStore();
  }, [storeId]);

  async function loadStore() {
    setLoading(true);
    const data = await getOfficialStoreById(storeId, user?.id);
    if (data) {
      setStore(data);
      setIsFollowing(data.is_followed || false);
    }
    setLoading(false);
  }

  async function handleFollowToggle() {
    if (!user) {
      // Redirect to login
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    setFollowLoading(true);
    if (isFollowing) {
      const success = await unfollowStore(user.id, storeId);
      if (success) {
        setIsFollowing(false);
        if (store) {
          setStore({
            ...store,
            followers_count: store.followers_count - 1,
          });
        }
      }
    } else {
      const success = await followStore(user.id, storeId);
      if (success) {
        setIsFollowing(true);
        if (store) {
          setStore({
            ...store,
            followers_count: store.followers_count + 1,
          });
        }
      }
    }
    setFollowLoading(false);
  }

  function handleProductPress(productId: string) {
    navigation.navigate('ProductDetail', { productId });
  }

  function renderProduct({ item }: { item: any }) {
    const discount = item.compare_at_price
      ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
      : 0;

    return (
      <TouchableOpacity
        onPress={() => handleProductPress(item.id)}
        className="mb-4"
        style={{ width: (width - 48) / 2 }}
      >
        <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
          {/* Product Image */}
          <View className="relative">
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                className="w-full h-40"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-40 bg-gray-100 items-center justify-center">
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              </View>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <View className="absolute top-2 left-2 bg-green-500 rounded-lg px-2 py-1">
                <Text className="text-white text-xs font-bold">-{discount}%</Text>
              </View>
            )}

            {/* Official Badge */}
            <View className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
              <Ionicons name="checkmark-circle" size={16} color="white" />
            </View>
          </View>

          {/* Product Info */}
          <View className="p-3">
            <Text className="text-sm text-gray-900 font-medium" numberOfLines={2}>
              {item.name}
            </Text>

            {item.compare_at_price && (
              <Text className="text-xs text-gray-400 line-through mt-1">
                ${item.compare_at_price.toLocaleString()}
              </Text>
            )}

            <Text className="text-lg font-bold text-gray-900 mt-0.5">
              ${item.price.toLocaleString()}
            </Text>

            {item.free_shipping && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-xs text-green-600 font-medium ml-1">
                  Envío gratis
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-semibold text-gray-900 mt-4">
            Tienda no encontrada
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header with Back Button */}
      <View className="absolute top-12 left-0 right-0 z-10 flex-row items-center justify-between px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-lg">
          <Ionicons name="share-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="relative">
          {store.banner_url ? (
            <Image
              source={{ uri: store.banner_url }}
              className="w-full h-52"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#2563EB', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-52"
            />
          )}
        </View>

        {/* Store Info Card */}
        <View className="mx-4 -mt-16 bg-white rounded-2xl shadow-lg p-6 mb-4">
          {/* Logo and Follow Button */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-20 h-20 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                {store.logo_url ? (
                  <Image
                    source={{ uri: store.logo_url }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-gray-100">
                    <Ionicons name="storefront" size={32} color="#9CA3AF" />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-xl font-bold text-gray-900 flex-1">
                    {store.store_name}
                  </Text>
                  <View className="bg-blue-100 rounded-full px-2 py-1">
                    <Text className="text-blue-700 text-xs font-bold">OFICIAL</Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text className="text-sm font-semibold text-gray-900 ml-1">
                    {store.rating.toFixed(1)}
                  </Text>
                  <Text className="text-sm text-gray-500 ml-1">
                    ({store.metrics?.total_reviews || 0} reseñas)
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            onPress={handleFollowToggle}
            disabled={followLoading}
            className={`rounded-full py-3 flex-row items-center justify-center ${
              isFollowing ? 'bg-gray-200' : 'bg-blue-600'
            }`}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? '#6B7280' : 'white'} />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? 'checkmark-circle' : 'add-circle-outline'}
                  size={20}
                  color={isFollowing ? '#6B7280' : 'white'}
                />
                <Text
                  className={`ml-2 font-bold ${
                    isFollowing ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir tienda'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Stats */}
          <View className="flex-row items-center justify-around mt-4 pt-4 border-t border-gray-100">
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {store.total_products}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">Productos</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {store.followers_count}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">Seguidores</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {store.total_sales}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">Ventas</Text>
            </View>
          </View>

          {/* Description */}
          {store.description && (
            <Text className="text-sm text-gray-600 mt-4 leading-5">
              {store.description}
            </Text>
          )}

          {/* Contact Info */}
          {(store.city || store.phone || store.email) && (
            <View className="mt-4 pt-4 border-t border-gray-100">
              {store.city && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-700 ml-2">
                    {store.city}, {store.state}
                  </Text>
                </View>
              )}
              {store.phone && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="call" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-700 ml-2">{store.phone}</Text>
                </View>
              )}
              {store.website && (
                <View className="flex-row items-center">
                  <Ionicons name="globe" size={16} color="#6B7280" />
                  <Text className="text-sm text-blue-600 ml-2">{store.website}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Products Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Productos</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {store.products && store.products.length > 0 ? (
            <FlatList
              data={store.products}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              scrollEnabled={false}
            />
          ) : (
            <View className="bg-white rounded-xl p-8 items-center">
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No hay productos disponibles</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
