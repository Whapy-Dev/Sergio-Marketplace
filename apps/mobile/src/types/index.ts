// Tipos globales de NativeWind
/// <reference types="nativewind/types" />

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'customer' | 'seller_individual' | 'seller_store' | 'admin';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  image_url?: string;
  category_id: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
}