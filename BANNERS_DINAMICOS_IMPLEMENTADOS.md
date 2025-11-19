# Banners Dinámicos - Implementación Completa

## ✅ Implementación Finalizada

Los banners dinámicos están **100% funcionales** con diseños adaptativos según el tipo de banner.

---

## 📍 Configuración Actual

### Ubicaciones de Banners

1. **Carrusel Superior** (debajo de barra de búsqueda)
   - **Cantidad**: Primeros 3 banners
   - **Tipo**: Horizontal scrolleable
   - **Diseño**: Adaptativo según `link_type`

2. **Banner Intermedio 1** (después de "Tiendas Oficiales")
   - **Posición**: Banner #4 de la BD
   - **Diseño**: Adaptativo según `link_type`

3. **Banner Intermedio 2** (después de "Nuestros elegidos del momento")
   - **Posición**: Banner #5 de la BD
   - **Diseño**: Adaptativo según `link_type`

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

### Carrusel Superior
- ScrollView horizontal con 3 banners
- Snap automático a cada banner
- Diseño adaptado al tipo

### Banners Intermedios
- Después de Tiendas Oficiales: Banner #4
- Después de Nuestros elegidos: Banner #5
- Padding horizontal de 16px

---

## ⚙️ Configuración Avanzada

### Cambiar Número de Banners
Edita `src/screens/home/HomeScreen.tsx`:
```typescript
// Línea ~38
const activeBanners = await getActiveBanners(6); // Cambiar 6 por otro número
```

### Cambiar Posiciones de Banners Intermedios
Edita `src/screens/home/HomeScreen.tsx`:
```typescript
// Línea ~44-47
const carouselBanners = banners.slice(0, 3); // Primeros 3
const intermediateBanners = banners.slice(3, 6); // Del 4 al 6
const banner1 = intermediateBanners[0]; // Banner #4
const banner2 = intermediateBanners[1]; // Banner #5
```

### Agregar Más Posiciones Intermedias
1. Definir nuevo banner:
```typescript
const banner3 = intermediateBanners[2]; // Banner #6
```

2. Insertar en la posición deseada:
```jsx
{banner3 && (
  <View className="px-4">
    <BannerCard banner={banner3} onPress={handleBannerPress} />
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

- ✅ Carrusel superior dinámico
- ✅ 2 banners intermedios en posiciones específicas
- ✅ Diseños adaptativos (4 variantes)
- ✅ Filtrado por fechas funcionando
- ✅ Límite de 6 banners
- ✅ Todo pusheado a GitHub

**¡Banners dinámicos listos para producción!** 🎉
