import { supabase } from './supabase';

export interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock: number;
}

// Obtener productos destacados (primeros 10 productos con stock)
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error getting featured products:', error);
    return [];
  }

  return data || [];
}