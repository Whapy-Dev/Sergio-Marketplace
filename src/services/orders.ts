import { supabase } from './supabase';

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  tax_total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_id?: string;
  invoice_number?: string;
  invoice_url?: string;
  buyer_notes?: string;
  admin_notes?: string;
  payment_metadata?: any;
  fiscal_data?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  product_image_url?: string;
  variant_id?: string;
  variant_name?: string;
  commission_rate: number;
  commission_amount: number;
  seller_payout: number;
  shipping_cost: number;
  shipping_status?: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address?: any;
}

export interface CreateOrderData {
  buyer_id: string;
  items: {
    product_id: string;
    seller_id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
  }[];
  payment_method: 'cash' | 'transfer' | 'mercadopago';
  buyer_notes?: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

export async function createOrder(orderData: CreateOrderData) {
  try {
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const shipping_total = 0;
    const discount_total = 0;
    const tax_total = 0;
    const total = subtotal + shipping_total - discount_total + tax_total;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: generateOrderNumber(),
        buyer_id: orderData.buyer_id,
        total,
        subtotal,
        shipping_total,
        discount_total,
        tax_total,
        status: 'pending',
        payment_method: orderData.payment_method,
        payment_status: 'pending',
        buyer_notes: orderData.buyer_notes || null,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { success: false, error: orderError.message };
    }

    const commission_rate = 0.10;
    
    const orderItems = orderData.items.map(item => {
      const item_subtotal = item.unit_price * item.quantity;
      const commission = item_subtotal * commission_rate;
      const seller_payout = item_subtotal - commission;

      return {
        order_id: order.id,
        product_id: item.product_id,
        seller_id: item.seller_id,
        product_name: item.product_name,
        product_image_url: item.product_image_url || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item_subtotal,
        commission_rate,
        commission_amount: commission,
        seller_payout,
        shipping_cost: 0,
        shipping_status: 'pending',
        shipping_address: null,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      return { success: false, error: itemsError.message };
    }

    for (const item of orderData.items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id);
      }
    }

    return { success: true, data: order };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product_name,
          product_image_url
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data as Order[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getOrderById(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product_name,
          product_image_url,
          shipping_status,
          tracking_number
        ),
        profiles!orders_buyer_id_fkey(
          full_name,
          phone,
          email
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (orderItems) {
      for (const item of orderItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getSellerOrders(sellerId: string) {
  try {
    console.log('🔍 Buscando pedidos para seller:', sellerId);

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          id,
          order_number,
          buyer_id,
          total,
          status,
          payment_status,
          created_at
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching seller orders:', error);
      return [];
    }

    console.log('📊 Order items encontrados:', data?.length || 0);

    if (!data || data.length === 0) {
      return [];
    }

    const buyerIds = [...new Set(data.map((item: any) => item.orders.buyer_id))];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', buyerIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    const ordersMap = new Map();
    
    data.forEach((item: any) => {
      const orderId = item.orders.id;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          ...item.orders,
          profiles: profilesMap.get(item.orders.buyer_id) || null,
          order_items: []
        });
      }
      ordersMap.get(orderId).order_items.push(item);
    });

    const result = Array.from(ordersMap.values());
    console.log('✅ Pedidos agrupados:', result.length);
    console.log('📋 Detalle:', result.map((o: any) => o.order_number));
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}