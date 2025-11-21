import { supabase } from './supabase';

export interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: 'active' | 'inactive' | 'sold_out';
  condition: 'new' | 'used';
  category_id: string;
  seller_id: string;
  free_shipping: boolean;
  created_at: string;
  views: number;
}

export interface SellerStats {
  total_products: number;
  active_products: number;
  total_sales: number;
  total_revenue: number;
  pending_orders: number;
  sales_today: number;
  revenue_today: number;
  sales_month: number;
  revenue_month: number;
  available_balance: number;
}

// Obtener productos del vendedor
export async function getSellerProducts(sellerId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching seller products:', error);
      return [];
    }

    return data as SellerProduct[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Crear producto
export async function createProduct(productData: {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  condition: 'new' | 'used';
  category_id: string;
  seller_id: string;
  free_shipping: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        status: 'active',
        views: 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar producto
export async function updateProduct(productId: string, updates: Partial<SellerProduct>) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar producto
export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Obtener estadísticas del vendedor
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  try {
    // Fechas para filtros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total de productos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    // Productos activos
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'active');

    // Todas las ventas (desde order_items)
    const { data: allSalesData } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        created_at,
        orders!inner(status, created_at),
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId)
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

    // Ventas del mes
    const monthSales = allSalesData?.filter(item => {
      const itemDate = new Date(item.orders?.created_at || item.created_at);
      return itemDate >= startOfMonth;
    }) || [];
    const salesMonth = monthSales.reduce((sum, item) => sum + item.quantity, 0);
    const revenueMonth = monthSales.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Pedidos pendientes
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(
          products!inner(seller_id)
        )
      `, { count: 'exact', head: true })
      .eq('order_items.products.seller_id', sellerId)
      .in('status', ['pending', 'paid', 'processing']);

    // Balance disponible
    let availableBalance = 0;
    const { data: balanceData } = await supabase
      .from('seller_balances')
      .select('available_balance')
      .eq('seller_id', sellerId)
      .single();

    if (balanceData) {
      availableBalance = balanceData.available_balance || 0;
    }

    return {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders || 0,
      sales_today: salesToday,
      revenue_today: revenueToday,
      sales_month: salesMonth,
      revenue_month: revenueMonth,
      available_balance: availableBalance,
    };
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return {
      total_products: 0,
      active_products: 0,
      total_sales: 0,
      total_revenue: 0,
      pending_orders: 0,
      sales_today: 0,
      revenue_today: 0,
      sales_month: 0,
      revenue_month: 0,
      available_balance: 0,
    };
  }
}

// Solicitar ser vendedor
export async function requestSellerRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'seller_individual' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error requesting seller role:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}