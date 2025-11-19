-- =====================================================
-- CREAR TODAS LAS TABLAS FALTANTES DEL MARKETPLACE
-- =====================================================
-- Ejecuta este SQL completo en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- 1. TABLA: seller_wallets (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seller_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  available_balance DECIMAL(12, 2) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(12, 2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_withdrawn DECIMAL(12, 2) DEFAULT 0 CHECK (total_withdrawn >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_wallets_user ON public.seller_wallets(user_id);

-- RLS para seller_wallets
ALTER TABLE public.seller_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.seller_wallets;
CREATE POLICY "Users can view own wallet"
  ON public.seller_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.seller_wallets;
CREATE POLICY "Users can update own wallet"
  ON public.seller_wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. TABLA: withdrawal_requests (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  payment_method TEXT DEFAULT 'bank_transfer',
  bank_account_info JSONB,
  admin_notes TEXT,
  rejection_reason TEXT,
  transaction_reference TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status, requested_at DESC);

-- RLS para withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can create withdrawals"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. TABLA: cart_items (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id, added_at DESC);

-- RLS para cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. TABLA: banners (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_type TEXT CHECK (link_type IN ('product', 'category', 'store', 'external', 'none')) DEFAULT 'none',
  link_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(starts_at, ends_at);

-- RLS para banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners are publicly readable" ON public.banners;
CREATE POLICY "Banners are publicly readable"
  ON public.banners FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.banners;
CREATE POLICY "Authenticated users can manage banners"
  ON public.banners FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 5. TABLA: settings (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- RLS para settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;
CREATE POLICY "Settings are publicly readable"
  ON public.settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only authenticated can update settings" ON public.settings;
CREATE POLICY "Only authenticated can update settings"
  ON public.settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 6. TABLA: recently_viewed (OPCIONAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id, viewed_at DESC);

-- RLS para recently_viewed
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own history" ON public.recently_viewed;
CREATE POLICY "Users can manage own history"
  ON public.recently_viewed FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. TABLA: search_history (OPCIONAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, searched_at DESC);

-- RLS para search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own searches" ON public.search_history;
CREATE POLICY "Users can manage own searches"
  ON public.search_history FOR ALL
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Banners de prueba
INSERT INTO public.banners (title, description, image_url, link_type, link_value, display_order, is_active)
VALUES
  ('Ofertas de Verano', 'Hasta 50% de descuento en productos seleccionados', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop', 'none', NULL, 1, true),
  ('Electrónica Premium', 'Los mejores dispositivos al mejor precio', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop', 'category', 'Electrónica', 2, true),
  ('Envío Gratis', 'En compras superiores a $50.000', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop', 'none', NULL, 3, true)
ON CONFLICT DO NOTHING;

-- Settings iniciales
INSERT INTO public.settings (key, value, description)
VALUES
  ('minimum_withdrawal_amount', '"5000"'::jsonb, 'Monto mínimo de retiro en pesos argentinos'),
  ('default_commission_rate', '"10.00"'::jsonb, 'Comisión por defecto para categorías sin comisión específica'),
  ('marketplace_owner_id', '"null"'::jsonb, 'ID del usuario dueño del marketplace (sus productos tienen comisión 0%)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'TABLAS CREADAS EXITOSAMENTE!' as mensaje;

SELECT
  'seller_wallets' as tabla,
  COUNT(*) as registros
FROM public.seller_wallets
UNION ALL
SELECT 'withdrawal_requests', COUNT(*) FROM public.withdrawal_requests
UNION ALL
SELECT 'cart_items', COUNT(*) FROM public.cart_items
UNION ALL
SELECT 'banners', COUNT(*) FROM public.banners
UNION ALL
SELECT 'settings', COUNT(*) FROM public.settings
UNION ALL
SELECT 'recently_viewed', COUNT(*) FROM public.recently_viewed
UNION ALL
SELECT 'search_history', COUNT(*) FROM public.search_history;
