import { supabase } from './supabase';
import { calculateCommission } from './wallet';
import { calculateShipping } from './shipping';
import { validateCoupon, applyCoupon } from './coupons';

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  status: string;
  payment_method: string;
  payment_status?: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  payment_id?: string;
  payment_metadata?: any;
  fiscal_data?: any;
  invoice_number?: string;
  invoice_url?: string;
  buyer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  seller_id?: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  product_image_url?: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  commission_rate?: number;
  commission_amount?: number;
  seller_payout?: number;
  shipping_cost?: number;
  shipping_status?: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  buyer_id: string;
  items: {
    product_id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    seller_id?: string;
    category_id?: string; // For commission calculation
    shipping_address?: string; // Each item can have its own shipping address
    weight_kg?: number; // Product weight for shipping calculation
  }[];
  payment_method?: string;
  buyer_notes?: string;
  // Shipping info
  shipping_province?: string;
  shipping_method_id?: string;
  shipping_address?: string;
  // Coupon
  coupon_code?: string;
}

/**
 * Create a new order with automatic commission calculation
 */
export async function createOrder(data: CreateOrderData): Promise<Order | null> {
  try {
    // Calculate subtotal
    const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Calculate shipping
    let shipping_total = 0;
    if (data.shipping_province && data.shipping_method_id) {
      const totalWeight = data.items.reduce((sum, item) => sum + (item.weight_kg || 0.5) * item.quantity, 0);
      const shippingResult = await calculateShipping(
        data.shipping_province,
        data.shipping_method_id,
        subtotal,
        totalWeight
      );
      if (!shippingResult.error_message) {
        shipping_total = shippingResult.shipping_cost;
      }
    }

    // Tax is included in prices (IVA 21%)
    const tax_total = 0;

    // Apply coupon if provided
    let discount_total = 0;
    let couponId: string | undefined;
    if (data.coupon_code) {
      const productIds = data.items.map(item => item.product_id);
      const couponResult = await validateCoupon(
        data.coupon_code,
        data.buyer_id,
        subtotal,
        productIds
      );
      if (couponResult.is_valid && couponResult.coupon_id) {
        discount_total = couponResult.discount_amount;
        couponId = couponResult.coupon_id;
      }
    }

    const total = subtotal + shipping_total + tax_total - discount_total;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: data.buyer_id,
        status: 'pending',
        payment_method: data.payment_method || 'mercadopago',
        payment_status: 'pending',
        subtotal,
        shipping_total,
        tax_total,
        discount_total,
        total,
        buyer_notes: data.buyer_notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items with commission calculation
    const itemsWithCommissions = await Promise.all(
      data.items.map(async (item) => {
        // If no category_id provided, fetch from product
        let categoryId = item.category_id;
        if (!categoryId && item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('category_id')
            .eq('id', item.product_id)
            .single();
          categoryId = product?.category_id;
        }

        // Calculate commission
        const commission = await calculateCommission(
          item.product_id,
          item.seller_id || '',
          categoryId || '',
          item.unit_price,
          item.quantity
        );

        return {
          order_id: order.id,
          seller_id: item.seller_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image_url: item.product_image_url,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: commission?.subtotal || item.unit_price * item.quantity,
          commission_rate: commission?.commission_rate || 0,
          commission_amount: commission?.commission_amount || 0,
          seller_payout: commission?.seller_payout || item.unit_price * item.quantity,
          shipping_address: item.shipping_address,
          shipping_status: 'pending',
        };
      })
    );

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithCommissions);

    if (itemsError) throw itemsError;

    // Register coupon usage if applied
    if (couponId && discount_total > 0) {
      await applyCoupon(couponId, data.buyer_id, order.id, discount_total);
    }

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
 * Get seller's orders (orders containing products from this seller)
 */
export async function getSellerOrders(sellerId: string): Promise<Order[]> {
  try {
    // Get orders that have items from this seller
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId);

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
      return [];
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderItems.map(item => item.order_id))];

    // Fetch the actual orders
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('id', orderIds)
      .order('created_at', { ascending: false });

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
  status: string,
  notes?: string
): Promise<boolean> {
  try {
    const updateData: any = { status };

    if (notes) updateData.admin_notes = notes;

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
    payment_id?: string;
    payment_status?: string;
    payment_metadata?: any;
    status?: string;
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
