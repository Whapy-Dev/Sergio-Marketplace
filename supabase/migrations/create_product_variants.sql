-- Product Variants System
-- Allows products to have variants like Color, Size with specific images, prices, and stock

-- Variant types table (Color, Size, Material, etc.)
CREATE TABLE IF NOT EXISTS product_variant_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- 'Color', 'Talle', 'Material'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Variant options table (Red, Blue, S, M, L, etc.)
CREATE TABLE IF NOT EXISTS product_variant_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_type_id UUID REFERENCES product_variant_types(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL, -- 'Rojo', 'Azul', 'S', 'M', 'L'
  color_hex VARCHAR(7), -- For color variants: '#FF0000'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product variants table (actual SKU combinations)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  price DECIMAL(10, 2), -- NULL means use product price
  compare_at_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Variant combination stored as JSONB
  -- e.g., {"Color": "Rojo", "Talle": "M"}
  options JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Variant images table
CREATE TABLE IF NOT EXISTS product_variant_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variant_types_product ON product_variant_types(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_options_type ON product_variant_options(variant_type_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON product_variant_images(variant_id);

-- RLS policies
ALTER TABLE product_variant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_images ENABLE ROW LEVEL SECURITY;

-- Public can view all variant data
CREATE POLICY "Public can view variant types" ON product_variant_types
  FOR SELECT USING (true);

CREATE POLICY "Public can view variant options" ON product_variant_options
  FOR SELECT USING (true);

CREATE POLICY "Public can view variants" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "Public can view variant images" ON product_variant_images
  FOR SELECT USING (true);

-- Sellers can manage their product variants
CREATE POLICY "Sellers can manage variant types" ON product_variant_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variant_types.product_id
      AND products.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage variant options" ON product_variant_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_variant_types vt
      JOIN products p ON p.id = vt.product_id
      WHERE vt.id = product_variant_options.variant_type_id
      AND p.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage variants" ON product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage variant images" ON product_variant_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_variants v
      JOIN products p ON p.id = v.product_id
      WHERE v.id = product_variant_images.variant_id
      AND p.seller_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admin full access on variant types" ON product_variant_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on variant options" ON product_variant_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on variants" ON product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on variant images" ON product_variant_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Function to get total stock for a product (sum of all variants)
CREATE OR REPLACE FUNCTION get_product_total_stock(p_product_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(stock) FROM product_variants WHERE product_id = p_product_id AND is_active = true),
    (SELECT stock FROM products WHERE id = p_product_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get price range for a product with variants
CREATE OR REPLACE FUNCTION get_product_price_range(p_product_id UUID)
RETURNS TABLE (min_price DECIMAL, max_price DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(MIN(COALESCE(v.price, p.price)), p.price) as min_price,
    COALESCE(MAX(COALESCE(v.price, p.price)), p.price) as max_price
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
  WHERE p.id = p_product_id
  GROUP BY p.price;
END;
$$ LANGUAGE plpgsql;
