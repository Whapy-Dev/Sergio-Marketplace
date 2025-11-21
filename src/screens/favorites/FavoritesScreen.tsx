import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../services/supabase';
import FavoriteProductItem from '../../components/favorites/FavoriteProductItem';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/theme';
import { getUserLists, createList, deleteList, FavoriteList } from '../../services/favoriteLists';

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
          <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
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
          <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
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
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-[100px] rounded-bl-[40px] rounded-br-[40px]"
      >
        <SafeAreaView className="flex-1">
          <View className="px-5 pt-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">
              Mis Favoritos
            </Text>

            <View className="flex-row">
              {/* Icono de notificaciones */}
              <TouchableOpacity
                className="w-7 h-7 items-center justify-center mr-4"
                onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
              >
                <Ionicons name="notifications-outline" size={28} color="white" />
              </TouchableOpacity>

              {/* Icono de carrito */}
              <TouchableOpacity
                className="w-7 h-7 items-center justify-center relative"
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={28} color="white" />
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
        </SafeAreaView>
      </LinearGradient>

      {/* Tabs */}
      <View className="h-[53px] px-5 mt-1 flex-row items-center justify-center">
        <TouchableOpacity
          className={`flex-1 h-11 items-center justify-center border-b-2 ${
            activeTab === 'favorites' ? 'border-black' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('favorites')}
        >
          <Text className={`text-lg ${
            activeTab === 'favorites' ? 'font-medium text-black' : 'font-normal text-gray-400'
          }`}>
            Favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 h-11 items-center justify-center border-b-2 ${
            activeTab === 'lists' ? 'border-black' : 'border-transparent'
          }`}
          onPress={() => setActiveTab('lists')}
        >
          <Text className={`text-lg ${
            activeTab === 'lists' ? 'font-medium text-black' : 'font-normal text-gray-400'
          }`}>
            Listas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de productos o listas */}
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
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
                <Ionicons name="list-outline" size={64} color="#9CA3AF" />
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
                    style={{ height: 151 }}
                    onPress={() => navigation.navigate('ListDetail', { listId: list.id, listName: list.name })}
                  >
                    <View className="flex-row">
                      {/* Preview de imágenes */}
                      <View
                        className="rounded-lg overflow-hidden"
                        style={{
                          width: 133,
                          height: 133,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                        }}
                      >
                        {/* Grid de imágenes de productos */}
                        {list.preview_images && list.preview_images.length > 0 ? (
                          <View className="flex-1">
                            {/* Fila superior: 2 imágenes */}
                            <View className="flex-row absolute top-[10px] left-[9px]">
                              {/* Imagen top-left */}
                              {list.preview_images[0] && (
                                <View
                                  className="bg-white rounded-lg overflow-hidden mr-[5px]"
                                  style={{ width: 55, height: 55 }}
                                >
                                  <Image
                                    source={{ uri: list.preview_images[0] }}
                                    style={{ width: 55, height: 55 }}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}

                              {/* Imagen top-right */}
                              {list.preview_images[1] && (
                                <View
                                  className="bg-white rounded-lg overflow-hidden"
                                  style={{ width: 55, height: 55 }}
                                >
                                  <Image
                                    source={{ uri: list.preview_images[1] }}
                                    style={{ width: 55, height: 55 }}
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
                                  width: 55,
                                  height: 55,
                                  top: 70,
                                  left: 9,
                                }}
                              >
                                <Image
                                  source={{ uri: list.preview_images[2] }}
                                  style={{ width: 55, height: 55 }}
                                  resizeMode="cover"
                                />
                              </View>
                            )}
                          </View>
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Ionicons name="cube-outline" size={40} color="rgba(0,0,0,0.3)" />
                          </View>
                        )}
                      </View>

                      {/* Información de la lista */}
                      <View className="flex-1 ml-[14px]">
                        <Text
                          className="text-xl font-medium text-black"
                          style={{ marginTop: 3 }}
                          numberOfLines={1}
                        >
                          {list.name}
                        </Text>
                        <Text
                          className="text-[15px] font-light text-gray-500"
                          style={{ marginTop: 3 }}
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
                          size={22}
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
                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
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