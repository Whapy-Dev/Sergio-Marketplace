-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,

  -- Location: where to display the banner
  location VARCHAR(50) NOT NULL DEFAULT 'home_carousel',
  -- Options: home_carousel, home_middle, home_bottom, category_top, product_related, checkout, profile

  link_type VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (link_type IN ('product', 'category', 'store', 'external', 'none')),
  link_value VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_banners_location ON banners(location);

-- RLS policies
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on banners" ON banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Public can view active banners
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT USING (is_active = true);

-- Create storage bucket for banner images (if not exists)
-- Run this separately or check if bucket exists first:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
