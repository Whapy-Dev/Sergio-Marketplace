-- ============================================
-- MIGRACIÓN: Sistema de Órdenes y Pagos
-- Descripción: Tablas para gestionar órdenes, items, y pagos con MercadoPago
-- Fecha: 2025-11-18
-- ============================================

-- Crear tipo ENUM para estados de orden
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Crear tipo ENUM para métodos de pago
CREATE TYPE payment_method AS ENUM ('mercadopago', 'cash', 'transfer', 'other');

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Detalles de la orden
  status order_status DEFAULT 'pending',
  payment_method payment_method DEFAULT 'mercadopago',

  -- Montos
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Datos del comprador (snapshot al momento de compra)
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  buyer_phone VARCHAR(50),

  -- Dirección de envío
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100) DEFAULT 'Argentina',

  -- MercadoPago
  mercadopago_payment_id VARCHAR(255),
  mercadopago_preference_id VARCHAR(255),
  mercadopago_status VARCHAR(50),
  mercadopago_status_detail VARCHAR(255),

  -- Tracking
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),

  -- Notas
  buyer_notes TEXT,
  seller_notes TEXT,
  admin_notes TEXT,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de orden
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Snapshot del producto al momento de compra
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  product_image_url TEXT,

  -- Precios y cantidades
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  -- Vendedor (para comisiones y reportes)
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pagos (para múltiples pagos parciales si es necesario)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,

  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method DEFAULT 'mercadopago',
  status VARCHAR(50) DEFAULT 'pending',

  -- MercadoPago
  mercadopago_payment_id VARCHAR(255) UNIQUE,
  mercadopago_response JSONB,

  -- Metadata
  metadata JSONB,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago ON payments(mercadopago_payment_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Formato: ORD-YYYYMMDD-XXXXX
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');

    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar order_number si no se provee
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- RLS Policies para orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Compradores pueden ver sus propias órdenes
CREATE POLICY "Buyers can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Vendedores pueden ver órdenes donde son el vendedor
CREATE POLICY "Sellers can view their orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Usuarios autenticados pueden crear órdenes
CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Vendedores pueden actualizar sus órdenes
CREATE POLICY "Sellers can update their orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- RLS Policies para order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Ver items de órdenes propias (como comprador o vendedor)
CREATE POLICY "Users can view items of their orders"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- Crear items al crear orden
CREATE POLICY "Users can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- RLS Policies para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Ver pagos de órdenes propias
CREATE POLICY "Users can view payments of their orders"
  ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- Crear pagos
CREATE POLICY "System can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Actualizar pagos (para webhooks)
CREATE POLICY "System can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Función helper para obtener órdenes con detalles
CREATE OR REPLACE FUNCTION get_order_details(order_uuid UUID)
RETURNS TABLE (
  order_data JSON,
  items JSON,
  buyer JSON,
  seller JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_to_json(o.*) AS order_data,
    COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items,
    row_to_json(bp.*) AS buyer,
    row_to_json(sp.*) AS seller
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN profiles bp ON bp.id = o.buyer_id
  LEFT JOIN profiles sp ON sp.id = o.seller_id
  WHERE o.id = order_uuid
  GROUP BY o.id, bp.id, sp.id;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE orders IS 'Tabla principal de órdenes/pedidos del marketplace';
COMMENT ON TABLE order_items IS 'Items individuales de cada orden (productos comprados)';
COMMENT ON TABLE payments IS 'Registro de pagos asociados a órdenes';
COMMENT ON COLUMN orders.order_number IS 'Número de orden único y legible (ORD-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN orders.mercadopago_payment_id IS 'ID del pago en MercadoPago';
COMMENT ON COLUMN orders.mercadopago_preference_id IS 'ID de la preferencia de pago creada';
