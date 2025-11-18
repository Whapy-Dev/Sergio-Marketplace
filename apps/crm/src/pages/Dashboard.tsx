import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeStores: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    try {
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Total revenue (sum of all orders)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount');

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Active official stores
      const { count: storesCount } = await supabase
        .from('official_stores')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'approved')
        .eq('is_active', true);

      // Pending applications
      const { count: applicationsCount } = await supabase
        .from('store_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review']);

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        activeStores: storesCount || 0,
        pendingApplications: applicationsCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Productos',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-green-500',
    },
    {
      title: 'Total Órdenes',
      value: stats.totalOrders,
      icon: '🛒',
      color: 'bg-purple-500',
    },
    {
      title: 'Ingresos Totales',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Tiendas Oficiales',
      value: stats.activeStores,
      icon: '🏪',
      color: 'bg-indigo-500',
    },
    {
      title: 'Aplicaciones Pendientes',
      value: stats.pendingApplications,
      icon: '📝',
      color: 'bg-red-500',
      highlight: stats.pendingApplications > 0,
    },
  ];

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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Vista general del marketplace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition hover:shadow-md ${
              stat.highlight ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/applications"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center">
              <div className="bg-primary-100 rounded-lg p-2">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Revisar Aplicaciones</p>
                {stats.pendingApplications > 0 && (
                  <p className="text-xs text-red-600 font-semibold">
                    {stats.pendingApplications} pendientes
                  </p>
                )}
              </div>
            </div>
          </a>

          <a
            href="/stores"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-2">
                <span className="text-2xl">🏪</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Gestionar Tiendas</p>
                <p className="text-xs text-gray-600">{stats.activeStores} activas</p>
              </div>
            </div>
          </a>

          <a
            href="/featured-products"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-2">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Productos Destacados</p>
                <p className="text-xs text-gray-600">Configurar</p>
              </div>
            </div>
          </a>

          <a
            href="/banners"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center">
              <div className="bg-pink-100 rounded-lg p-2">
                <span className="text-2xl">🎨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Banners</p>
                <p className="text-xs text-gray-600">Editar carrusel</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
