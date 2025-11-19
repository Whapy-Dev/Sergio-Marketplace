-- =====================================================
-- Migration: Marketplace Finances & Commissions System
-- Description: Add financial management for centralized marketplace
-- =====================================================

-- 1. ADD COMMISSION RATE TO CATEGORIES
-- =====================================================
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;

COMMENT ON COLUMN categories.commission_rate IS 'Percentage commission charged by marketplace (0-100)';

-- 2. ADD COMMISSION RATE TO OFFICIAL STORES
-- =====================================================
ALTER TABLE official_stores
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00;

COMMENT ON COLUMN official_stores.commission_rate IS 'Custom commission rate for this store (overrides category rate if set)';

-- 3. ADD BANKING DETAILS TO PROFILES
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cbu_cvu VARCHAR(22),
ADD COLUMN IF NOT EXISTS mp_alias VARCHAR(100),
ADD COLUMN IF NOT EXISTS cuil_cuit VARCHAR(13),
ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(10,2) DEFAULT 0.00;

COMMENT ON COLUMN profiles.cbu_cvu IS 'CBU/CVU for bank transfers';
COMMENT ON COLUMN profiles.mp_alias IS 'Mercado Pago alias';
COMMENT ON COLUMN profiles.cuil_cuit IS 'CUIL/CUIT for tax purposes';
COMMENT ON COLUMN profiles.account_holder_name IS 'Name on bank account';
COMMENT ON COLUMN profiles.available_balance IS 'Balance available for withdrawal';
COMMENT ON COLUMN profiles.pending_balance IS 'Balance pending (orders not delivered yet)';
COMMENT ON COLUMN profiles.total_withdrawn IS 'Total amount withdrawn historically';

-- 4. CREATE WITHDRAWAL REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL, -- 'cbu_cvu' or 'mp_alias'
  payment_details JSONB, -- Contains CBU/CVU or MP alias at time of request
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  transaction_reference VARCHAR(255), -- Bank transaction ID or MP transaction ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for withdrawal_requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_seller ON withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested_at ON withdrawal_requests(requested_at DESC);

-- 5. CREATE SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('minimum_withdrawal_amount', '5000', 'Minimum amount in ARS for withdrawal requests'),
  ('marketplace_owner_id', 'null', 'User ID of the marketplace owner (their products have 0% commission)'),
  ('default_commission_rate', '10.00', 'Default commission rate if category has none set')
ON CONFLICT (key) DO NOTHING;

