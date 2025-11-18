# 🎨 Setup Sistema de Banners

## ¿Qué se implementó?

Un sistema completo de gestión de banners para el carrusel de la home:

**CRM Web:**
- Crear/editar/eliminar banners
- Upload de imágenes a Supabase Storage
- Configurar enlaces (productos, categorías, tiendas, URLs externas)
- Programar inicio/fin de campañas
- Ordenar banners por prioridad
- Activar/desactivar banners

**App Mobile:**
- Carrusel horizontal con swipe
- Dots de paginación
- Clicks en banners navegan según el tipo de enlace
- Fallback al banner por defecto si no hay banners
- Pull-to-refresh

---

## ⚠️ PASOS CRÍTICOS

### PASO 1: Ejecutar Migración SQL

1. Abre Supabase Dashboard:
   ```
   https://app.supabase.com/project/dhfnfdschxhfwrfaoyqa
   ```

2. Ve a **"SQL Editor"** → **"New query"**

3. Abre el archivo:
   ```
   C:\Users\marti\Desktop\Sergio-Marketplace-main\supabase\migrations\002_banners.sql
   ```

4. Copia **TODO** el contenido

5. Pégalo en el editor y click en **"Run"**

6. Verifica que diga **"Success"**

7. Ve a **"Table Editor"** y confirma que existe la tabla **`banners`**

---

### PASO 2: Crear Storage Bucket

1. En Supabase Dashboard, ve a **"Storage"**

2. Click en **"New bucket"**

3. Configura:
   - **Name:** `banners`
   - **Public:** ✅ **YES** (importante!)
   - **File size limit:** 5 MB (recomendado)
   - **Allowed MIME types:** `image/*`

4. Click **"Create bucket"**

5. Ve a la configuración del bucket y asegúrate que sea **público**

---

### PASO 3: Verificar Setup

Ejecuta el script de verificación:

```bash
cd "C:\Users\marti\Desktop\Sergio-Marketplace-main"
node setup-banners.js
```

**Resultado esperado:**
```
✅ Table "banners" exists!
📊 Current banners in database: 0
✅ Storage bucket "banners" exists
```

Si ves errores, revisa los pasos anteriores.

---

## 🧪 Cómo Probar

### 1. Crear tu Primer Banner en el CRM

1. Abre el CRM (si no está corriendo):
   ```bash
   cd apps/crm
   npm run dev
   ```

2. Abre: http://localhost:3000

3. Login con tu cuenta

4. Ve a **"Banners"** en el sidebar

5. Click en **"+ Crear Banner"**

