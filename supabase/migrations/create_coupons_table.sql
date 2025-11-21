-- Create coupons table for discount system
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic info
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Discount type
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,

  -- Limits
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2), -- Max discount amount (for percentage)
  usage_limit INTEGER, -- Total uses allowed (null = unlimited)
  usage_per_user INTEGER DEFAULT 1, -- Uses per user
  current_usage INTEGER DEFAULT 0,

  -- Validity
  starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Restrictions
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product', 'seller')),
  applies_to_ids UUID[], -- Array of category/product/seller IDs
  exclude_ids UUID[], -- Excluded items

  -- User restrictions
  first_purchase_only BOOLEAN DEFAULT false,
  new_users_only BOOLEAN DEFAULT false, -- Users registered in last 30 days
  specific_users UUID[], -- Only these users can use (null = all users)

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  discount_applied DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, starts_at, expires_at);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);

-- RLS policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Admin can manage all coupons
CREATE POLICY "Admin full access on coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view active coupons
CREATE POLICY "Users can view active coupons" ON coupons
  FOR SELECT USING (
    is_active = true
    AND starts_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Admin can see all usage
CREATE POLICY "Admin full access on coupon_usage" ON coupon_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can see their own usage
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
  FOR SELECT USING (user_id = auth.uid());

-- System can insert usage (via service role)
CREATE POLICY "System can insert coupon usage" ON coupon_usage
  FOR INSERT WITH CHECK (true);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code VARCHAR,
  p_user_id UUID,
  p_cart_total DECIMAL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL
) RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_amount DECIMAL,
  error_message VARCHAR
) AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage INTEGER;
  v_discount DECIMAL;
  v_user_created TIMESTAMP;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  AND is_active = true
  AND starts_at <= NOW()
  AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Cupón no válido o expirado'::VARCHAR;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.current_usage >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Cupón agotado'::VARCHAR;
    RETURN;
  END IF;

  -- Check user usage
  SELECT COUNT(*) INTO v_user_usage
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

  IF v_user_usage >= v_coupon.usage_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Ya usaste este cupón'::VARCHAR;
    RETURN;
  END IF;

  -- Check minimum purchase
  IF p_cart_total < v_coupon.min_purchase THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL,
      ('Compra mínima: $' || v_coupon.min_purchase::VARCHAR)::VARCHAR;
    RETURN;
  END IF;

  -- Check first purchase only
  IF v_coupon.first_purchase_only THEN
    IF EXISTS (SELECT 1 FROM orders WHERE buyer_id = p_user_id AND status != 'cancelled') THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Solo válido para primera compra'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  -- Check new users only
  IF v_coupon.new_users_only THEN
    SELECT created_at INTO v_user_created FROM profiles WHERE id = p_user_id;
    IF v_user_created < NOW() - INTERVAL '30 days' THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Solo válido para usuarios nuevos'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  -- Check specific users
  IF v_coupon.specific_users IS NOT NULL AND array_length(v_coupon.specific_users, 1) > 0 THEN
    IF NOT p_user_id = ANY(v_coupon.specific_users) THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Cupón no disponible para tu cuenta'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_cart_total * (v_coupon.discount_value / 100);
    -- Apply max discount cap
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- Don't exceed cart total
  IF v_discount > p_cart_total THEN
    v_discount := p_cart_total;
  END IF;

  RETURN QUERY SELECT true, v_coupon.id, v_discount, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
  VALUES (p_coupon_id, p_user_id, p_order_id, p_discount_amount);

  -- Increment usage counter
  UPDATE coupons
  SET current_usage = current_usage + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
