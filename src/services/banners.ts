import { supabase } from './supabase';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_type: 'product' | 'category' | 'store' | 'external' | 'none';
  link_value?: string;
  display_order: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

/**
 * Get active banners for display in the home screen
 */
export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return [];
  }
}

/**
 * Get all banners (for admin purposes)
 */
export async function getAllBanners(): Promise<Banner[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all banners:', error);
    return [];
  }
}
