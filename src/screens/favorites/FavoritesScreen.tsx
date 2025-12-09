import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../services/supabase';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import FavoriteProductItem from '../../components/favorites/FavoriteProductItem';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';
import { getUserLists, createList, deleteList, FavoriteList } from '../../services/favoriteLists';
import { scale, moderateScale, verticalScale } from '../../utils/responsive';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  free_shipping: boolean;
  image_url: string | null;
}

export default function FavoritesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { favorites, loading: favoritesLoading, refreshFavorites } = useFavorites();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'lists'>('favorites');
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavoriteProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favorites, user]);

  useEffect(() => {
    if (user && activeTab === 'lists') {
      loadLists();
    }
  }, [user, activeTab]);

  async function loadFavoriteProducts() {
    if (!user || favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_at_price, stock, free_shipping, image_url')
        .in('id', favorites)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading favorite products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLists() {
    if (!user) return;

    try {
      setListsLoading(true);
      const data = await getUserLists(user.id);
      setLists(data);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setListsLoading(false);
    }
  }

  async function handleCreateList() {
    if (!user) return;

    Alert.prompt(
      'Nueva lista',
      'Ingresa el nombre de la lista',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Crear',
          onPress: async (listName) => {
            if (listName && listName.trim()) {
              const newList = await createList(user.id, listName.trim());
              if (newList) {
                loadLists();
              } else {
                Alert.alert('Error', 'No se pudo crear la lista');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }

  async function handleDeleteList(listId: string, listName: string) {
    Alert.alert(
      'Eliminar lista',
      `¿Estás seguro de que deseas eliminar la lista "${listName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteList(listId);
            if (success) {
              loadLists();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la lista');
            }
          },
        },
      ]
    );
  }

  function handleProductPress(productId: string) {
    // Navegar al stack de Home y luego a ProductDetail
    navigation.navigate('Home', {
      screen: 'ProductDetail',
      params: { productId }
    });
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={scale(64)} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mb-2 mt-4">Inicia sesión</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Debes iniciar sesión para guardar tus productos favoritos
          </Text>
          <Button
            title="Iniciar sesión"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading || favoritesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Mis Favoritos</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={scale(64)} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mb-2 mt-4">No tienes favoritos</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Explora productos y guarda los que más te gusten
          </Text>
          <Button
            title="Explorar productos"
            onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 12,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="px-5 py-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-white">
            Mis Favoritos
          </Text>

          <View className="flex-row items-center">
            {/* Icono de notificaciones */}
            <TouchableOpacity
              className="mr-4 p-1"
              onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* Icono de carrito */}
            <TouchableOpacity
              className="p-1 relative"
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={24} color="white" />
              {totalItems > 0 && (
                <View className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-[10px] font-bold text-primary">
                    {totalItems > 9 ? '9+' : totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View className="flex-row px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'favorites' ? 'border-primary' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('favorites')}
        >
          <Text className={`text-base ${
            activeTab === 'favorites' ? 'font-semibold text-primary' : 'font-normal text-gray-400'
          }`}>
            Favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'lists' ? 'border-primary' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('lists')}
        >
          <Text className={`text-base ${
            activeTab === 'lists' ? 'font-semibold text-primary' : 'font-normal text-gray-400'
          }`}>
            Listas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de productos o listas */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}>
        {activeTab === 'favorites' ? (
          products.map((product) => (
            <FavoriteProductItem
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              compareAtPrice={product.compare_at_price}
              imageUrl={product.image_url || undefined}
              onPress={() => handleProductPress(product.id)}
            />
          ))
        ) : (
          <View>
            {listsLoading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : lists.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="list-outline" size={scale(64)} color="#9CA3AF" />
                <Text className="text-lg font-bold text-gray-900 mb-2 mt-4">
                  No tienes listas
                </Text>
                <Text className="text-base text-gray-600 text-center px-6 mb-6">
                  Crea listas para organizar tus productos favoritos
                </Text>
                <Button
                  title="Crear lista"
                  onPress={handleCreateList}
                />
              </View>
            ) : (
              <>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    className="border-b border-gray-300 pb-2"
                    style={{ height: verticalScale(151) }}
                    onPress={() => navigation.navigate('ListDetail', { listId: list.id, listName: list.name })}
                  >
                    <View className="flex-row">
                      {/* Preview de imágenes */}
                      <View
                        className="rounded-lg overflow-hidden"
                        style={{
                          width: scale(133),
                          height: scale(133),
                          backgroundColor: 'rgba(0,0,0,0.1)',
                        }}
                      >
                        {/* Grid de imágenes de productos */}
                        {list.preview_images && list.preview_images.length > 0 ? (
                          <View className="flex-1">
                            {/* Fila superior: 2 imágenes */}
                            <View style={{ flexDirection: 'row', position: 'absolute', top: scale(10), left: scale(9) }}>
                              {/* Imagen top-left */}
                              {list.preview_images[0] && (
                                <View
                                  className="bg-white rounded-lg overflow-hidden"
                                  style={{ width: scale(55), height: scale(55), marginRight: scale(5) }}
                                >
                                  <Image
                                    source={{ uri: list.preview_images[0] }}
                                    style={{ width: scale(55), height: scale(55) }}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}

                              {/* Imagen top-right */}
                              {list.preview_images[1] && (
                                <View
                                  className="bg-white rounded-lg overflow-hidden"
                                  style={{ width: scale(55), height: scale(55) }}
                                >
                                  <Image
                                    source={{ uri: list.preview_images[1] }}
                                    style={{ width: scale(55), height: scale(55) }}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}
                            </View>

                            {/* Imagen bottom-left */}
                            {list.preview_images[2] && (
                              <View
                                className="bg-white rounded-lg overflow-hidden absolute"
                                style={{
                                  width: scale(55),
                                  height: scale(55),
                                  top: scale(70),
                                  left: scale(9),
                                }}
                              >
                                <Image
                                  source={{ uri: list.preview_images[2] }}
                                  style={{ width: scale(55), height: scale(55) }}
                                  resizeMode="cover"
                                />
                              </View>
                            )}
                          </View>
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Ionicons name="cube-outline" size={scale(40)} color="rgba(0,0,0,0.3)" />
                          </View>
                        )}
                      </View>

                      {/* Información de la lista */}
                      <View style={{ flex: 1, marginLeft: scale(14) }}>
                        <Text
                          className="text-xl font-medium text-black"
                          style={{ marginTop: scale(3) }}
                          numberOfLines={1}
                        >
                          {list.name}
                        </Text>
                        <Text
                          className="text-[15px] font-light text-gray-500"
                          style={{ marginTop: scale(3) }}
                        >
                          {list.product_count || 0} productos
                        </Text>
                      </View>

                      {/* Botón de menú */}
                      <TouchableOpacity
                        className="absolute top-0 right-0 p-2"
                        onPress={() => handleDeleteList(list.id, list.name)}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={scale(22)}
                          color="#000"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Botón para crear nueva lista */}
                <TouchableOpacity
                  className="mt-4 py-4 border border-gray-300 rounded-lg items-center justify-center"
                  onPress={handleCreateList}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="add-circle-outline" size={scale(24)} color={COLORS.primary} />
                    <Text className="text-base font-medium ml-2" style={{ color: COLORS.primary }}>
                      Crear nueva lista
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}