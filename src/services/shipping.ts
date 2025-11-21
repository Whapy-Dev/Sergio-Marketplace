/**
 * Shipping Service
 * Handles shipping cost calculation and zone management
 */

import { supabase } from './supabase';

export interface ShippingZone {
  id: string;
  name: string;
  provinces: string[];
  is_active: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  carrier?: string;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

export interface ShippingRate {
  id: string;
  zone_id: string;
  method_id: string;
  base_price: number;
  price_per_kg: number;
  free_shipping_min?: number;
  max_weight_kg?: number;
  is_active: boolean;
  method?: ShippingMethod;
  zone?: ShippingZone;
}

export interface ShippingCalculation {
  shipping_cost: number;
  is_free: boolean;
  estimated_days: string;
  error_message?: string;
}

export interface ShippingOption {
  method: ShippingMethod;
  cost: number;
  isFree: boolean;
  estimatedDays: string;
}

// Argentine provinces list
export const PROVINCES = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

/**
 * Get all shipping methods
 */
export async function getShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('estimated_days_min', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
}

/**
 * Get all shipping zones
 */
export async function getShippingZones(): Promise<ShippingZone[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return [];
  }
}

/**
 * Calculate shipping cost using database function
 */
export async function calculateShipping(
  province: string,
  methodId: string,
  cartTotal: number,
  totalWeightKg: number = 1
): Promise<ShippingCalculation> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_shipping', {
        p_province: province,
        p_method_id: methodId,
        p_cart_total: cartTotal,
        p_total_weight_kg: totalWeightKg,
      });

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      shipping_cost: 0,
      is_free: false,
      estimated_days: '',
      error_message: 'Error al calcular envío',
    };
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return {
      shipping_cost: 0,
      is_free: false,
      estimated_days: '',
      error_message: 'Error al calcular envío',
    };
  }
}

/**
 * Get available shipping options for a province
 */
export async function getShippingOptions(
  province: string,
  cartTotal: number,
  totalWeightKg: number = 1
): Promise<ShippingOption[]> {
  try {
    const methods = await getShippingMethods();
    const options: ShippingOption[] = [];

    for (const method of methods) {
      const calculation = await calculateShipping(
        province,
        method.id,
        cartTotal,
        totalWeightKg
      );

      if (!calculation.error_message) {
        options.push({
          method,
          cost: calculation.shipping_cost,
          isFree: calculation.is_free,
          estimatedDays: calculation.estimated_days,
        });
      }
    }

    return options;
  } catch (error) {
    console.error('Error getting shipping options:', error);
    return [];
  }
}

/**
 * Get zone by province name
 */
export async function getZoneByProvince(province: string): Promise<ShippingZone | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .contains('provinces', [province])
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error getting zone by province:', error);
    return null;
  }
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(cost: number, isFree: boolean): string {
  if (isFree) return 'Gratis';
  return `$${cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

/**
 * Calculate taxes for an amount
 * Assumes prices include IVA (21%)
 */
export function calculateTaxBreakdown(total: number, taxRate: number = 21): {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
} {
  const netAmount = total / (1 + taxRate / 100);
  const taxAmount = total - netAmount;

  return {
    netAmount: Math.round(netAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grossAmount: total,
  };
}

/**
 * Get default tax rate
 */
export async function getTaxRate(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('tax_config')
      .select('rate')
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return data?.rate || 21;
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    return 21; // Default IVA
  }
}
