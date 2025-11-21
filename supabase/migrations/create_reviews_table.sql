-- Reviews/Ratings table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id), -- Verify purchase

  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,

  -- Media
  images TEXT[], -- Array of image URLs

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderated_at TIMESTAMP,
  moderated_by UUID,
  rejection_reason VARCHAR(500),

  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,

  -- Seller response
  seller_response TEXT,
  seller_responded_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- One review per product per user
  UNIQUE(product_id, user_id)
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created ON reviews(created_at);

-- RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Public can view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (user_id = auth.uid());

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending reviews
CREATE POLICY "Users can update own pending reviews" ON reviews
  FOR UPDATE USING (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (user_id = auth.uid());

-- Admin can do everything
CREATE POLICY "Admin full access on reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Sellers can respond to reviews on their products
CREATE POLICY "Sellers can respond to reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = reviews.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Users can vote on reviews
CREATE POLICY "Users can manage own votes" ON review_votes
  FOR ALL USING (user_id = auth.uid());

-- Anyone can view votes
CREATE POLICY "Public can view votes" ON review_votes
  FOR SELECT USING (true);

-- Function to update product rating average
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's average rating and review count
  UPDATE products
  SET
    rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND status = 'approved'
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND status = 'approved'
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product rating on review changes
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM review_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    AND is_helpful = true
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update helpful count
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_votes;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- Add rating and review_count columns to products if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'rating') THEN
    ALTER TABLE products ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'review_count') THEN
    ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;
