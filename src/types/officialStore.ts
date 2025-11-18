// =====================================================
// Official Store Types
// =====================================================

export interface OfficialStore {
  id: string;
  user_id: string;

  // Store Information
  store_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;

  // Contact & Location
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;

  // Business Information
  business_type: 'individual' | 'company' | 'corporation';
  tax_id: string | null;
  legal_name: string | null;

  // Verification & Status
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  is_active: boolean;

  // Metrics (cached)
  rating: number;
  total_sales: number;
  total_products: number;
  followers_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StoreMetrics {
  id: string;
  store_id: string;

  // Sales Metrics
  total_revenue: number;
  monthly_revenue: number;
  avg_order_value: number;

  // Performance Metrics
  avg_rating: number;
  total_reviews: number;
  customer_satisfaction_rate: number;
  response_time_hours: number;
  response_rate: number;

  // Product Metrics
  products_count: number;
  active_products_count: number;
  out_of_stock_count: number;

  // Customer Metrics
  total_customers: number;
  repeat_customers: number;
  repeat_customer_rate: number;

  // Return & Refund Metrics
  return_rate: number;
  refund_rate: number;

  // Period
  period_start: string | null;
  period_end: string | null;
  metric_type: 'all_time' | 'monthly' | 'weekly';

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StorePolicies {
  id: string;
  store_id: string;

  // Warranty & Returns
  warranty_days: number;
  return_policy: string | null;
  accepts_returns: boolean;
  return_window_days: number;

  // Shipping
  shipping_policy: string | null;
  free_shipping_threshold: number | null;
  shipping_regions: string[] | null;
  avg_shipping_days: number | null;

  // Payment
  payment_methods: string[] | null;
  accepts_installments: boolean;
  max_installments: number | null;

  // Support
  support_email: string | null;
  support_phone: string | null;
  support_hours: string | null;

  // Terms
  terms_of_service: string | null;
  privacy_policy: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StoreFollower {
  id: string;
  store_id: string;
  user_id: string;
  followed_at: string;
}

export interface StoreApplication {
  id: string;
  user_id: string;
  application_data: Record<string, any>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  documents: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface OfficialStoreWithDetails extends OfficialStore {
  metrics?: StoreMetrics;
  policies?: StorePolicies;
  is_followed?: boolean;
  products?: any[]; // Product type from existing types
}

// Form data types
export interface CreateStoreApplicationData {
  store_name: string;
  description: string;
  email: string;
  phone: string;
  business_type: 'individual' | 'company' | 'corporation';
  tax_id: string;
  legal_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  website?: string;
}

export interface UpdateStoreData {
  store_name?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}
