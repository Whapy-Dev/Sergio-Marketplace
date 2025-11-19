# Banners Dinámicos - Implementación Completa ✅

## 🎯 Configuración Actual

**TODOS los banners son configurables desde el CRM** - No hay banners estáticos en posiciones intermedias.

### Ubicaciones de Banners

Los banners se distribuyen automáticamente en **6 posiciones estratégicas** a lo largo del home:

1. **Banner 1** - Después de "Tiendas Oficiales"
2. **Banner 2** - Después de "Nuestros elegidos del momento"
3. **Banner 3** - Después de "Nuestros Productos"
4. **Banner 4** - Antes de "Marketplace"
5. **Banner 5** - Antes de "También puede interesarte"
6. **Banner 6** - Antes del Footer

### Carrusel Superior (Header)

**NO hay banners** en el carrusel superior para:
- ✅ No interferir con la barra de búsqueda
- ✅ Mantener armonía con el gradiente del header
- ✅ Vista más profesional y limpia

### Filtrado y Límites

- **Filtrado**: Por fechas (`starts_at` <= NOW <= `ends_at`)
- **Límite máximo**: 6 banners activos
- **Ordenamiento**: Por `display_order` (ASC)

---

## 🎨 Diseños Adaptativos

El componente `BannerCard` adapta automáticamente su diseño según el campo `link_type` del banner:

### 1. Banner tipo `product`
**Uso**: Enlaces a productos específicos

**Diseño**:
- Imagen destacada a pantalla completa (200px alto)
- Overlay con gradiente oscuro inferior
- Título + descripción sobre la imagen
- CTA "Ver producto" con flecha
- Navegación: `ProductDetail` con `productId`

**Ejemplo BD**:
```sql
link_type: 'product'
link_value: 'd8f7a123-...'  -- ID del producto
```

---

### 2. Banner tipo `category`
**Uso**: Enlaces a categorías de productos

**Diseño**:
- Card horizontal con gradiente (100px alto)
- Icono de categoría en círculo (izquierda)
- Título + descripción (centro)
- Flecha de navegación (derecha)
- Gradientes personalizados por categoría:
  - Electrónica: Azul/Morado
  - Hogar: Verde
  - Moda: Rosa
  - Deportes: Naranja
  - Default: Azul/Rojo

**Ejemplo BD**:
```sql
link_type: 'category'
link_value: 'Electrónica'  -- Nombre de la categoría
```

---

### 3. Banner tipo `store`
**Uso**: Enlaces a tiendas oficiales

**Diseño**:
- Card horizontal con gradiente azul (120px alto)
- Icono de tienda en círculo grande (izquierda)
- Badge de verificación (checkmark verde)
- Título + descripción (centro)
- Texto "Visitar tienda oficial →" (inferior)
- Navegación: `StoreDetail` con `storeId`

**Ejemplo BD**:
```sql
link_type: 'store'
link_value: 'a1b2c3d4-...'  -- ID de la tienda
```

---

### 4. Banner tipo `generic/external/none`
**Uso**: Banners publicitarios sin navegación específica

**Diseño**:
- Card con gradiente colorido (150px alto)
- Gradientes variados (5 opciones)
- Título + descripción (izquierda)
- Icono decorativo grande (derecha)
- Sin navegación o link externo

**Ejemplo BD**:
```sql
link_type: 'none'
link_value: NULL

-- O para links externos:
link_type: 'external'
link_value: 'https://ejemplo.com'
```

---

## 📊 Ejemplos de Banners en Supabase

### Banner de Producto
```sql
INSERT INTO banners (title, description, image_url, link_type, link_value, display_order, is_active)
VALUES (
  'iPhone 15 Pro Max',
  '¡Nuevo lanzamiento! Aprovecha 12 cuotas sin interés',
  'https://images.unsplash.com/photo-1632661674596-df8be070a5c...',
  'product',
  'abc123...', -- ID del producto en tabla products
  1,
  true
);
```

### Banner de Categoría
```sql
INSERT INTO banners (title, description, image_url, link_type, link_value, display_order, is_active)
VALUES (
  'Todo en Electrónica',
  'Descubre las mejores ofertas',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661...',
  'category',
  'Electrónica', -- Nombre exacto de la categoría
  2,
  true
);
```

### Banner de Tienda
```sql
INSERT INTO banners (title, description, image_url, link_type, link_value, display_order, is_active)
VALUES (
  'Samsung Store Oficial',
  'Productos originales con garantía oficial',
  'https://images.unsplash.com/photo-1592833159114-...',
  'store',
  'xyz789...', -- ID de la tienda en official_stores
  3,
  true
);
```

### Banner Publicitario con Fechas
```sql
INSERT INTO banners (
  title,
  description,
  image_url,
  link_type,
  link_value,
  display_order,
  is_active,
  starts_at,
  ends_at
)
VALUES (
  'Cyber Monday 2025',
  'Ofertas increíbles por tiempo limitado',
  'https://images.unsplash.com/photo-1607082348824-...',
  'none',
  NULL,
  4,
  true,
  '2025-11-25 00:00:00',  -- Empieza 25 de noviembre
  '2025-12-01 23:59:59'   -- Termina 1 de diciembre
);
```

---

## 🔧 Componentes Creados/Modificados

