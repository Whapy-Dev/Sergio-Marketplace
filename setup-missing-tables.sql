-- =====================================================
-- TABLAS FALTANTES PARA EL MARKETPLACE
-- =====================================================

-- Tabla: banners (para el carrusel de la home)
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

-- Índices para banners
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(starts_at, ends_at);

-- RLS para banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver banners activos
CREATE POLICY "Banners activos son públicos"
  ON public.banners
  FOR SELECT
  USING (is_active = true);

-- Política: Solo admins pueden gestionar banners (crear, actualizar, eliminar)
CREATE POLICY "Solo admins pueden gestionar banners"
  ON public.banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- Tabla: product_images (imágenes adicionales de productos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, display_order);

-- RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Política: Las imágenes son públicas (cualquiera puede ver)
CREATE POLICY "Imágenes de productos son públicas"
  ON public.product_images
  FOR SELECT
  USING (true);

-- Política: Solo el dueño del producto puede gestionar sus imágenes
CREATE POLICY "Dueño puede gestionar imágenes de producto"
  ON public.product_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id
      AND seller_id = auth.uid()
    )
  );

-- =====================================================
-- Tabla: recently_viewed (productos vistos recientemente)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id, viewed_at DESC);

-- RLS
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario puede ver su propio historial
CREATE POLICY "Usuario puede ver su historial"
  ON public.recently_viewed
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Solo el usuario puede agregar a su historial
CREATE POLICY "Usuario puede agregar a su historial"
  ON public.recently_viewed
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Tabla: search_history (historial de búsquedas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, searched_at DESC);

-- RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario puede ver su historial
CREATE POLICY "Usuario puede ver su historial de búsqueda"
  ON public.search_history
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Usuarios autenticados pueden agregar búsquedas
CREATE POLICY "Usuario puede agregar búsquedas"
  ON public.search_history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Tabla: notifications (notificaciones para usuarios)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'product', 'withdrawal', 'message', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario puede ver sus notificaciones
CREATE POLICY "Usuario puede ver sus notificaciones"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Solo el usuario puede actualizar sus notificaciones (marcar como leído)
CREATE POLICY "Usuario puede actualizar sus notificaciones"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Crear bucket para banners (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acceso para bucket de banners
CREATE POLICY "Cualquiera puede ver banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Solo admins pueden subir banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función: Limpiar historial de vistas antiguo (más de 30 días)
CREATE OR REPLACE FUNCTION clean_old_recently_viewed()
RETURNS void AS $$
BEGIN
  DELETE FROM public.recently_viewed
  WHERE viewed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Limpiar historial de búsqueda antiguo (más de 60 días)
CREATE OR REPLACE FUNCTION clean_old_search_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE searched_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en banners
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.banners IS 'Banners para el carrusel de la home';
COMMENT ON TABLE public.product_images IS 'Imágenes adicionales de productos';
COMMENT ON TABLE public.recently_viewed IS 'Productos vistos recientemente por usuario';
COMMENT ON TABLE public.search_history IS 'Historial de búsquedas';
COMMENT ON TABLE public.notifications IS 'Notificaciones para usuarios';

-- =====================================================
-- COMPLETADO
-- =====================================================

SELECT 'Tablas creadas exitosamente!' as status;
