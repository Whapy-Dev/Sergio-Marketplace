import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { getListProducts, removeProductFromList, updateListName, deleteList } from '../../services/favoriteLists';

export default function ListDetailScreen({ route, navigation }: any) {
  const { listId, listName } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentListName, setCurrentListName] = useState(listName);

  useEffect(() => {
    loadProducts();
  }, [listId]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getListProducts(listId);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveProduct(productId: string, productName: string) {
    Alert.alert(
      'Eliminar producto',
      `¿Deseas eliminar "${productName}" de esta lista?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeProductFromList(listId, productId);
            if (success) {
              loadProducts();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  }

  async function handleEditListName() {
    Alert.prompt(
      'Editar nombre',
      'Ingresa el nuevo nombre de la lista',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Guardar',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              const success = await updateListName(listId, newName.trim());
              if (success) {
                setCurrentListName(newName.trim());
              } else {
                Alert.alert('Error', 'No se pudo actualizar el nombre');
              }
            }
          },
        },
      ],
      'plain-text',
      currentListName
    );
  }

  async function handleDeleteList() {
    Alert.alert(
      'Eliminar lista',
      `¿Estás seguro de que deseas eliminar la lista "${currentListName}"?`,
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
              navigation.goBack();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la lista');
            }
          },
        },
      ]
    );
  }

  function handleProductPress(productId: string) {
    navigation.navigate('ProductDetail', { productId });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-[100px] rounded-bl-[40px] rounded-br-[40px]"
      >
        <View className="flex-1 px-5 pt-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white flex-1" numberOfLines={1}>
              {currentListName}
            </Text>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-4"
              onPress={handleEditListName}
            >
              <Ionicons name="pencil-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteList}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Contenido */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mb-2 mt-4">Lista vacía</Text>
          <Text className="text-base text-gray-600 text-center">
            Agrega productos a esta lista desde la pantalla de detalles del producto
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          {products.map((product) => {
            const discount = product.compare_at_price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;
            const priceWithoutTax = Math.round(product.price / 1.21 * 100) / 100;

            return (
              <View
                key={product.id}
                className="border-b border-gray-300 pb-2 mb-4"
                style={{ minHeight: 151 }}
              >
                <View className="flex-row">
                  {/* Imagen del producto */}
                  <TouchableOpacity
                    onPress={() => handleProductPress(product.id)}
                    style={{ width: 133, height: 133 }}
                  >
                    <Image
                      source={{ uri: product.image_url || 'https://via.placeholder.com/133' }}
                      className="w-full h-full rounded-xl"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Información del producto */}
                  <View className="flex-1 ml-3">
                    <TouchableOpacity onPress={() => handleProductPress(product.id)}>
                      <Text className="text-sm font-medium text-gray-900 mb-1" numberOfLines={2}>
                        {product.name}
                      </Text>
                    </TouchableOpacity>

                    {/* Precio anterior tachado */}
                    {product.compare_at_price && (
                      <View className="flex-row items-center mb-0.5 mt-1">
                        <Text className="text-xs text-gray-500 line-through mr-2">
                          ${product.compare_at_price.toLocaleString()}
                        </Text>
                        <View className="rounded overflow-hidden">
                          <LinearGradient
                            colors={['#2563EB', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-2 py-0.5"
                          >
                            <Text className="text-white text-[10px] font-medium">{discount}% OFF</Text>
                          </LinearGradient>
                        </View>
                      </View>
                    )}

                    {/* Precio actual */}
                    <Text className="text-lg font-semibold text-gray-900 mb-0.5">
                      ${product.price.toLocaleString()}
                    </Text>

                    {/* Badge de envío gratis */}
                    {product.free_shipping && (
                      <View className="flex-row mt-2">
                        <View className="rounded overflow-hidden">
                          <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-2 py-0.5"
                          >
                            <Text className="text-white text-[10px] font-light">
                              Envío <Text className="font-bold">GRATIS</Text>
                            </Text>
                          </LinearGradient>
                        </View>
                      </View>
                    )}

                    {/* Botón eliminar de lista */}
                    <TouchableOpacity
                      className="absolute top-0 right-0 p-2"
                      onPress={() => handleRemoveProduct(product.id, product.name)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
