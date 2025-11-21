# Sergio Marketplace

Marketplace móvil completo desarrollado con React Native (Expo) y un CRM administrativo en React. Backend con Supabase.

## Estructura del Proyecto

```
sergio-marketplace/
├── src/                    # App móvil (React Native + Expo)
│   ├── screens/           # Pantallas de la app
│   ├── components/        # Componentes reutilizables
│   ├── services/          # Servicios de API (Supabase)
│   ├── contexts/          # Contexts de React
│   ├── hooks/             # Custom hooks
│   └── navigation/        # Configuración de navegación
├── apps/crm/              # Panel administrativo (React + Vite)
│   └── src/
│       ├── pages/         # Páginas del CRM
│       └── components/    # Componentes del CRM
└── supabase/
    └── migrations/        # Migraciones SQL
```

## Tecnologías

### App Móvil
- React Native con Expo
- NativeWind (Tailwind CSS)
- React Navigation
- Supabase Client

### CRM Administrativo
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase Client

### Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

## Instalación

### Requisitos
- Node.js 18+
- npm o yarn
- Expo CLI
- Cuenta en Supabase

### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/sergio-marketplace.git
cd sergio-marketplace
```

2. **Instalar dependencias de la app móvil**
```bash
npm install
```

3. **Instalar dependencias del CRM**
```bash
cd apps/crm
npm install
cd ../..
```

4. **Configurar Supabase**

Crear archivo `.env` en la raíz:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Crear archivo `.env` en `apps/crm/`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

5. **Ejecutar migraciones SQL**

Ir al SQL Editor de Supabase y ejecutar los archivos en `supabase/migrations/` en orden.

### Ejecutar

**App móvil:**
```bash
npx expo start
```

**CRM:**
```bash
cd apps/crm
npm run dev
```

## Funcionalidades

### App Móvil

#### Para Compradores
- **Registro e inicio de sesión** con email
- **Explorar productos** con categorías y búsqueda
- **Filtros avanzados**: precio, envío gratis, ordenamiento
- **Carrito de compras** con gestión de cantidades
- **Favoritos** con listas personalizadas
- **Checkout** con múltiples métodos de pago
- **Historial de pedidos**
- **Chat** con vendedores
- **Notificaciones** de pedidos y ofertas
- **Perfil editable** con foto y dirección

#### Para Vendedores Individuales
- **Dashboard simple** con métricas:
  - Ventas del día y mes
  - Balance disponible
  - Pedidos pendientes
  - Productos activos
- **Gestión de productos**: crear, editar, eliminar
- **Gestión de pedidos**: ver y actualizar estados
- **Billetera**: ver balance y solicitar retiros
- **Datos bancarios**: CBU/CVU, alias MP

#### Para Tiendas Oficiales
- **Dashboard Pro** con métricas avanzadas:
  - Selector de período (hoy, 7d, 30d, 90d)
  - Gráficos de ventas
  - Comparativas con período anterior
  - Top productos vendidos
  - Top productos más vistos
  - Alertas de inventario bajo
  - Tasa de conversión
  - Clientes recurrentes
- Todo lo de vendedores individuales

### CRM Administrativo

#### Dashboard
- Resumen de ventas y pedidos
- Métricas principales

#### Productos
- CRUD completo de productos
- Gestión de imágenes
- Variantes de producto
- Estados: activo, inactivo, agotado

#### Pedidos
- Lista de todos los pedidos
- Filtros por estado
- Actualización de estados
- Detalle completo

#### Usuarios
- Lista de usuarios registrados
- Cambio de roles
- Información de perfil

#### Categorías
- Crear y editar categorías
- Iconos personalizados
- Tasas de comisión

#### Tiendas Oficiales
- Aprobar solicitudes
- Gestionar tiendas existentes
- Configurar comisiones especiales

#### Banners
- Crear banners promocionales
- Tipos: producto, categoría, tienda, externo
- Imágenes personalizadas
- Fechas de vigencia

#### Secciones del Home
- Configurar secciones dinámicas
- Seleccionar productos destacados
- Ordenar secciones

#### Cupones
- Crear cupones de descuento
- Tipos: porcentaje o monto fijo
- Límites de uso
- Fechas de vigencia

#### Configuración
- Datos del marketplace
- Métodos de pago
- Configuración de envíos
- Montos mínimos

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `customer` | Comprador básico |
| `seller_individual` | Vendedor individual |
| `seller_official` | Tienda oficial verificada |
| `admin` | Administrador del marketplace |

## Base de Datos

### Tablas Principales

- `profiles` - Usuarios y sus datos
- `products` - Catálogo de productos
- `product_images` - Imágenes de productos
- `product_variants` - Variantes (talle, color)
- `categories` - Categorías de productos
- `orders` - Pedidos
- `order_items` - Items de cada pedido
- `official_stores` - Tiendas oficiales
- `banners` - Banners promocionales
- `home_sections` - Secciones del home
- `home_section_products` - Productos por sección
- `coupons` - Cupones de descuento
- `favorites` - Productos favoritos
- `favorite_lists` - Listas de favoritos
- `conversations` - Conversaciones de chat
- `messages` - Mensajes de chat
- `reviews` - Reseñas de productos
- `seller_balances` - Balances de vendedores
- `balance_transactions` - Transacciones de balance
- `withdrawal_requests` - Solicitudes de retiro
- `notifications` - Notificaciones

## Flujos Principales

### Flujo de Compra
1. Usuario navega productos
2. Agrega al carrito
3. Procede al checkout
4. Selecciona método de pago
5. Confirma pedido
6. Recibe notificación
7. Vendedor procesa pedido
8. Usuario recibe producto

### Flujo de Venta
1. Vendedor crea producto
2. Producto aparece en catálogo
3. Comprador realiza pedido
4. Vendedor recibe notificación
5. Vendedor actualiza estado
6. Balance se acredita al vendedor
7. Vendedor solicita retiro

### Flujo de Tienda Oficial
1. Usuario solicita ser tienda oficial
2. Admin revisa solicitud
3. Admin aprueba/rechaza
4. Si aprobado, usuario obtiene rol `seller_official`
5. Accede a Dashboard Pro

## Configuración de Supabase

### Storage Buckets
- `avatars` - Fotos de perfil
- `products` - Imágenes de productos
- `banners` - Imágenes de banners
- `stores` - Logos de tiendas

### Políticas RLS
Todas las tablas tienen Row Level Security habilitado. Ver migraciones para políticas específicas.

## Desarrollo

### Convenciones
- Componentes en PascalCase
- Servicios en camelCase
- Archivos de screen terminan en `Screen.tsx`
- Servicios en `src/services/`

### Agregar nueva funcionalidad

1. Crear migración SQL en `supabase/migrations/`
2. Crear servicio en `src/services/`
3. Crear pantalla en `src/screens/`
4. Agregar a navegación en `src/navigation/AppNavigator.tsx`
5. Si es admin, crear página en `apps/crm/src/pages/`

## Despliegue

### App Móvil
```bash
# Build para Android
npx expo build:android

# Build para iOS
npx expo build:ios

# O usar EAS Build
eas build --platform all
```

### CRM
```bash
cd apps/crm
npm run build
# Desplegar carpeta dist/ en hosting (Vercel, Netlify, etc.)
```

## Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en el repositorio.

## Licencia

MIT License
