import { supabase } from './supabase';

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: 'mercadopago' | 'cash' | 'transfer' | 'other';
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  total: number;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  mercadopago_payment_id?: string;
  mercadopago_preference_id?: string;
  mercadopago_status?: string;
  tracking_number?: string;
  carrier?: string;
  buyer_notes?: string;
  seller_notes?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_description?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  seller_id?: string;
  created_at: string;
}

export interface CreateOrderData {
  buyer_id: string;
  items: {
    product_id: string;
    product_name: string;
    product_description?: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    seller_id?: string;
  }[];
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  buyer_notes?: string;
}

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrderData): Promise<Order | null> {
  try {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const shipping_cost = 0; // TODO: Calculate based on location
    const tax = 0; // TODO: Calculate tax if needed
    const discount = 0; // TODO: Apply discount if any
    const total = subtotal + shipping_cost + tax - discount;

    // Get seller_id from first item (assuming all items from same seller for now)
    const seller_id = data.items[0]?.seller_id;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: data.buyer_id,
        seller_id,
        status: 'pending',
        payment_method: 'mercadopago',
        subtotal,
        shipping_cost,
        tax,
        discount,
        total,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        buyer_phone: data.buyer_phone,
        shipping_address: data.shipping_address,
        shipping_city: data.shipping_city,
        shipping_state: data.shipping_state,
        shipping_postal_code: data.shipping_postal_code,
        buyer_notes: data.buyer_notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const items = data.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_description: item.product_description,
      product_image_url: item.product_image_url,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
      seller_id: item.seller_id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

/**
 * Get order by ID with items
 */
export async function getOrderById(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return { ...order, items: items || [] };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get user's orders (as buyer)
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Get seller's orders
 */
export async function getSellerOrders(sellerId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false});

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  notes?: string
): Promise<boolean> {
  try {
    const updateData: any = { status };

    // Set timestamp based on status
    if (status === 'paid') updateData.paid_at = new Date().toISOString();
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();

    if (notes) updateData.seller_notes = notes;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

/**
 * Update order with MercadoPago info
 */
export async function updateOrderPayment(
  orderId: string,
  paymentData: {
    mercadopago_payment_id?: string;
    mercadopago_preference_id?: string;
    mercadopago_status?: string;
    mercadopago_status_detail?: string;
    status?: Order['status'];
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update(paymentData)
      .eq('id', orderId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating order payment:', error);
    return false;
  }
}

/**
 * Get all orders (for admin/CRM)
 */
export async function getAllOrders(limit: number = 100): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}
