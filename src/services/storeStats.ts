import { supabase } from './supabase';

export interface StoreStats {
  // Métricas básicas
  total_products: number;
  active_products: number;
  total_sales: number;
  total_revenue: number;
  pending_orders: number;
  available_balance: number;

  // Métricas por período
  sales_today: number;
  revenue_today: number;
  sales_week: number;
  revenue_week: number;
  sales_month: number;
  revenue_month: number;
  sales_quarter: number;
  revenue_quarter: number;

  // Métricas avanzadas
  total_views: number;
  conversion_rate: number;
  average_order_value: number;
  repeat_customers: number;
  total_customers: number;

  // Comparativas
  revenue_change_percent: number;
  sales_change_percent: number;

  // Top productos
  top_selling_products: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image_url?: string;
  }[];

  top_viewed_products: {
    id: string;
    name: string;
    views: number;
    image_url?: string;
  }[];

  // Inventario bajo
  low_stock_products: {
    id: string;
    name: string;
    stock: number;
    image_url?: string;
  }[];

  // Datos para gráficos
  daily_revenue: {
    date: string;
    revenue: number;
    sales: number;
  }[];
}

export type StatsPeriod = 'today' | '7d' | '30d' | '90d';

export async function getStoreStats(storeId: string, period: StatsPeriod = '30d'): Promise<StoreStats> {
  try {
    // Calcular fechas según período
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let periodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (period) {
      case 'today':
        periodStart = today;
        previousPeriodStart = new Date(today);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousPeriodEnd = today;
        break;
      case '7d':
        periodStart = new Date(today);
        periodStart.setDate(periodStart.getDate() - 7);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd = periodStart;
        break;
      case '30d':
        periodStart = new Date(today);
        periodStart.setDate(periodStart.getDate() - 30);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
        previousPeriodEnd = periodStart;
        break;
      case '90d':
        periodStart = new Date(today);
        periodStart.setDate(periodStart.getDate() - 90);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 90);
        previousPeriodEnd = periodStart;
        break;
    }

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfQuarter = new Date(today);
    startOfQuarter.setDate(startOfQuarter.getDate() - 90);

    // Total de productos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', storeId);

    // Productos activos
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', storeId)
      .eq('status', 'active');

    // Todas las ventas
    const { data: allSalesData } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        created_at,
        product_id,
        orders!inner(id, status, created_at, user_id),
        products!inner(seller_id, name, views)
      `)
      .eq('products.seller_id', storeId)
      .in('orders.status', ['paid', 'processing', 'shipped', 'delivered']);

    // Calcular totales
    const totalSales = allSalesData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalRevenue = allSalesData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

    // Ventas de hoy
    const todaySales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= today;
    }) || [];
    const salesToday = todaySales.reduce((sum, item) => sum + item.quantity, 0);
    const revenueToday = todaySales.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Ventas de la semana
    const weekSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= startOfWeek;
    }) || [];
    const salesWeek = weekSales.reduce((sum, item) => sum + item.quantity, 0);
    const revenueWeek = weekSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Ventas del mes
    const monthSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= startOfMonth;
    }) || [];
    const salesMonth = monthSales.reduce((sum, item) => sum + item.quantity, 0);
    const revenueMonth = monthSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Ventas del trimestre
    const quarterSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= startOfQuarter;
    }) || [];
    const salesQuarter = quarterSales.reduce((sum, item) => sum + item.quantity, 0);
    const revenueQuarter = quarterSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Ventas del período actual y anterior (para comparativas)
    const currentPeriodSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= periodStart;
    }) || [];
    const currentRevenue = currentPeriodSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currentSalesCount = currentPeriodSales.reduce((sum, item) => sum + item.quantity, 0);

    const previousPeriodSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= previousPeriodStart && itemDate < previousPeriodEnd;
    }) || [];
    const previousRevenue = previousPeriodSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const previousSalesCount = previousPeriodSales.reduce((sum, item) => sum + item.quantity, 0);

    // Calcular cambio porcentual
    const revenueChangePercent = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;
    const salesChangePercent = previousSalesCount > 0
      ? ((currentSalesCount - previousSalesCount) / previousSalesCount) * 100
      : currentSalesCount > 0 ? 100 : 0;

    // Clientes únicos
    const uniqueCustomers = new Set(allSalesData?.map(item => item.orders?.user_id).filter(Boolean));
    const totalCustomers = uniqueCustomers.size;

    // Clientes repetidos (más de 1 compra)
    const customerPurchases: { [key: string]: number } = {};
    allSalesData?.forEach(item => {
      const customerId = item.orders?.user_id;
      if (customerId) {
        customerPurchases[customerId] = (customerPurchases[customerId] || 0) + 1;
      }
    });
    const repeatCustomers = Object.values(customerPurchases).filter(count => count > 1).length;

    // Valor promedio de orden
    const uniqueOrders = new Set(allSalesData?.map(item => item.orders?.id));
    const averageOrderValue = uniqueOrders.size > 0 ? totalRevenue / uniqueOrders.size : 0;

    // Total de vistas
    const { data: viewsData } = await supabase
      .from('products')
      .select('views')
      .eq('seller_id', storeId);
    const totalViews = viewsData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

    // Tasa de conversión
    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

    // Pedidos pendientes
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(
          products!inner(seller_id)
        )
      `, { count: 'exact', head: true })
      .eq('order_items.products.seller_id', storeId)
      .in('status', ['pending', 'paid', 'processing']);

    // Balance disponible
    let availableBalance = 0;
    const { data: balanceData } = await supabase
      .from('seller_balances')
      .select('available_balance')
      .eq('seller_id', storeId)
      .single();

    if (balanceData) {
      availableBalance = balanceData.available_balance || 0;
    }

    // Top productos más vendidos
    const productSales: { [key: string]: { name: string; sales: number; revenue: number; image_url?: string } } = {};
    allSalesData?.forEach(item => {
      const productId = item.product_id;
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.products?.name || 'Producto',
          sales: 0,
          revenue: 0,
        };
      }
      productSales[productId].sales += item.quantity;
      productSales[productId].revenue += item.price * item.quantity;
    });

    // Obtener imágenes de productos más vendidos
    const topSellingIds = Object.entries(productSales)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .map(([id]) => id);

    const { data: topSellingImages } = await supabase
      .from('product_images')
      .select('product_id, image_url')
      .in('product_id', topSellingIds)
      .eq('is_primary', true);

    const topSellingProducts = Object.entries(productSales)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .map(([id, data]) => ({
        id,
        name: data.name,
        sales: data.sales,
        revenue: data.revenue,
        image_url: topSellingImages?.find(img => img.product_id === id)?.image_url,
      }));

    // Top productos más vistos
    const { data: mostViewedProducts } = await supabase
      .from('products')
      .select('id, name, views')
      .eq('seller_id', storeId)
      .order('views', { ascending: false })
      .limit(5);

    const topViewedIds = mostViewedProducts?.map(p => p.id) || [];
    const { data: topViewedImages } = await supabase
      .from('product_images')
      .select('product_id, image_url')
      .in('product_id', topViewedIds)
      .eq('is_primary', true);

    const topViewedProducts = mostViewedProducts?.map(p => ({
      id: p.id,
      name: p.name,
      views: p.views || 0,
      image_url: topViewedImages?.find(img => img.product_id === p.id)?.image_url,
    })) || [];

    // Productos con bajo stock
    const { data: lowStockData } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('seller_id', storeId)
      .eq('status', 'active')
      .lt('stock', 10)
      .order('stock', { ascending: true })
      .limit(5);

    const lowStockIds = lowStockData?.map(p => p.id) || [];
    const { data: lowStockImages } = await supabase
      .from('product_images')
      .select('product_id, image_url')
      .in('product_id', lowStockIds)
      .eq('is_primary', true);

    const lowStockProducts = lowStockData?.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      image_url: lowStockImages?.find(img => img.product_id === p.id)?.image_url,
    })) || [];

    // Datos para gráfico (últimos 7-30 días según período)
    const daysToShow = period === 'today' ? 7 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dailyRevenue: { date: string; revenue: number; sales: number }[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySales = allSalesData?.filter(item => {
        const itemDate = new Date(item.orders?.created_at || item.created_at);
        return itemDate.toISOString().split('T')[0] === dateStr;
      }) || [];

      dailyRevenue.push({
        date: dateStr,
        revenue: daySales.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        sales: daySales.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    return {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders || 0,
      available_balance: availableBalance,
      sales_today: salesToday,
      revenue_today: revenueToday,
      sales_week: salesWeek,
      revenue_week: revenueWeek,
      sales_month: salesMonth,
      revenue_month: revenueMonth,
      sales_quarter: salesQuarter,
      revenue_quarter: revenueQuarter,
      total_views: totalViews,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      average_order_value: Math.round(averageOrderValue),
      repeat_customers: repeatCustomers,
      total_customers: totalCustomers,
      revenue_change_percent: Math.round(revenueChangePercent * 10) / 10,
      sales_change_percent: Math.round(salesChangePercent * 10) / 10,
      top_selling_products: topSellingProducts,
      top_viewed_products: topViewedProducts,
      low_stock_products: lowStockProducts,
      daily_revenue: dailyRevenue,
    };
  } catch (error) {
    console.error('Error fetching store stats:', error);
    return {
      total_products: 0,
      active_products: 0,
      total_sales: 0,
      total_revenue: 0,
      pending_orders: 0,
      available_balance: 0,
      sales_today: 0,
      revenue_today: 0,
      sales_week: 0,
      revenue_week: 0,
      sales_month: 0,
      revenue_month: 0,
      sales_quarter: 0,
      revenue_quarter: 0,
      total_views: 0,
      conversion_rate: 0,
      average_order_value: 0,
      repeat_customers: 0,
      total_customers: 0,
      revenue_change_percent: 0,
      sales_change_percent: 0,
      top_selling_products: [],
      top_viewed_products: [],
      low_stock_products: [],
      daily_revenue: [],
    };
  }
}
