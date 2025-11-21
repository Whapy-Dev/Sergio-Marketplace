import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getStoreStats, StoreStats, StatsPeriod } from '../../services/storeStats';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function OfficialStoreDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<StatsPeriod>('30d');

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    if (!user) return;
    setLoading(true);
    const data = await getStoreStats(user.id, period);
    setStats(data);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  const periodLabels: Record<StatsPeriod, string> = {
    'today': 'Hoy',
    '7d': '7 días',
    '30d': '30 días',
    '90d': '90 días',
  };

  const getPeriodRevenue = () => {
    if (!stats) return 0;
    switch (period) {
      case 'today': return stats.revenue_today;
      case '7d': return stats.revenue_week;
      case '30d': return stats.revenue_month;
      case '90d': return stats.revenue_quarter;
    }
  };

  const getPeriodSales = () => {
    if (!stats) return 0;
    switch (period) {
      case 'today': return stats.sales_today;
      case '7d': return stats.sales_week;
      case '30d': return stats.sales_month;
      case '90d': return stats.sales_quarter;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Calcular máximo para el gráfico
  const maxRevenue = Math.max(...(stats?.daily_revenue.map(d => d.revenue) || [1]));

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Dashboard Pro</Text>
            <Text className="text-xs text-gray-500">Tienda Oficial</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="refresh" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Period Selector */}
        <View className="px-4 pt-4">
          <View className="flex-row bg-white rounded-xl p-1 border border-gray-200">
            {(['today', '7d', '30d', '90d'] as StatsPeriod[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 py-2 rounded-lg ${period === p ? 'bg-blue-500' : ''}`}
              >
                <Text className={`text-center text-sm font-medium ${period === p ? 'text-white' : 'text-gray-600'}`}>
                  {periodLabels[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Revenue Card */}
        <View className="px-4 pt-4">
          <View className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5" style={{ backgroundColor: '#2563EB' }}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-sm opacity-90">Ingresos {periodLabels[period]}</Text>
              <View className={`flex-row items-center px-2 py-1 rounded-full ${stats && stats.revenue_change_percent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Ionicons
                  name={stats && stats.revenue_change_percent >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={stats && stats.revenue_change_percent >= 0 ? '#10B981' : '#EF4444'}
                />
                <Text className={`text-xs ml-1 ${stats && stats.revenue_change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats?.revenue_change_percent >= 0 ? '+' : ''}{stats?.revenue_change_percent || 0}%
                </Text>
              </View>
            </View>
            <Text className="text-white text-3xl font-bold mb-2">
              ${getPeriodRevenue().toLocaleString()}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-white text-sm opacity-80">
                {getPeriodSales()} ventas
              </Text>
              <View className="w-1 h-1 bg-white/50 rounded-full mx-2" />
              <Text className="text-white text-sm opacity-80">
                Ticket: ${stats?.average_order_value.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Mini Chart */}
        <View className="px-4 pt-4">
          <View className="bg-white rounded-xl p-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-700 mb-3">Ventas del período</Text>
            <View className="flex-row items-end h-20">
              {stats?.daily_revenue.slice(-14).map((day, index) => {
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 80 : 0;
                return (
                  <View key={index} className="flex-1 items-center mx-0.5">
                    <View
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: Math.max(height, 2), minHeight: 2 }}
                    />
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-gray-400">
                {stats?.daily_revenue[0]?.date.slice(5) || ''}
              </Text>
              <Text className="text-xs text-gray-400">
                {stats?.daily_revenue[stats.daily_revenue.length - 1]?.date.slice(5) || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Métricas principales */}
        <View className="px-4 pt-4">
          <View className="flex-row flex-wrap justify-between">
            {/* Balance */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Wallet')}
              className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="wallet-outline" size={20} color="#10B981" />
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                ${stats?.available_balance.toLocaleString() || 0}
              </Text>
              <Text className="text-xs text-gray-500">Balance disponible</Text>
            </TouchableOpacity>

            {/* Pedidos Pendientes */}
            <TouchableOpacity
              onPress={() => navigation.navigate('SellerOrders')}
              className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                {stats && stats.pending_orders > 0 && (
                  <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{stats.pending_orders}</Text>
                  </View>
                )}
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {stats?.pending_orders || 0}
              </Text>
              <Text className="text-xs text-gray-500">Pedidos pendientes</Text>
            </TouchableOpacity>

            {/* Conversión */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {stats?.conversion_rate || 0}%
              </Text>
              <Text className="text-xs text-gray-500">Tasa conversión</Text>
            </View>

            {/* Clientes */}
            <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="people-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {stats?.total_customers || 0}
              </Text>
              <Text className="text-xs text-gray-500">
                {stats?.repeat_customers || 0} recurrentes
              </Text>
            </View>
          </View>
        </View>

        {/* Métricas avanzadas */}
        <View className="px-4">
          <View className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
            <Text className="text-xs font-bold text-gray-500 mb-3">MÉTRICAS AVANZADAS</Text>
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">{stats?.total_views.toLocaleString() || 0}</Text>
                <Text className="text-xs text-gray-500">Visitas totales</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">{stats?.active_products || 0}</Text>
                <Text className="text-xs text-gray-500">Productos activos</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">${stats?.total_revenue.toLocaleString() || 0}</Text>
                <Text className="text-xs text-gray-500">Total histórico</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Productos Más Vendidos */}
        {stats && stats.top_selling_products.length > 0 && (
          <View className="px-4 mb-3">
            <View className="bg-white rounded-xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-gray-500">TOP VENDIDOS</Text>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
              </View>
              {stats.top_selling_products.map((product, index) => (
                <View key={product.id} className="flex-row items-center py-2 border-b border-gray-50 last:border-0">
                  <Text className="text-sm font-bold text-gray-400 w-6">{index + 1}</Text>
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} className="w-10 h-10 rounded-lg mr-3" />
                  ) : (
                    <View className="w-10 h-10 rounded-lg bg-gray-100 mr-3 items-center justify-center">
                      <Ionicons name="cube-outline" size={20} color="#9CA3AF" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{product.name}</Text>
                    <Text className="text-xs text-gray-500">{product.sales} vendidos</Text>
                  </View>
                  <Text className="text-sm font-bold text-green-600">${product.revenue.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Productos Más Vistos */}
        {stats && stats.top_viewed_products.length > 0 && (
          <View className="px-4 mb-3">
            <View className="bg-white rounded-xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-gray-500">MÁS VISTOS</Text>
                <Ionicons name="eye" size={16} color="#3B82F6" />
              </View>
              {stats.top_viewed_products.map((product, index) => (
                <View key={product.id} className="flex-row items-center py-2 border-b border-gray-50 last:border-0">
                  <Text className="text-sm font-bold text-gray-400 w-6">{index + 1}</Text>
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} className="w-10 h-10 rounded-lg mr-3" />
                  ) : (
                    <View className="w-10 h-10 rounded-lg bg-gray-100 mr-3 items-center justify-center">
                      <Ionicons name="cube-outline" size={20} color="#9CA3AF" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{product.name}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
                    <Text className="text-sm text-gray-600 ml-1">{product.views.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Inventario Bajo */}
        {stats && stats.low_stock_products.length > 0 && (
          <View className="px-4 mb-3">
            <View className="bg-red-50 rounded-xl p-4 border border-red-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-red-600">INVENTARIO BAJO</Text>
                <Ionicons name="warning" size={16} color="#EF4444" />
              </View>
              {stats.low_stock_products.map((product) => (
                <View key={product.id} className="flex-row items-center py-2 border-b border-red-100/50 last:border-0">
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} className="w-10 h-10 rounded-lg mr-3" />
                  ) : (
                    <View className="w-10 h-10 rounded-lg bg-red-100 mr-3 items-center justify-center">
                      <Ionicons name="cube-outline" size={20} color="#EF4444" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{product.name}</Text>
                  </View>
                  <View className="bg-red-500 rounded-full px-2 py-1">
                    <Text className="text-xs font-bold text-white">{product.stock} uds</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Acciones Rápidas */}
        <View className="px-4 py-4">
          <Text className="text-xs font-bold text-gray-500 mb-3">ACCIONES RÁPIDAS</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('CreateProduct')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="add" size={22} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Publicar Producto</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SellerOrders')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mr-3">
              <Ionicons name="list" size={22} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Gestionar Pedidos</Text>
            </View>
            {stats && stats.pending_orders > 0 && (
              <View className="bg-red-500 rounded-full px-2 py-0.5 mr-2">
                <Text className="text-white text-xs font-bold">{stats.pending_orders}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyProducts')}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
              <Ionicons name="cube" size={22} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Catálogo de Productos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Wallet')}
            className="bg-white rounded-xl p-4 flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-3">
              <Ionicons name="wallet" size={22} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Retirar Fondos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Resumen Total */}
        <View className="px-4 pb-6">
          <View className="bg-gray-100 rounded-xl p-4">
            <Text className="text-xs font-bold text-gray-500 mb-3">RESUMEN HISTÓRICO</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Total vendido (histórico)</Text>
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
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Total productos</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {stats?.total_products || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Clientes totales</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {stats?.total_customers || 0}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