-- 6. CREATE BALANCE TRANSACTIONS TABLE (for audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('sale', 'withdrawal', 'refund', 'adjustment', 'commission')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(50), -- 'order', 'withdrawal_request', etc.
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for balance_transactions
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_reference ON balance_transactions(reference_type, reference_id);

-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Withdrawal Requests RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own withdrawal requests
CREATE POLICY "Sellers can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create their own withdrawal requests
CREATE POLICY "Sellers can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can cancel their own pending withdrawal requests
CREATE POLICY "Sellers can cancel own pending requests"
  ON withdrawal_requests FOR UPDATE
  USING (auth.uid() = seller_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Admins can view all withdrawal requests (implement with proper admin check)
-- TODO: Add admin role check when roles system is implemented

-- Settings RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  USING (true);

-- Only admins can update settings (TODO: add admin role check)

-- Balance Transactions RLS
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance transactions
CREATE POLICY "Users can view own balance transactions"
  ON balance_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 8. FUNCTIONS
-- =====================================================

-- Function to update withdrawal request status
CREATE OR REPLACE FUNCTION update_withdrawal_request_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- If status changed to completed, update seller balance
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = NOW();

    -- Deduct from available balance
    UPDATE profiles
    SET
      available_balance = available_balance - NEW.amount,
      total_withdrawn = total_withdrawn + NEW.amount
    WHERE id = NEW.seller_id;

    -- Create balance transaction
    INSERT INTO balance_transactions (user_id, type, amount, balance_after, reference_type, reference_id, description)
    SELECT
      NEW.seller_id,
      'withdrawal',
      -NEW.amount,
      available_balance,
      'withdrawal_request',
      NEW.id,
      'Withdrawal completed'
    FROM profiles WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_withdrawal_request_status
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_request_status();

-- Function to calculate seller payout for an order item
CREATE OR REPLACE FUNCTION calculate_seller_payout(
  p_product_id UUID,
  p_seller_id UUID,
  p_category_id UUID,
  p_unit_price DECIMAL,
  p_quantity INTEGER
) RETURNS TABLE (
  subtotal DECIMAL,
  commission_rate DECIMAL,
  commission_amount DECIMAL,
  seller_payout DECIMAL
) AS $$
DECLARE
  v_commission_rate DECIMAL;
  v_marketplace_owner_id UUID;
  v_store_commission_rate DECIMAL;
  v_category_commission_rate DECIMAL;
  v_subtotal DECIMAL;
  v_commission_amount DECIMAL;
  v_seller_payout DECIMAL;
BEGIN
  -- Calculate subtotal
  v_subtotal := p_unit_price * p_quantity;

  -- Get marketplace owner ID
  SELECT (value::text)::uuid INTO v_marketplace_owner_id
  FROM settings WHERE key = 'marketplace_owner_id';

  -- If seller is marketplace owner, commission is 0
  IF p_seller_id = v_marketplace_owner_id THEN
    v_commission_rate := 0.00;
  ELSE
    -- Check if seller has an official store with custom commission rate
    SELECT commission_rate INTO v_store_commission_rate
    FROM official_stores
    WHERE user_id = p_seller_id AND is_active = true
    LIMIT 1;

    -- If store has custom rate, use it
    IF v_store_commission_rate IS NOT NULL THEN
      v_commission_rate := v_store_commission_rate;
    ELSE
      -- Otherwise use category commission rate
      SELECT commission_rate INTO v_category_commission_rate
      FROM categories WHERE id = p_category_id;

      -- If category has no rate, use default
      IF v_category_commission_rate IS NULL THEN
        SELECT (value::text)::decimal INTO v_commission_rate
        FROM settings WHERE key = 'default_commission_rate';
      ELSE
        v_commission_rate := v_category_commission_rate;
      END IF;
    END IF;
  END IF;

  -- Calculate commission and payout
  v_commission_amount := (v_subtotal * v_commission_rate / 100);
  v_seller_payout := v_subtotal - v_commission_amount;

  RETURN QUERY SELECT
    v_subtotal,
    v_commission_rate,
    v_commission_amount,
    v_seller_payout;
END;
$$ LANGUAGE plpgsql;

-- Function to update balances when order status changes
CREATE OR REPLACE FUNCTION update_seller_balance_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- When order is marked as delivered, move from pending to available
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    FOR v_item IN
      SELECT * FROM order_items WHERE order_id = NEW.id
    LOOP
      -- Move from pending to available balance
      UPDATE profiles
      SET
        pending_balance = pending_balance - v_item.seller_payout,
        available_balance = available_balance + v_item.seller_payout
      WHERE id = v_item.seller_id;

      -- Create balance transaction
      INSERT INTO balance_transactions (user_id, type, amount, balance_after, reference_type, reference_id, description)
      SELECT
        v_item.seller_id,
        'sale',
        v_item.seller_payout,
        available_balance,
        'order',
        NEW.id,
        'Sale completed - Order delivered'
      FROM profiles WHERE id = v_item.seller_id;
    END LOOP;
  END IF;

  -- When order is paid, add to pending balance
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    FOR v_item IN
      SELECT * FROM order_items WHERE order_id = NEW.id
    LOOP
      UPDATE profiles
      SET pending_balance = pending_balance + v_item.seller_payout
      WHERE id = v_item.seller_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_order_status_update_balance'
  ) THEN
    CREATE TRIGGER trg_order_status_update_balance
      AFTER UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_seller_balance_on_order();
  END IF;
END $$;

-- 9. HELPER VIEWS
-- =====================================================

-- View for seller earnings summary
CREATE OR REPLACE VIEW seller_earnings_summary AS
SELECT
  p.id as seller_id,
  p.full_name,
  p.email,
  p.available_balance,
  p.pending_balance,
  p.total_withdrawn,
  (p.available_balance + p.pending_balance + p.total_withdrawn) as total_earned,
  COUNT(DISTINCT oi.order_id) as total_orders,
  SUM(oi.seller_payout) as lifetime_earnings,
  SUM(oi.commission_amount) as lifetime_commissions
FROM profiles p
LEFT JOIN order_items oi ON oi.seller_id = p.id
WHERE p.can_sell = true
GROUP BY p.id, p.full_name, p.email, p.available_balance, p.pending_balance, p.total_withdrawn;

-- Grant access to views
GRANT SELECT ON seller_earnings_summary TO authenticated;

COMMENT ON TABLE withdrawal_requests IS 'Seller withdrawal requests';
COMMENT ON TABLE settings IS 'Global marketplace settings';
COMMENT ON TABLE balance_transactions IS 'Audit trail of all balance changes';
COMMENT ON VIEW seller_earnings_summary IS 'Summary of seller earnings and balances';
