# Solución: Error PGRST205 - "Could not find table 'public.banners' in schema cache"

## 🔍 Diagnóstico

El error `PGRST205` indica que **PostgREST (la API de Supabase) no puede ver la tabla `banners` en su schema cache**, aunque la tabla SÍ existe en PostgreSQL.

**Verificación realizada:**
- ✅ La tabla `banners` existe en la base de datos
- ✅ Tiene 0 registros
- ❌ PostgREST no la ve en el schema cache

---

## ✅ Solución 1: Refrescar Schema Cache (RECOMENDADO)

### Paso 1: Ir al Dashboard de Supabase
1. Abre: https://supabase.com/dashboard/project/dhfnfdschxhfwrfaoyqa
2. Inicia sesión si es necesario

### Paso 2: Recargar el Schema
**Opción A - Reload Schema:**
1. Ve a **Settings** (⚙️) en el menú lateral
2. Haz clic en **API**
3. Busca el botón **"Reload schema cache"** o **"Schema"**
4. Haz clic en **Reload**

**Opción B - Restart Project:**
1. Ve a **Settings** → **General**
2. Busca la sección **"Danger Zone"**
3. Haz clic en **"Restart project"**
4. Confirma

### Paso 3: Esperar
- Espera **1-2 minutos** después del reload/restart
- El schema cache se actualizará automáticamente

### Paso 4: Verificar
- Abre tu app mobile
- Navega a la home
- Los banners deberían cargarse sin error

---

## ✅ Solución 2: Insertar Banners de Prueba

Mientras se refresca el cache, puedes insertar banners de prueba:

### Desde el Dashboard de Supabase:
1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de `insert-test-banners.sql`
3. Haz clic en **Run**
4. Verifica que se insertaron 3 banners

### Desde la línea de comandos:
```bash
# Si tienes psql instalado
psql "postgresql://postgres:[PASSWORD]@db.dhfnfdschxhfwrfaoyqa.supabase.co:5432/postgres" < insert-test-banners.sql
```

---

## ✅ Solución 3: Arreglar Políticas RLS

Si después de refrescar aún tienes problemas, ejecuta:

### Desde SQL Editor:
1. Abre el archivo `fix-banners-rls.sql`
2. Copia todo el contenido
3. Pégalo en SQL Editor de Supabase
4. Ejecuta

Esto creará políticas RLS que permiten:
- ✅ Lectura pública de banners (para app mobile)
- ✅ Escritura solo para usuarios autenticados

---

## 🔍 Verificación Manual

Puedes verificar que todo funciona ejecutando:

```bash
node create-test-banner.js
```

Deberías ver:
```
✅ Banners leídos exitosamente: 3 banners
✅ Total de banners: 3
✅ Estructura verificada correctamente
```

---

## 📱 Código de la App Mobile

Si la app mobile sigue mostrando el error después de refrescar, verifica que esté usando esta query:

```typescript
const { data: banners } = await supabase
  .from('banners')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

---

## 🆘 Si Nada Funciona

1. **Espera 5 minutos** - A veces el cache tarda en refrescarse
2. **Limpia la caché de la app**:
   - iOS: Desinstala y reinstala la app
   - Android: Settings → Apps → Tu App → Clear cache
3. **Contacta a soporte de Supabase** si el problema persiste

---

## 📋 Tablas Verificadas

Estas tablas existen y funcionan correctamente:
- ✅ profiles (25 registros)
- ✅ products (43 registros)
- ✅ categories (16 registros)
- ✅ orders (40 registros)
- ✅ order_items (40 registros)
- ✅ official_stores (5 registros)
- ✅ banners (0 registros) - **NECESITA REFRESCAR CACHE**

---

## 🎯 Resumen

**El problema NO es código, es configuración de Supabase.**

**Acción requerida:**
1. Refrescar schema cache desde Dashboard de Supabase
2. Insertar banners de prueba (opcional)
3. Esperar 1-2 minutos
4. Probar la app nuevamente

✅ **El carrito funciona perfectamente**, solo falta arreglar el cache de banners.
