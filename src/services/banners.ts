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
 * Filters by:
 * - is_active = true
 * - Current date between starts_at and ends_at (or null dates)
 * Limits to first 6 banners ordered by display_order
 */
export async function getActiveBanners(limit: number = 6): Promise<Banner[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching active banners:', error);
      return [];
    }

    // Additional client-side filtering to ensure date ranges are correct
    const filteredData = (data || []).filter(banner => {
      const startsAt = banner.starts_at ? new Date(banner.starts_at) : null;
      const endsAt = banner.ends_at ? new Date(banner.ends_at) : null;
      const currentDate = new Date();

      // If starts_at exists, check if we're past that date
      if (startsAt && currentDate < startsAt) return false;

      // If ends_at exists, check if we haven't passed that date
      if (endsAt && currentDate > endsAt) return false;

      return true;
    });

    return filteredData;
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
