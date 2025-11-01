import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  seller_id: string;
  category_id?: string;
  image_url?: string;
  created_at: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  return { products, loading, refetch: fetchProducts };
}