### 1. `src/components/BannerCard.tsx` ⭐ NUEVO
Componente principal con 4 variantes:
- `ProductBanner`: Para productos
- `CategoryBanner`: Para categorías
- `StoreBanner`: Para tiendas
- `GenericBanner`: Para banners publicitarios

### 2. `src/services/banners.ts` ✏️ MODIFICADO
- Agregado parámetro `limit` (default: 6)
- Filtrado mejorado por fechas
- Doble filtrado (BD + cliente) para asegurar precisión

### 3. `src/screens/home/HomeScreen.tsx` ✏️ MODIFICADO
- Importación de `BannerCard` en lugar de `BannerCarousel`
- Separación de banners (3 carrusel + 2 intermedios)
- Inserción en posiciones específicas
- Eliminación de banners estáticos hardcodeados

---

## 🎯 Cómo Agregar/Editar Banners

### Desde el CRM (Web)
1. Ve a `https://tu-crm.com/banners`
2. Haz clic en "Nuevo Banner"
3. Completa:
   - **Título**: Texto principal
   - **Descripción**: Subtítulo
   - **Imagen URL**: Link de la imagen
   - **Tipo de Link**: Selecciona (product/category/store/none)
   - **Valor del Link**: ID o nombre según el tipo
   - **Orden**: Número de posición (1-6)
   - **Fechas**: Opcional, para banners temporales

### Desde SQL Editor (Supabase)
```sql
INSERT INTO banners (
  title,
  description,
  image_url,
  link_type,
  link_value,
  display_order,
  is_active,
  starts_at,
  ends_at
)
VALUES (
  'Título del banner',
  'Descripción breve',
  'https://ejemplo.com/imagen.jpg',
  'category',  -- o 'product', 'store', 'none', 'external'
  'Electrónica',  -- nombre de categoría o ID
  1,  -- orden de aparición
  true,  -- activo
  NULL,  -- fecha inicio (opcional)
  NULL   -- fecha fin (opcional)
);
```

---

## 📱 Vista en la App Mobile

### Hero del Header
- **Card estática** con mensaje "Hasta 40% OFF"
- **Sin banners** para mantener diseño limpio
- Integrado con gradiente del header

### Banners Intermedios (100% Configurables desde CRM)
- **6 posiciones** distribuidas estratégicamente
- Aparecen **solo si existen** en la BD
- **Diseños adaptativos** según `link_type`
- Padding horizontal de 16px
- **Ordenamiento**: Por `display_order` de la BD

---

## ⚙️ Configuración Avanzada

### Cambiar Número Máximo de Banners
Edita `src/screens/home/HomeScreen.tsx`:
```typescript
// Línea ~38
const activeBanners = await getActiveBanners(6); // Cambiar 6 por otro número
```

### Distribución de Banners
Los banners se asignan automáticamente:
```typescript
// Línea ~43-50
const banner1 = banners[0]; // Posición 1
const banner2 = banners[1]; // Posición 2
const banner3 = banners[2]; // Posición 3
const banner4 = banners[3]; // Posición 4
const banner5 = banners[4]; // Posición 5
const banner6 = banners[5]; // Posición 6
```

**Ejemplo**: Si solo hay 3 banners activos en la BD:
- Solo aparecerán `banner1`, `banner2` y `banner3`
- Los demás NO se mostrarán

### Agregar Más Posiciones
1. Definir nuevo banner:
```typescript
const banner7 = banners[6]; // Banner #7
```

2. Insertar en la posición deseada del ScrollView:
```jsx
{banner7 && (
  <View className="px-4 mb-1">
    <BannerCard banner={banner7} onPress={handleBannerPress} />
  </View>
)}
```

---

## 🧪 Testing

### Verificar Banners en BD
```sql
SELECT
  id,
  title,
  link_type,
  link_value,
  display_order,
  is_active,
  starts_at,
  ends_at
FROM banners
WHERE is_active = true
ORDER BY display_order;
```

### Probar Navegación
1. **Banner de producto**: Debe abrir `ProductDetail`
2. **Banner de categoría**: Debe abrir `Search` con filtro
3. **Banner de tienda**: Debe abrir `StoreDetail`
4. **Banner genérico**: No navega (o abre link externo)

---

## 🚀 Estado Final

- ✅ **6 posiciones** de banners configurables desde CRM
- ✅ **Hero del header estático** (sin banners)
- ✅ Diseños adaptativos (4 variantes)
- ✅ Filtrado por fechas funcionando
- ✅ Límite de 6 banners activos
- ✅ Aparición condicional (solo si existen)
- ✅ Todo pusheado a GitHub

**¡Banners dinámicos 100% configurables desde CRM!** 🎉

---

## 📝 Notas Importantes

1. **NO hay banners en el header** - El carrusel superior fue removido para mantener diseño profesional

2. **Todos los banners son opcionales** - Si no hay banners en la BD, el home funciona perfectamente sin ellos

3. **Máximo 6 banners simultáneos** - Puedes tener más en la BD, pero solo se mostrarán los primeros 6 por `display_order`

4. **Gestión desde CRM** - Página `/banners` del CRM para crear, editar y eliminar banners

5. **Fechas opcionales** - Si no configuras `starts_at` y `ends_at`, el banner estará siempre activo
