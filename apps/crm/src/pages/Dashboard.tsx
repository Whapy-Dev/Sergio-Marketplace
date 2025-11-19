import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    activeStores: 0,
    pendingApplications: 0,
    totalProducts: 0,
    activeProducts: 0,
    pausedProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    cancelledOrders: 0,
    totalMarketplaceRevenue: 0,
    monthlyMarketplaceRevenue: 0,
    pendingCommissions: 0,
    totalAvailableBalance: 0,
    totalPendingBalance: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    processingWithdrawals: 0,
    processingWithdrawalsAmount: 0,
    completedWithdrawalsThisMonth: 0,
    completedWithdrawalsAmountThisMonth: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    try {
      // === USERS & SELLERS ===
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: sellersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('can_sell', true);

      const { count: buyersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('can_sell', false);

      // === OFFICIAL STORES ===
      const { count: storesCount } = await supabase
        .from('official_stores')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'approved')
        .eq('is_active', true);

      // === STORE APPLICATIONS ===
      const { count: applicationsCount } = await supabase
        .from('store_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review']);

      // === PRODUCTS ===
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: pausedProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paused');

      const { count: outOfStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock', 0)
        .eq('status', 'active');

      // === ORDERS ===
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: completedOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: processingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing', 'shipped']);

      const { count: cancelledOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['cancelled', 'refunded']);

      // === TOTAL REVENUE (all orders) ===
      const { data: allOrdersData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .in('status', ['completed', 'processing', 'shipped']);

      const totalRevenue = allOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Monthly revenue (current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthlyOrdersData } = await supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['completed', 'processing', 'shipped'])
        .gte('created_at', firstDayOfMonth);

      const monthlyRevenue = monthlyOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // === MARKETPLACE REVENUE (Comisiones) ===
      // Total comisiones de órdenes completadas
      const { data: completedItemsData } = await supabase
        .from('order_items')
        .select('platform_commission')
        .eq('orders.status', 'completed');

      const totalMarketplaceRevenue = completedItemsData?.reduce(
        (sum, item) => sum + (item.platform_commission || 0),
        0
      ) || 0;

      // Comisiones del mes actual
      const { data: monthlyItemsData } = await supabase
        .from('order_items')
        .select('platform_commission, orders!inner(created_at, status)')
        .eq('orders.status', 'completed')
        .gte('orders.created_at', firstDayOfMonth);

      const monthlyMarketplaceRevenue = monthlyItemsData?.reduce(
        (sum, item) => sum + (item.platform_commission || 0),
        0
      ) || 0;

      // Comisiones pendientes (órdenes en proceso)
      const { data: pendingItemsData } = await supabase
        .from('order_items')
        .select('platform_commission, orders!inner(status)')
        .in('orders.status', ['pending', 'processing', 'shipped']);

      const pendingCommissions = pendingItemsData?.reduce(
        (sum, item) => sum + (item.platform_commission || 0),
        0
      ) || 0;

      // === SELLERS BALANCE ===
      const { data: walletsData } = await supabase
        .from('seller_wallets')
        .select('available_balance, pending_balance, total_withdrawn');

      const totalAvailableBalance = walletsData?.reduce(
        (sum, wallet) => sum + (wallet.available_balance || 0),
        0
      ) || 0;
      const totalPendingBalance = walletsData?.reduce(
        (sum, wallet) => sum + (wallet.pending_balance || 0),
        0
      ) || 0;
      const totalWithdrawn = walletsData?.reduce(
        (sum, wallet) => sum + (wallet.total_withdrawn || 0),
        0
      ) || 0;

      // === WITHDRAWALS ===
      const { count: pendingWithdrawalsCount, data: pendingWithdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending');

      const pendingWithdrawalsAmount = pendingWithdrawalsData?.reduce(
        (sum, w) => sum + (w.amount || 0),
        0
      ) || 0;

      const { count: processingWithdrawalsCount, data: processingWithdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .in('status', ['approved', 'processing']);

      const processingWithdrawalsAmount = processingWithdrawalsData?.reduce(
        (sum, w) => sum + (w.amount || 0),
        0
      ) || 0;

      const { count: completedWithdrawalsThisMonthCount, data: completedWithdrawalsThisMonthData } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'completed')
        .gte('completed_at', firstDayOfMonth);

      const completedWithdrawalsAmountThisMonth = completedWithdrawalsThisMonthData?.reduce(
        (sum, w) => sum + (w.amount || 0),
        0
      ) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalSellers: sellersCount || 0,
        totalBuyers: buyersCount || 0,
        activeStores: storesCount || 0,
        pendingApplications: applicationsCount || 0,
        totalProducts: productsCount || 0,
        activeProducts: activeProductsCount || 0,
        pausedProducts: pausedProductsCount || 0,
        outOfStockProducts: outOfStockCount || 0,
        totalOrders: ordersCount || 0,
        completedOrders: completedOrdersCount || 0,
        processingOrders: processingOrdersCount || 0,
        cancelledOrders: cancelledOrdersCount || 0,
        totalMarketplaceRevenue,
        monthlyMarketplaceRevenue,
        pendingCommissions,
        totalAvailableBalance,
        totalPendingBalance,
        totalWithdrawn,
        pendingWithdrawals: pendingWithdrawalsCount || 0,
        pendingWithdrawalsAmount,
        processingWithdrawals: processingWithdrawalsCount || 0,
        processingWithdrawalsAmount,
        completedWithdrawalsThisMonth: completedWithdrawalsThisMonthCount || 0,
        completedWithdrawalsAmountThisMonth,
        totalRevenue,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard del Marketplace</h1>
        <p className="mt-2 text-gray-600">Vista completa de tu negocio</p>
      </div>

      {/* === MAIN KPIs === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas Principales</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Usuarios Totales</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalUsers}</p>
                <p className="mt-1 text-sm text-blue-100">
                  {stats.totalSellers} vendedores · {stats.totalBuyers} compradores
                </p>
              </div>
              <div className="text-4xl opacity-80">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Productos</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalProducts}</p>
                <p className="mt-1 text-sm text-green-100">
                  {stats.activeProducts} activos · {stats.pausedProducts} pausados
                </p>
              </div>
              <div className="text-4xl opacity-80">📦</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Órdenes</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalOrders}</p>
                <p className="mt-1 text-sm text-purple-100">
                  {stats.completedOrders} completadas · {stats.processingOrders} en proceso
                </p>
              </div>
              <div className="text-4xl opacity-80">🛒</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Ventas Totales</p>
                <p className="mt-2 text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="mt-1 text-sm text-yellow-100">
                  Este mes: ${stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl opacity-80">💰</div>
            </div>
          </div>
        </div>
      </div>

      {/* === MARKETPLACE REVENUE (Comisiones) === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos del Marketplace (Comisiones)</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Comisiones Totales</p>
              <span className="text-2xl">💵</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              ${stats.totalMarketplaceRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Acumuladas históricamente</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              ${stats.monthlyMarketplaceRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Comisiones del mes actual</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              ${stats.pendingCommissions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">De órdenes en proceso</p>
          </div>
        </div>
      </div>

      {/* === SELLERS BALANCE === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance de Vendedores</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Disponible para Retiro</p>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              ${stats.totalAvailableBalance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total en wallets de vendedores</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Balance Pendiente</p>
              <span className="text-2xl">⏰</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              ${stats.totalPendingBalance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">En órdenes en proceso</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Retirado</p>
              <span className="text-2xl">📤</span>
            </div>
            <p className="text-3xl font-bold text-gray-600">
              ${stats.totalWithdrawn.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Históricamente pagado</p>
          </div>
        </div>
      </div>

      {/* === WITHDRAWALS === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de Retiro</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pendientes de Aprobar</p>
              <span className="text-2xl">🔴</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.pendingWithdrawals}</p>
            <p className="text-sm text-gray-700 mt-1 font-semibold">
              ${stats.pendingWithdrawalsAmount.toLocaleString()}
            </p>
            {stats.pendingWithdrawals > 0 && (
              <a
                href="/withdrawals"
                className="inline-block mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Revisar ahora →
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <span className="text-2xl">🟡</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.processingWithdrawals}</p>
            <p className="text-sm text-gray-700 mt-1 font-semibold">
              ${stats.processingWithdrawalsAmount.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Completados Este Mes</p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completedWithdrawalsThisMonth}</p>
            <p className="text-sm text-gray-700 mt-1 font-semibold">
              ${stats.completedWithdrawalsAmountThisMonth.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* === OTHER STATS === */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiendas Oficiales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeStores}</p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <span className="text-2xl">🏪</span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-lg shadow-sm border p-6 ${
            stats.pendingApplications > 0 ? 'border-red-300 ring-2 ring-red-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aplicaciones Pendientes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
            </div>
            <div className={`rounded-full p-3 ${stats.pendingApplications > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <span className="text-2xl">📝</span>
            </div>
          </div>
          {stats.pendingApplications > 0 && (
            <a
              href="/applications"
              className="inline-block mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Revisar aplicaciones →
            </a>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sin Stock</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.outOfStockProducts}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <span className="text-2xl">📭</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Productos activos sin stock</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Órdenes Canceladas</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.cancelledOrders}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total histórico</p>
        </div>
      </div>

      {/* === QUICK ACTIONS === */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/withdrawals"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition"
          >
            <div className="flex items-center">
              <div className="bg-primary-100 rounded-lg p-2">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Gestionar Retiros</p>
                {stats.pendingWithdrawals > 0 && (
                  <p className="text-xs text-red-600 font-semibold">
                    {stats.pendingWithdrawals} pendientes
                  </p>
                )}
              </div>
            </div>
          </a>

          <a
            href="/users"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-2">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Ver Usuarios</p>
                <p className="text-xs text-gray-600">{stats.totalUsers} registrados</p>
              </div>
            </div>
          </a>

          <a
            href="/products"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition"
          >
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-2">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Ver Productos</p>
                <p className="text-xs text-gray-600">{stats.activeProducts} activos</p>
              </div>
            </div>
          </a>

          <a
            href="/settings"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition"
          >
            <div className="flex items-center">
              <div className="bg-gray-100 rounded-lg p-2">
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Configuración</p>
                <p className="text-xs text-gray-600">Marketplace</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
