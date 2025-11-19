-- =====================================================
-- INSERTAR BANNERS DE PRUEBA
-- =====================================================

-- Eliminar banners existentes (si hay)
TRUNCATE TABLE public.banners CASCADE;

-- Insertar banners de ejemplo
INSERT INTO public.banners (title, description, image_url, link_type, link_value, display_order, is_active)
VALUES
  (
    'Ofertas de Verano',
    'Hasta 50% de descuento en productos seleccionados',
    'https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Ofertas+de+Verano',
    'category',
    'Electrónica',
    1,
    true
  ),
  (
    'Nuevos Productos',
    'Descubre lo último en tecnología',
    'https://via.placeholder.com/800x400/4ECDC4/FFFFFF?text=Nuevos+Productos',
    'none',
    NULL,
    2,
    true
  ),
  (
    'Envío Gratis',
    'En compras superiores a $50.000',
    'https://via.placeholder.com/800x400/45B7D1/FFFFFF?text=Envio+Gratis',
    'none',
    NULL,
    3,
    true
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
