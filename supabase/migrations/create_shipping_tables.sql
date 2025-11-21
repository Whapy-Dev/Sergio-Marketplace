-- Create shipping zones and rates tables
-- Shipping zones (provinces/regions)
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  provinces VARCHAR(100)[], -- Array of province names
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shipping methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  carrier VARCHAR(100), -- OCA, Andreani, Correo Argentino, etc.
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shipping rates (zone + method = price)
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES shipping_zones(id) ON DELETE CASCADE,
  method_id UUID REFERENCES shipping_methods(id) ON DELETE CASCADE,

  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) DEFAULT 0,
  free_shipping_min DECIMAL(10, 2), -- Free if order > this amount

  -- Restrictions
  max_weight_kg DECIMAL(5, 2),
  max_dimensions_cm INTEGER, -- Sum of L+W+H

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(zone_id, method_id)
);

-- Tax configuration
CREATE TABLE IF NOT EXISTS tax_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5, 2) NOT NULL, -- Percentage (e.g., 21 for 21%)
  applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'category', 'product'
  category_ids UUID[],
  is_included BOOLEAN DEFAULT true, -- True if prices include tax
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shipping_zones_active ON shipping_zones(is_active);
CREATE INDEX idx_shipping_rates_zone ON shipping_rates(zone_id);
CREATE INDEX idx_shipping_rates_method ON shipping_rates(method_id);

-- RLS policies
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_config ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on shipping_zones" ON shipping_zones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on shipping_methods" ON shipping_methods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on shipping_rates" ON shipping_rates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admin full access on tax_config" ON tax_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Public read for active items
CREATE POLICY "Public can view active zones" ON shipping_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active methods" ON shipping_methods
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active rates" ON shipping_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active taxes" ON tax_config
  FOR SELECT USING (is_active = true);

-- Insert default data
-- Default shipping zones (Argentina)
INSERT INTO shipping_zones (name, provinces) VALUES
  ('CABA', ARRAY['Ciudad Autónoma de Buenos Aires']),
  ('Buenos Aires', ARRAY['Buenos Aires']),
  ('Centro', ARRAY['Córdoba', 'Santa Fe', 'Entre Ríos']),
  ('Cuyo', ARRAY['Mendoza', 'San Juan', 'San Luis']),
  ('NOA', ARRAY['Jujuy', 'Salta', 'Tucumán', 'Catamarca', 'La Rioja', 'Santiago del Estero']),
  ('NEA', ARRAY['Misiones', 'Corrientes', 'Chaco', 'Formosa']),
  ('Patagonia Norte', ARRAY['La Pampa', 'Neuquén', 'Río Negro']),
  ('Patagonia Sur', ARRAY['Chubut', 'Santa Cruz', 'Tierra del Fuego'])
ON CONFLICT DO NOTHING;

-- Default shipping methods
INSERT INTO shipping_methods (name, description, carrier, estimated_days_min, estimated_days_max) VALUES
  ('Envío Estándar', 'Entrega en 5-7 días hábiles', 'Correo Argentino', 5, 7),
  ('Envío Express', 'Entrega en 2-3 días hábiles', 'OCA', 2, 3),
  ('Retiro en Sucursal', 'Retirá tu pedido en la sucursal más cercana', NULL, 3, 5)
ON CONFLICT DO NOTHING;

-- Default tax (IVA 21% included)
INSERT INTO tax_config (name, rate, is_included) VALUES
  ('IVA', 21, true)
ON CONFLICT DO NOTHING;

-- Function to calculate shipping cost
CREATE OR REPLACE FUNCTION calculate_shipping(
  p_province VARCHAR,
  p_method_id UUID,
  p_cart_total DECIMAL,
  p_total_weight_kg DECIMAL DEFAULT 1
) RETURNS TABLE (
  shipping_cost DECIMAL,
  is_free BOOLEAN,
  estimated_days VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_zone_id UUID;
  v_rate RECORD;
  v_cost DECIMAL;
BEGIN
  -- Find zone for province
  SELECT id INTO v_zone_id
  FROM shipping_zones
  WHERE p_province = ANY(provinces)
  AND is_active = true
  LIMIT 1;

  IF v_zone_id IS NULL THEN
    RETURN QUERY SELECT 0::DECIMAL, false, ''::VARCHAR, 'Zona de envío no encontrada'::VARCHAR;
    RETURN;
  END IF;

  -- Get rate for zone and method
  SELECT sr.*, sm.estimated_days_min, sm.estimated_days_max
  INTO v_rate
  FROM shipping_rates sr
  JOIN shipping_methods sm ON sm.id = sr.method_id
  WHERE sr.zone_id = v_zone_id
  AND sr.method_id = p_method_id
  AND sr.is_active = true;

  IF v_rate IS NULL THEN
    RETURN QUERY SELECT 0::DECIMAL, false, ''::VARCHAR, 'Método de envío no disponible para esta zona'::VARCHAR;
    RETURN;
  END IF;

  -- Check weight limit
  IF v_rate.max_weight_kg IS NOT NULL AND p_total_weight_kg > v_rate.max_weight_kg THEN
    RETURN QUERY SELECT 0::DECIMAL, false, ''::VARCHAR, 'Peso excede el límite para este método'::VARCHAR;
    RETURN;
  END IF;

  -- Calculate cost
  v_cost := v_rate.base_price + (v_rate.price_per_kg * p_total_weight_kg);

  -- Check free shipping
  IF v_rate.free_shipping_min IS NOT NULL AND p_cart_total >= v_rate.free_shipping_min THEN
    RETURN QUERY SELECT 0::DECIMAL, true,
      (v_rate.estimated_days_min || '-' || v_rate.estimated_days_max || ' días')::VARCHAR,
      NULL::VARCHAR;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_cost, false,
    (v_rate.estimated_days_min || '-' || v_rate.estimated_days_max || ' días')::VARCHAR,
    NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
