-- Home Sections Management System
-- Allows CRM to configure all home screen sections

-- Table for section definitions
CREATE TABLE IF NOT EXISTS home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  layout_type VARCHAR(20) DEFAULT 'horizontal', -- horizontal, vertical, grid
  max_products INTEGER DEFAULT 6,
  show_view_all BOOLEAN DEFAULT true,
  view_all_link VARCHAR(200),
  background_color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for products in each section
CREATE TABLE IF NOT EXISTS home_section_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES home_sections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  custom_label VARCHAR(50), -- e.g., "-20%", "Nuevo", "Hot"
  custom_label_color VARCHAR(20) DEFAULT '#FF3B30',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_home_sections_order ON home_sections(display_order, is_active);
CREATE INDEX IF NOT EXISTS idx_home_section_products_order ON home_section_products(section_id, display_order);

-- Insert default sections
INSERT INTO home_sections (name, slug, title, subtitle, display_order, layout_type, max_products) VALUES
  ('Seleccionados para ti', 'seleccionados', 'Seleccionados para ti', NULL, 1, 'vertical', 4),
  ('Productos destacados', 'destacados', 'Productos destacados', 'Los mejores productos', 2, 'horizontal', 6),
  ('Nuestros elegidos', 'elegidos', 'Nuestros elegidos del momento', NULL, 3, 'horizontal', 3),
  ('Lo mejor para el hogar', 'hogar', 'Lo mejor para el hogar', NULL, 4, 'horizontal', 3),
  ('Marketplace', 'marketplace', 'Marketplace', NULL, 5, 'horizontal', 3),
  ('También te puede interesar', 'interesar', 'También puede interesarte', NULL, 6, 'horizontal', 3)
ON CONFLICT (slug) DO NOTHING;

-- RLS Policies
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_section_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sections" ON home_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view section products" ON home_section_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sections" ON home_sections
  FOR ALL USING (true);

CREATE POLICY "Admins can manage section products" ON home_section_products
  FOR ALL USING (true);
