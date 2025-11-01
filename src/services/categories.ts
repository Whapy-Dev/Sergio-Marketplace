import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  parent_id: string | null;
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data as Category[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}