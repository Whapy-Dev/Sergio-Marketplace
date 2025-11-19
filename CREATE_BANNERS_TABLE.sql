-- =====================================================
-- CREAR TABLA BANNERS + INSERTAR DATOS DE PRUEBA
-- =====================================================
-- Ejecuta este SQL completo en el SQL Editor de Supabase
-- =====================================================

-- 1. CREAR LA TABLA BANNERS
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

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(starts_at, ends_at);

-- 3. HABILITAR RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS RLS (PÚBLICAS)
-- Cualquiera puede ver banners activos
DROP POLICY IF EXISTS "Banners are publicly readable" ON public.banners;
CREATE POLICY "Banners are publicly readable"
  ON public.banners
  FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden gestionar banners
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.banners;
CREATE POLICY "Authenticated users can manage banners"
  ON public.banners
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. INSERTAR BANNERS DE PRUEBA
INSERT INTO public.banners (
  title,
  description,
  image_url,
  link_type,
  link_value,
  display_order,
  is_active
) VALUES
  (
    'Ofertas de Verano',
    'Hasta 50% de descuento en productos seleccionados',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
    'none',
    NULL,
    1,
    true
  ),
  (
    'Electrónica Premium',
    'Los mejores dispositivos al mejor precio',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
    'category',
    'Electrónica',
    2,
    true
  ),
  (
    'Envío Gratis',
    'En compras superiores a $50.000',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    'none',
    NULL,
    3,
    true
  );

-- 6. VERIFICAR
SELECT
  id,
  title,
  link_type,
  display_order,
  is_active,
  created_at
FROM public.banners
ORDER BY display_order;

-- 7. MENSAJE DE ÉXITO
SELECT
  'Tabla banners creada exitosamente!' as mensaje,
  COUNT(*) as total_banners
FROM public.banners
WHERE is_active = true;
