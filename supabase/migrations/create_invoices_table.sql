-- Create invoices table for ARCA electronic invoicing
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),

  -- ARCA data
  cae VARCHAR(14) NOT NULL,
  cae_expiration VARCHAR(8),
  invoice_number INTEGER NOT NULL,
  point_of_sale INTEGER NOT NULL,
  invoice_type INTEGER NOT NULL,

  -- Buyer info
  buyer_doc_type INTEGER NOT NULL,
  buyer_doc_number VARCHAR(20) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_address VARCHAR(500),

  -- Amounts
  net_amount DECIMAL(12, 2) NOT NULL,
  iva_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,

  -- Items (JSON)
  items JSONB,

  -- PDF storage
  pdf_url VARCHAR(500),

  -- Status
  status VARCHAR(20) DEFAULT 'issued',
  voided_at TIMESTAMP,
  void_reason VARCHAR(500),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_cae ON invoices(cae);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_buyer_doc ON invoices(buyer_doc_number);

-- Unique constraint for invoice number per point of sale and type
CREATE UNIQUE INDEX idx_invoices_unique_number
ON invoices(point_of_sale, invoice_type, invoice_number);

-- RLS policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = invoices.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Create settings table if not exists (for ARCA config and other settings)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Only admin can manage settings
CREATE POLICY "Admin full access on settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can read non-sensitive settings
CREATE POLICY "Public can read public settings" ON settings
  FOR SELECT USING (
    key NOT LIKE '%_secret%'
    AND key NOT LIKE '%_password%'
    AND key NOT LIKE '%certificate%'
  );

-- Insert default ARCA config (placeholder)
INSERT INTO settings (key, value, description)
VALUES (
  'arca_config',
  '{
    "cuit": "",
    "certificate": "",
    "certificatePassword": "",
    "pointOfSale": 1,
    "ivaCondition": 1,
    "businessName": "",
    "address": "",
    "isHomologation": true
  }'::jsonb,
  'ARCA (ex AFIP) electronic invoicing configuration'
)
ON CONFLICT (key) DO NOTHING;
