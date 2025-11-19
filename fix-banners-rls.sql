-- =====================================================
-- ARREGLAR POLÍTICAS RLS PARA BANNERS
-- =====================================================

-- 1. Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Banners activos son públicos" ON public.banners;
DROP POLICY IF EXISTS "Solo admins pueden gestionar banners" ON public.banners;
DROP POLICY IF EXISTS "Cualquiera puede ver banners" ON public.banners;
DROP POLICY IF EXISTS "Banners públicos" ON public.banners;

-- 2. Habilitar RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Crear política simple: TODOS pueden ver banners (para mobile app)
CREATE POLICY "Banners are publicly readable"
  ON public.banners
  FOR SELECT
  USING (true);

-- 4. Política: Solo usuarios autenticados pueden insertar/actualizar/eliminar
CREATE POLICY "Authenticated users can manage banners"
  ON public.banners
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'banners';
