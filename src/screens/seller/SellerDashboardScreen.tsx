import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerStats, SellerStats } from '../../services/seller';
import { COLORS } from '../../constants/theme';

export default function SellerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    if (!user) return;

    setLoading(true);
    const data = await getSellerStats(user.id);
    setStats(data);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
            <Text className="text-sm text-gray-600">Resumen de tu tienda</Text>
          </View>
          <TouchableOpacity 
            onPress={onRefresh}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Text className="text-xl">🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Tarjetas de estadísticas principales */}
        <View className="px-4 py-4">
          {/* Ingresos totales */}
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-4xl mr-2">💰</Text>
              <Text className="text-white text-sm font-medium opacity-90">Ingresos Totales</Text>
            </View>
            <Text className="text-white text-4xl font-bold mb-1">
              ${stats?.total_revenue.toLocaleString() || 0}
            </Text>
            <Text className="text-white text-sm opacity-80">
              {stats?.total_sales || 0} ventas realizadas
            </Text>
          </View>

          {/* Grid de métricas */}
          <View className="flex-row flex-wrap justify-between mb-4">
            {/* Productos */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-3xl">📦</Text>
                <View className="bg-blue-50 px-2 py-1 rounded">
                  <Text className="text-primary text-xs font-semibold">
                    {stats?.active_products || 0} activos
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.total_products || 0}
              </Text>
              <Text className="text-sm text-gray-600">Productos</Text>
            </View>

            {/* Ventas */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-3xl">📈</Text>
                <View className="bg-green-50 px-2 py-1 rounded">
                  <Text className="text-green-600 text-xs font-semibold">+12%</Text>
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.total_sales || 0}
              </Text>
              <Text className="text-sm text-gray-600">Ventas</Text>
            </View>

            {/* Pedidos pendientes */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-3xl">⏳</Text>
                {stats && stats.pending_orders > 0 && (
                  <View className="bg-yellow-50 px-2 py-1 rounded">
                    <Text className="text-yellow-600 text-xs font-semibold">Pendientes</Text>
                  </View>
                )}
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.pending_orders || 0}
              </Text>
              <Text className="text-sm text-gray-600">Pedidos</Text>
            </View>

            {/* Promedio de venta */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-3xl">💵</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                ${stats && stats.total_sales > 0 
                  ? Math.round(stats.total_revenue / stats.total_sales).toLocaleString() 
                  : 0}
              </Text>
              <Text className="text-sm text-gray-600">Promedio venta</Text>
            </View>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Acciones Rápidas</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('CreateProduct')}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
              <Text className="text-2xl">➕</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Publicar Producto</Text>
              <Text className="text-sm text-gray-600">Agrega un nuevo producto a tu tienda</Text>
            </View>
            <Text className="text-gray-400 text-xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyProducts')}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mr-4">
              <Text className="text-2xl">📦</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Mis Productos</Text>
              <Text className="text-sm text-gray-600">Gestiona tu inventario</Text>
            </View>
            <Text className="text-gray-400 text-xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SellerOrders')}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-yellow-50 items-center justify-center mr-4">
              <Text className="text-2xl">📋</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Pedidos</Text>
              <Text className="text-sm text-gray-600">Ver y gestionar pedidos</Text>
            </View>
            {stats && stats.pending_orders > 0 && (
              <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">{stats.pending_orders}</Text>
              </View>
            )}
            <Text className="text-gray-400 text-xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SellerAnalytics')}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-100"
          >
            <View className="w-12 h-12 rounded-full bg-purple-50 items-center justify-center mr-4">
              <Text className="text-2xl">📊</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Análisis Detallado</Text>
              <Text className="text-sm text-gray-600">Estadísticas y gráficos</Text>
            </View>
            <Text className="text-gray-400 text-xl">→</Text>
          </TouchableOpacity>
        </View>

        {/* Tips para vendedores */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">💡 Tips para Vender Más</Text>

          <View className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-100">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">📸</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  Agrega fotos de calidad
                </Text>
                <Text className="text-sm text-gray-600">
                  Los productos con buenas fotos venden 3x más
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-100">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">🚚</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  Ofrece envío gratis
                </Text>
                <Text className="text-sm text-gray-600">
                  Aumenta tus ventas hasta un 50%
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">⚡</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  Responde rápido
                </Text>
                <Text className="text-sm text-gray-600">
                  Los vendedores que responden en menos de 1 hora venden 2x más
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}