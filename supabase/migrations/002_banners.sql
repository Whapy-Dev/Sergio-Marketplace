-- ============================================
-- MIGRACIÓN: Sistema de Banners
-- Descripción: Tabla para gestionar banners del carrusel en la home
-- Fecha: 2025-11-18
-- ============================================

-- Crear tabla de banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_type VARCHAR(50) DEFAULT 'none' CHECK (link_type IN ('product', 'category', 'store', 'external', 'none')),
  link_value TEXT, -- ID del producto/tienda, slug de categoría, o URL externa
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_banners_created_by ON banners(created_by);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banners_updated_at_trigger
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_updated_at();

-- RLS Policies
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver banners activos
CREATE POLICY "Anyone can view active banners"
  ON banners
  FOR SELECT
  USING (is_active = true);

-- Policy: Usuarios autenticados pueden ver todos los banners
CREATE POLICY "Authenticated users can view all banners"
  ON banners
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Solo usuarios autenticados pueden crear banners
CREATE POLICY "Authenticated users can create banners"
  ON banners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Solo usuarios autenticados pueden actualizar banners
CREATE POLICY "Authenticated users can update banners"
  ON banners
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Solo usuarios autenticados pueden eliminar banners
CREATE POLICY "Authenticated users can delete banners"
  ON banners
  FOR DELETE
  TO authenticated
  USING (true);

-- Función helper para obtener banners activos
CREATE OR REPLACE FUNCTION get_active_banners()
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  link_type VARCHAR(50),
  link_value TEXT,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.description,
    b.image_url,
    b.link_type,
    b.link_value,
    b.display_order
  FROM banners b
  WHERE b.is_active = true
    AND (b.starts_at IS NULL OR b.starts_at <= NOW())
    AND (b.ends_at IS NULL OR b.ends_at >= NOW())
  ORDER BY b.display_order ASC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Crear storage bucket para banners (si no existe)
-- Nota: Esto debe ejecutarse desde el dashboard de Supabase en la sección Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('banners', 'banners', true)
-- ON CONFLICT (id) DO NOTHING;

-- Comentario con instrucciones
COMMENT ON TABLE banners IS 'Tabla para gestionar banners del carrusel en la home. Permite programar campañas y configurar enlaces.';
