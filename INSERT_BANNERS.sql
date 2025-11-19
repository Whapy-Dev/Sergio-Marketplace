-- =====================================================
-- INSERTAR BANNERS DE PRUEBA
-- =====================================================
-- Ejecuta este SQL en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/dhfnfdschxhfwrfaoyqa/sql
-- =====================================================

-- Limpiar banners existentes (opcional)
TRUNCATE TABLE public.banners CASCADE;

-- Insertar 3 banners de prueba
INSERT INTO public.banners (
  title,
  description,
  image_url,
  link_type,
  link_value,
  display_order,
  is_active,
  created_at
) VALUES
  (
    'Ofertas de Verano',
    'Hasta 50% de descuento en productos seleccionados',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
    'none',
    NULL,
    1,
    true,
    NOW()
  ),
  (
    'Electrónica Premium',
    'Los mejores dispositivos al mejor precio',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
    'category',
    'Electrónica',
    2,
    true,
    NOW()
  ),
  (
    'Envío Gratis',
    'En compras superiores a $50.000',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    'none',
    NULL,
    3,
    true,
    NOW()
  );

-- Verificar que se insertaron
SELECT
  id,
  title,
  link_type,
  display_order,
  is_active,
  created_at
FROM public.banners
ORDER BY display_order;

-- Mensaje de éxito
SELECT 'Banners insertados exitosamente!' as mensaje,
       COUNT(*) as total_banners
FROM public.banners
WHERE is_active = true;
