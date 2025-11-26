import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerStats, SellerStats } from '../../services/seller';
import { COLORS } from '../../constants/theme';
import { scale } from '../../utils/responsive';

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
            <Text className="text-xl font-bold text-gray-900">Mi Dashboard</Text>
            <Text className="text-xs text-gray-500">Resumen de ventas</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="refresh" size={scale(18)} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Balance Disponible */}
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            className="bg-primary rounded-2xl p-5 mb-4"
            style={{ backgroundColor: COLORS.primary }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-sm opacity-90">Balance Disponible</Text>
              <Ionicons name="wallet-outline" size={scale(20)} color="rgba(255,255,255,0.8)" />
            </View>
            <Text className="text-white text-3xl font-bold mb-1">
              ${stats?.available_balance.toLocaleString() || 0}
            </Text>
            <Text className="text-white text-xs opacity-80">
              Toca para retirar →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Métricas principales */}
        <View className="px-4">
          <View className="flex-row flex-wrap justify-between">
            {/* Ventas Hoy */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="today-outline" size={scale(20)} color="#10B981" />
                <Text className="text-xs text-gray-500">Hoy</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900">
                ${stats?.revenue_today.toLocaleString() || 0}
              </Text>
              <Text className="text-xs text-gray-500">
                {stats?.sales_today || 0} ventas
              </Text>
            </View>

            {/* Ventas Mes */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="calendar-outline" size={scale(20)} color="#3B82F6" />
                <Text className="text-xs text-gray-500">Este mes</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900">
                ${stats?.revenue_month.toLocaleString() || 0}
              </Text>
              <Text className="text-xs text-gray-500">
                {stats?.sales_month || 0} ventas
              </Text>
            </View>

            {/* Pedidos Pendientes */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="time-outline" size={scale(20)} color="#F59E0B" />
                {stats && stats.pending_orders > 0 && (
                  <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{stats.pending_orders}</Text>
                  </View>
                )}
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {stats?.pending_orders || 0}
              </Text>
              <Text className="text-xs text-gray-500">Pendientes</Text>
            </View>

            {/* Productos Activos */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="cube-outline" size={scale(20)} color="#8B5CF6" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {stats?.active_products || 0}
              </Text>
              <Text className="text-xs text-gray-500">Productos activos</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View className="px-4 py-4">
          <Text className="text-sm font-bold text-gray-700 mb-3">ACCIONES RÁPIDAS</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('CreateProduct')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="add" size={scale(22)} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Publicar Producto</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SellerOrders')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mr-3">
              <Ionicons name="list" size={scale(22)} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Ver Pedidos</Text>
            </View>
            {stats && stats.pending_orders > 0 && (
              <View className="bg-red-500 rounded-full px-2 py-0.5 mr-2">
                <Text className="text-white text-xs font-bold">{stats.pending_orders}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={scale(18)} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyProducts')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
              <Ionicons name="cube" size={scale(22)} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Mis Productos</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            className="bg-white rounded-xl p-4 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-3">
              <Ionicons name="wallet" size={scale(22)} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Retirar Dinero</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Resumen Total */}
        <View className="px-4 pb-6">
          <View className="bg-gray-100 rounded-xl p-4">
            <Text className="text-xs font-bold text-gray-500 mb-3">RESUMEN TOTAL</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Total vendido</Text>
              <Text className="text-sm font-semibold text-gray-900">
                ${stats?.total_revenue.toLocaleString() || 0}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Total ventas</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {stats?.total_sales || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Promedio por venta</Text>
              <Text className="text-sm font-semibold text-gray-900">
                ${stats && stats.total_sales > 0
                  ? Math.round(stats.total_revenue / stats.total_sales).toLocaleString()
                  : 0}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