6. Llena el formulario:
   - **Título:** "Ofertas de Black Friday"
   - **Descripción:** (opcional)
   - **Imagen:** Sube una imagen (recomendado 1200x400px)
   - **Tipo de Enlace:** Selecciona uno
     - `none`: Sin enlace (solo visual)
     - `product`: ID de un producto
     - `category`: Nombre de categoría
     - `store`: ID de tienda oficial
     - `external`: URL completa (ej: https://example.com)
   - **Valor del Enlace:** Depende del tipo
   - **Orden:** 0 (menor número = aparece primero)
   - **Fechas:** (opcional) Programa inicio/fin
   - **Banner activo:** ✅ Marcado

7. Click **"Crear Banner"**

8. Deberías ver el banner en la lista con preview de imagen

---

### 2. Ver el Banner en la App Mobile

1. Abre la app React Native:
   ```bash
   cd "C:\Users\marti\Desktop\Sergio-Marketplace-main"
   npx expo start
   ```

2. Ve a **Home**

3. Deberías ver tu banner en el carrusel (donde antes estaba "Hasta 40% OFF")

4. Si tienes múltiples banners:
   - Swipe para navegar entre ellos
   - Los dots muestran cuántos hay y cuál estás viendo

5. **Probar enlaces:**
   - Click en el banner
   - Debería navegar según el `link_type` configurado

---

### 3. Gestionar Múltiples Banners

**Crear varios banners:**
1. Repite el proceso de creación 3-4 veces
2. Usa diferentes `display_order` (0, 1, 2, 3)
3. El orden 0 aparece primero, luego 1, luego 2, etc.

**Editar un banner:**
1. Click en **"Editar"**
2. Modifica lo que necesites
3. Click **"Actualizar Banner"**

**Desactivar temporalmente:**
1. Click en **"Desactivar"**
2. El banner desaparece de la app inmediatamente
3. Click en **"Activar"** para volver a mostrarlo

**Eliminar un banner:**
1. Click en **"Eliminar"**
2. Confirma
3. Se borra permanentemente (incluyendo la imagen)

---

## 📸 Recomendaciones de Imágenes

**Tamaño ideal:**
- **Ancho:** 1200px
- **Alto:** 400px
- **Ratio:** 3:1
- **Peso:** Menos de 500KB

**Formato:**
- PNG para logotipos y texto nítido
- JPG para fotos
- WebP para mejor compresión (si lo soporta tu herramienta)

**Diseño:**
- Texto grande y legible
- Colores contrastantes
- Call-to-action claro (ej: "Comprar ahora", "Ver ofertas")
- Evita poner texto importante en los bordes

---

## 🔗 Tipos de Enlaces

### `none` - Sin enlace
- El banner es solo visual
- Click no hace nada
- Útil para banners informativos

### `product` - Enlace a Producto
- **Valor:** UUID del producto
- **Ejemplo:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **Acción:** Navega a ProductDetail

**Cómo obtener el ID:**
1. Ve a la app mobile → Search
2. Busca el producto
3. Míralo en la URL o usa Supabase Table Editor

### `category` - Enlace a Categoría
- **Valor:** Nombre de la categoría
- **Ejemplo:** `Celulares`, `Electrodomésticos`
- **Acción:** Abre Search con filtro de categoría

### `store` - Enlace a Tienda Oficial
- **Valor:** UUID de la tienda oficial
- **Ejemplo:** ID de "Samsung Store"
- **Acción:** Navega a StoreDetail

**Cómo obtener el ID:**
1. CRM → Tiendas Oficiales
2. Copia el ID de la tienda

### `external` - URL Externa
- **Valor:** URL completa
- **Ejemplo:** `https://www.example.com/promo`
- **Acción:** Abre el navegador (si implementas Linking.openURL)

**Nota:** Por ahora solo logea la URL. Para abrirla:
```typescript
import { Linking } from 'react-native';
Linking.openURL(banner.link_value);
```

---

## 📅 Programación de Campañas

**Programar inicio futuro:**
- **Starts at:** 2025-12-01 00:00
- El banner solo aparecerá después de esa fecha

**Programar fin:**
- **Ends at:** 2025-12-25 23:59
- El banner desaparece automáticamente después

**Campaña con duración:**
- **Starts at:** 2025-12-01
- **Ends at:** 2025-12-07
- Solo visible durante esa semana

**Sin fechas:**
- Dejar ambos campos vacíos
- El banner se muestra siempre (mientras esté activo)

---

## 🎯 Casos de Uso Comunes

### 1. Banner de Oferta Flash
```
Título: "24h de ofertas"
Imagen: Reloj + descuentos
Link Type: category
Link Value: "Ofertas"
Starts at: Hoy 00:00
Ends at: Hoy 23:59
Display Order: 0
```

### 2. Promoción de Tienda Oficial
```
Título: "Samsung Week"
Imagen: Logo Samsung + productos
Link Type: store
Link Value: [ID de Samsung Store]
Display Order: 1
```

### 3. Producto Destacado
```
Título: "iPhone 15 Pro disponible"
Imagen: iPhone 15 Pro
Link Type: product
Link Value: [ID del producto]
Display Order: 2
```

### 4. Banner Informativo
```
Título: "Envío gratis en todo el país"
Imagen: Camión de envío
Link Type: none
Display Order: 3
```

---

## 🔧 Troubleshooting

### Error: "Bucket does not exist"

**Solución:**
1. Ve a Supabase → Storage
2. Crea el bucket "banners" (público)
3. Intenta subir imagen nuevamente

---

### Las imágenes no se ven en la app

**Solución:**
1. Verifica que el bucket sea **público**
2. Ve a Storage → banners → Settings
3. Marca "Public bucket"
4. Recarga la app

---

### El banner no aparece en la app

**Checklist:**
- [ ] ¿El banner está activo? (is_active = true)
- [ ] ¿La fecha de inicio ya pasó o está vacía?
- [ ] ¿La fecha de fin no ha pasado o está vacía?
- [ ] ¿Hiciste pull-to-refresh en la app?

---

### No puedo subir imágenes

**Posibles causas:**
1. Bucket no existe → Créalo (PASO 2)
2. Bucket no es público → Marca como público
3. Imagen muy pesada → Reduce a menos de 5MB
4. Formato no soportado → Usa JPG o PNG

---

## 📊 Métricas y Analytics (Futuro)

En una próxima versión podrías agregar:

- **Impresiones:** Cuántas veces se vio el banner
- **Clicks:** Cuántas veces se hizo click
- **CTR:** Click-through rate (clicks / impresiones)
- **Conversiones:** Si el click resultó en venta

**Cómo implementar:**
1. Agregar campos `impressions` y `clicks` a la tabla
2. Incrementar en cada vista/click
3. Mostrar en el CRM

---

## 🚀 Próximas Mejoras

- [ ] Drag & drop para reordenar banners
- [ ] Preview en tiempo real antes de publicar
- [ ] A/B testing de banners
- [ ] Analytics de rendimiento
- [ ] Templates prediseñados
- [ ] Editor de imágenes integrado
- [ ] Soporte para videos
- [ ] Banners específicos por ubicación/usuario

---

## ✅ Resumen Rápido

```bash
# 1. Ejecutar SQL (manual desde Supabase Dashboard)
# 2. Crear bucket "banners" (manual, público)
# 3. Verificar setup
node setup-banners.js

# 4. Iniciar CRM
cd apps/crm
npm run dev

# 5. Crear banner en http://localhost:3000/banners

# 6. Ver en la app mobile
npx expo start
# → Home → Carrusel de banners
```

---

**🎉 ¡Sistema de banners completado! Ahora puedes gestionar el carrusel desde el CRM.**

**Versión**: 1.0.0
