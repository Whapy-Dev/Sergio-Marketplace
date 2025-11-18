-- =====================================================
-- MIGRATION: Official Stores System
-- Description: Tables for official store registration and management
-- Date: 2025-01-18
-- =====================================================

-- =====================================================
-- 1. OFFICIAL STORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS official_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Store Information
  store_name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,

  -- Contact & Location
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Argentina',

  -- Business Information
  business_type VARCHAR(50) DEFAULT 'individual', -- individual, company, corporation
  tax_id VARCHAR(50), -- CUIT/CUIL
  legal_name VARCHAR(255),

  -- Verification & Status
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Metrics (cached)
  rating DECIMAL(3,2) DEFAULT 0,
  total_sales BIGINT DEFAULT 0,
  total_products INT DEFAULT 0,
  followers_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- =====================================================
-- 2. STORE METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS store_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES official_stores(id) ON DELETE CASCADE NOT NULL,

  -- Sales Metrics
  total_revenue DECIMAL(15,2) DEFAULT 0,
  monthly_revenue DECIMAL(15,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,

  -- Performance Metrics
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  customer_satisfaction_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  response_time_hours INT DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 100, -- percentage

  -- Product Metrics
  products_count INT DEFAULT 0,
  active_products_count INT DEFAULT 0,
  out_of_stock_count INT DEFAULT 0,

  -- Customer Metrics
  total_customers INT DEFAULT 0,
  repeat_customers INT DEFAULT 0,
  repeat_customer_rate DECIMAL(5,2) DEFAULT 0,

  -- Return & Refund Metrics
  return_rate DECIMAL(5,2) DEFAULT 0,
  refund_rate DECIMAL(5,2) DEFAULT 0,

  -- Period
  period_start DATE,
  period_end DATE,
  metric_type VARCHAR(50) DEFAULT 'all_time', -- all_time, monthly, weekly

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_avg_rating CHECK (avg_rating >= 0 AND avg_rating <= 5)
);

-- =====================================================
-- 3. STORE POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS store_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES official_stores(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Warranty & Returns
  warranty_days INT DEFAULT 30,
  return_policy TEXT,
  accepts_returns BOOLEAN DEFAULT true,
  return_window_days INT DEFAULT 30,

  -- Shipping
  shipping_policy TEXT,
  free_shipping_threshold DECIMAL(10,2),
  shipping_regions TEXT[], -- array of regions where they ship
  avg_shipping_days INT,

  -- Payment
  payment_methods TEXT[], -- ['cash', 'transfer', 'mercadopago', 'credit_card']
  accepts_installments BOOLEAN DEFAULT false,
  max_installments INT,

  -- Support
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  support_hours TEXT, -- e.g., "Lun-Vie 9-18hs"

  -- Terms
  terms_of_service TEXT,
  privacy_policy TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. STORE FOLLOWERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS store_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES official_stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Timestamps
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(store_id, user_id)
);

-- =====================================================
-- 5. STORE APPLICATIONS TABLE (for approval workflow)
-- =====================================================
CREATE TABLE IF NOT EXISTS store_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Application Data (JSON for flexibility)
  application_data JSONB NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, approved, rejected
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- Documents (URLs to uploaded files)
  documents JSONB, -- { "tax_document": "url", "business_license": "url", etc }

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'))
);

-- =====================================================
-- 6. INDEXES for Performance
-- =====================================================
CREATE INDEX idx_official_stores_user_id ON official_stores(user_id);
CREATE INDEX idx_official_stores_verification_status ON official_stores(verification_status);
CREATE INDEX idx_official_stores_slug ON official_stores(slug);
CREATE INDEX idx_official_stores_rating ON official_stores(rating DESC);
CREATE INDEX idx_store_followers_store_id ON store_followers(store_id);
CREATE INDEX idx_store_followers_user_id ON store_followers(user_id);
CREATE INDEX idx_store_applications_status ON store_applications(status);
CREATE INDEX idx_store_applications_user_id ON store_applications(user_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE official_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_applications ENABLE ROW LEVEL SECURITY;

-- Official Stores Policies
CREATE POLICY "Official stores are viewable by everyone"
  ON official_stores FOR SELECT
  USING (verification_status = 'approved' AND is_active = true);

CREATE POLICY "Users can view their own store"
  ON official_stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store"
  ON official_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON official_stores FOR UPDATE
  USING (auth.uid() = user_id);

-- Store Metrics Policies
CREATE POLICY "Store metrics are viewable by everyone"
  ON store_metrics FOR SELECT
  USING (true);

CREATE POLICY "Only store owners can insert metrics"
  ON store_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM official_stores
      WHERE id = store_metrics.store_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Only store owners can update metrics"
  ON store_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM official_stores
      WHERE id = store_metrics.store_id
      AND user_id = auth.uid()
    )
  );

-- Store Policies (return policy, shipping, etc)
CREATE POLICY "Store policies are viewable by everyone"
  ON store_policies FOR SELECT
  USING (true);

CREATE POLICY "Only store owners can manage policies"
  ON store_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM official_stores
      WHERE id = store_policies.store_id
      AND user_id = auth.uid()
    )
  );

-- Store Followers Policies
CREATE POLICY "Everyone can view followers"
  ON store_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow stores"
  ON store_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow stores"
  ON store_followers FOR DELETE
  USING (auth.uid() = user_id);

-- Store Applications Policies
CREATE POLICY "Users can view their own applications"
  ON store_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON store_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending applications"
  ON store_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update followers count
CREATE OR REPLACE FUNCTION update_store_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE official_stores
    SET followers_count = followers_count + 1
    WHERE id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE official_stores
    SET followers_count = followers_count - 1
    WHERE id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_followers_count
AFTER INSERT OR DELETE ON store_followers
FOR EACH ROW EXECUTE FUNCTION update_store_followers_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_official_stores_updated_at
BEFORE UPDATE ON official_stores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_store_metrics_updated_at
BEFORE UPDATE ON store_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_store_policies_updated_at
BEFORE UPDATE ON store_policies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_store_applications_updated_at
BEFORE UPDATE ON store_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create slug from store name
CREATE OR REPLACE FUNCTION generate_store_slug(store_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(store_name, '[^a-z0-9]+', '-', 'gi'));
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM official_stores WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. UPDATE products table to link with official_stores
-- =====================================================

-- Add official_store_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS official_store_id UUID REFERENCES official_stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_official_store_id ON products(official_store_id);

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- This will be populated via the app or admin panel
-- Example:
-- INSERT INTO official_stores (user_id, store_name, slug, description, email)
-- VALUES ('uuid-here', 'Samsung Store', 'samsung-store', 'Official Samsung Store', 'samsung@example.com');

-- =====================================================
-- END OF MIGRATION
-- =====================================================
