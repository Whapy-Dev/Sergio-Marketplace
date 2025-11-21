-- Function to calculate seller payout and commission
CREATE OR REPLACE FUNCTION calculate_seller_payout(
  p_product_id UUID,
  p_seller_id UUID,
  p_category_id UUID,
  p_unit_price DECIMAL,
  p_quantity INTEGER
)
RETURNS TABLE (
  subtotal DECIMAL,
  commission_rate DECIMAL,
  commission_amount DECIMAL,
  seller_payout DECIMAL
) AS $$
DECLARE
  v_subtotal DECIMAL;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_seller_payout DECIMAL;
  v_marketplace_owner_id UUID;
BEGIN
  -- Calculate subtotal
  v_subtotal := p_unit_price * p_quantity;

  -- Check if seller is marketplace owner (0% commission)
  SELECT value::TEXT INTO v_marketplace_owner_id
  FROM settings
  WHERE key = 'marketplace_owner_id';

  IF p_seller_id::TEXT = v_marketplace_owner_id THEN
    v_commission_rate := 0;
  ELSE
    -- Get commission rate from category
    SELECT COALESCE(c.commission_rate, 10.0) INTO v_commission_rate
    FROM categories c
    WHERE c.id = p_category_id;

    -- If no category found, use default commission rate
    IF v_commission_rate IS NULL THEN
      SELECT COALESCE(value::DECIMAL, 10.0) INTO v_commission_rate
      FROM settings
      WHERE key = 'default_commission_rate';

      IF v_commission_rate IS NULL THEN
        v_commission_rate := 10.0;
      END IF;
    END IF;
  END IF;

  -- Calculate commission and payout
  v_commission_amount := ROUND((v_subtotal * v_commission_rate) / 100, 2);
  v_seller_payout := v_subtotal - v_commission_amount;

  RETURN QUERY SELECT v_subtotal, v_commission_rate, v_commission_amount, v_seller_payout;
END;
$$ LANGUAGE plpgsql;
