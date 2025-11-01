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

    // Ventas y revenue (desde order_items)
    const { data: salesData } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId);

    const totalSales = salesData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalRevenue = salesData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

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
      .eq('status', 'pending');

    return {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders || 0,
    };
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return {
      total_products: 0,
      active_products: 0,
      total_sales: 0,
      total_revenue: 0,
      pending_orders: 0,
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