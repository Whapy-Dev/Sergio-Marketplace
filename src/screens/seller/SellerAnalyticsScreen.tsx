import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProductStats {
  id: string;
  name: string;
  views: number;
  sales: number;
  revenue: number;
}

export default function SellerAnalyticsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    if (!user) return;

    try {
      setLoading(true);

      const { data: salesData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products!inner(
            id,
            name,
            seller_id,
            views
          )
        `)
        .eq('products.seller_id', user.id);

      const productMap = new Map<string, ProductStats>();

      salesData?.forEach((item: any) => {
        const productId = item.product_id;
        const existing = productMap.get(productId);

        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productMap.set(productId, {
            id: productId,
            name: item.products.name,
            views: item.products.views || 0,
            sales: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });

      const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setTopProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Text className="text-primary text-2xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Análisis Detallado</Text>
      </View>

      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setPeriod('week')}
            className={`flex-1 py-2 rounded-lg mr-2 ${period === 'week' ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-semibold ${period === 'week' ? 'text-white' : 'text-gray-700'}`}>
              Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('month')}
            className={`flex-1 py-2 rounded-lg mx-1 ${period === 'month' ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-semibold ${period === 'month' ? 'text-white' : 'text-gray-700'}`}>
              Mes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('year')}
            className={`flex-1 py-2 rounded-lg ml-2 ${period === 'year' ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-semibold ${period === 'year' ? 'text-white' : 'text-gray-700'}`}>
              Año
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">🏆 Top 10 Productos</Text>

          {topProducts.length === 0 ? (
            <View className="bg-gray-50 rounded-lg p-6 items-center">
              <Text className="text-4xl mb-2">📊</Text>
              <Text className="text-base text-gray-600 text-center">
                Aún no hay ventas registradas
              </Text>
            </View>
          ) : (
            topProducts.map((product, index) => {
              const maxRevenue = topProducts[0].revenue;
              const percentage = (product.revenue / maxRevenue) * 100;

              return (
                <View key={product.id} className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-200' : index === 2 ? 'bg-orange-100' : 'bg-gray-100'
                        }`}
                      >
                        <Text className="text-sm font-bold text-gray-700">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {product.sales} {product.sales === 1 ? 'venta' : 'ventas'} • {product.views} vistas
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-primary ml-2">
                      ${product.revenue.toLocaleString()}
                    </Text>
                  </View>

                  <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                    <View className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {topProducts.length > 0 && (
          <View className="px-4 pb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">📈 Tasa de Conversión</Text>

            {topProducts.slice(0, 5).map((product) => {
              const conversionRate = product.views > 0 ? (product.sales / product.views) * 100 : 0;

              return (
                <View key={product.id} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                  <Text className="text-base font-medium text-gray-900 mb-2" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600">
                      {product.views} visitas → {product.sales} ventas
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        conversionRate > 10 ? 'bg-green-100' : conversionRate > 5 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          conversionRate > 10 ? 'text-green-600' : conversionRate > 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      >
                        {conversionRate.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}