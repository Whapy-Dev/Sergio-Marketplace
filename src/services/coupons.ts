/**
 * Coupon/Discount Service
 * Handles coupon validation and application
 */

import { supabase } from './supabase';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit?: number;
  usage_per_user: number;
  current_usage: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  applies_to: 'all' | 'category' | 'product' | 'seller';
  applies_to_ids?: string[];
  first_purchase_only: boolean;
  new_users_only: boolean;
}

export interface CouponValidation {
  is_valid: boolean;
  coupon_id?: string;
  discount_amount: number;
  error_message?: string;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  userId: string,
  cartTotal: number,
  productIds?: string[],
  categoryIds?: string[]
): Promise<CouponValidation> {
  try {
    const { data, error } = await supabase
      .rpc('validate_coupon', {
        p_code: code,
        p_user_id: userId,
        p_cart_total: cartTotal,
        p_product_ids: productIds || null,
        p_category_ids: categoryIds || null,
      });

    if (error) throw error;

    if (data && data.length > 0) {
      const result = data[0];
      return {
        is_valid: result.is_valid,
        coupon_id: result.coupon_id,
        discount_amount: result.discount_amount || 0,
        error_message: result.error_message,
      };
    }

    return {
      is_valid: false,
      discount_amount: 0,
      error_message: 'Error al validar cupón',
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      is_valid: false,
      discount_amount: 0,
      error_message: 'Error al validar cupón',
    };
  }
}

/**
 * Apply coupon to an order
 */
export async function applyCoupon(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('apply_coupon', {
        p_coupon_id: couponId,
        p_user_id: userId,
        p_order_id: orderId,
        p_discount_amount: discountAmount,
      });

    if (error) throw error;

    return data === true;
  } catch (error) {
    console.error('Error applying coupon:', error);
    return false;
  }
}

/**
 * Get coupon details by code
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', code)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return null;
  }
}

/**
 * Get user's coupon usage count for a specific coupon
 */
export async function getUserCouponUsage(
  userId: string,
  couponId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('coupon_id', couponId);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error fetching coupon usage:', error);
    return 0;
  }
}

/**
 * Get available coupons for display
 * (Only returns active, non-expired coupons)
 */
export async function getAvailableCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    return [];
  }
}

/**
 * Format discount display
 */
export function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') {
    let text = `${coupon.discount_value}% OFF`;
    if (coupon.max_discount) {
      text += ` (máx $${coupon.max_discount})`;
    }
    return text;
  } else {
    return `$${coupon.discount_value} OFF`;
  }
}

/**
 * Check if coupon is expired
 */
export function isCouponExpired(coupon: Coupon): boolean {
  if (!coupon.expires_at) return false;
  return new Date(coupon.expires_at) < new Date();
}

/**
 * Check if coupon has started
 */
export function hasCouponStarted(coupon: Coupon): boolean {
  return new Date(coupon.starts_at) <= new Date();
}
