import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerProducts, deleteProduct, SellerProduct } from '../../services/seller';
import { COLORS } from '../../constants/theme';

const STATUS_LABELS = {
  active: { label: 'Activo', color: 'text-green-600', bg: 'bg-green-100' },
  inactive: { label: 'Inactivo', color: 'text-gray-600', bg: 'bg-gray-100' },
  sold_out: { label: 'Agotado', color: 'text-red-600', bg: 'bg-red-100' },
};

export default function MyProductsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    if (!user) return;

    setLoading(true);
    const data = await getSellerProducts(user.id);
    setProducts(data);
    setLoading(false);
  }

  function handleDeleteProduct(productId: string, productName: string) {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro que deseas eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteProduct(productId);
            if (result.success) {
              Alert.alert('Producto Eliminado', 'El producto se eliminó correctamente');
              loadProducts();
            } else {
              Alert.alert('Error', result.error || 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-primary text-2xl font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Mis Publicaciones</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateProduct')}
          className="bg-primary rounded-lg px-4 py-2"
        >
          <Text className="text-white font-semibold">+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Sin productos</Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Todavía no publicaste ningún producto
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CreateProduct')}
            className="bg-primary rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Publicar Producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {products.map((product) => {
            const statusInfo = STATUS_LABELS[product.status];

            return (
              <View
                key={product.id}
                className="mx-4 my-2 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <View className="flex-row">
                  {/* Imagen */}
                  <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-3">
                    <Text className="text-3xl">📦</Text>
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View className={`px-2 py-1 rounded ${statusInfo.bg} ml-2`}>
                        <Text className={`text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-gray-600 mb-2">
                      Stock: {product.stock} unidades
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-bold text-primary">
                        ${product.price.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {product.views || 0} visitas
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Acciones */}
                <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                    className="flex-1 mr-2 bg-blue-50 rounded-lg py-2"
                  >
                    <Text className="text-primary font-semibold text-center">Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(product.id, product.name)}
                    className="flex-1 ml-2 bg-red-50 rounded-lg py-2"
                  >
                    <Text className="text-red-600 font-semibold text-center">Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}