export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export interface OfficialStore {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  business_type: 'individual' | 'company' | 'corporation';
  tax_id?: string;
  legal_name?: string;
  logo_url?: string;
  banner_url?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified_at?: string;
  verified_by?: string;
  is_active: boolean;
  rating: number;
  total_sales: number;
  total_products: number;
  followers_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoreApplication {
  id: string;
  user_id: string;
  application_data: {
    store_name: string;
    description: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    business_type: string;
    tax_id: string;
    legal_name: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

export interface Product {
  id: string;
  seller_id: string;
  official_store_id?: string;
  title: string;
  description?: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  stock: number;
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'sold';
  is_featured: boolean;
  featured_until?: string;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_type: 'product' | 'category' | 'store' | 'external' | 'none';
  link_value?: string;
  display_order: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeStores: number;
  pendingApplications: number;
}
