import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  seller_id: string;
  category_id: string;
  stock: number;
  status: string;
  free_shipping: boolean;
}

export async function getProducts(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data as Product[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getProductsByCategory(categoryId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }

    return data as Product[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}