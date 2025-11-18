# CRM - Sergio Marketplace

Panel de administración web para gestionar el marketplace.

## Características

### Implementadas
- **Dashboard**: Vista general con estadísticas clave
- **Aplicaciones de Tiendas**: Aprobar/rechazar solicitudes de tiendas oficiales
- **Tiendas Oficiales**: Gestionar tiendas verificadas, activar/desactivar/suspender
- **Productos**: Ver todos los productos del marketplace
- **Productos Destacados**: Destacar productos en la home por 7 o 30 días
- **Usuarios**: Listar y filtrar usuarios (compradores/vendedores)
- **Autenticación**: Login con Supabase Auth

### Pendientes (Fase 2)
- **Banners**: Sistema de upload y gestión de banners para el carrusel
- **Órdenes**: Gestión de pedidos y transacciones
- **Reportes**: Gráficos y análisis avanzados
- **Notificaciones**: Push notifications para usuarios

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Routing**: React Router v6
- **Charts**: Recharts (para gráficos futuros)

## Instalación

1. Navegar al directorio del CRM:
```bash
cd apps/crm
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (si es necesario):
El archivo `src/lib/supabase.ts` ya tiene las credenciales configuradas.

4. Iniciar servidor de desarrollo:
```bash
npm run dev
```

5. Abrir en el navegador:
```
http://localhost:3000
```

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Genera build de producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta ESLint

## Estructura de Archivos

```
apps/crm/
├── src/
│   ├── components/
│   │   └── Layout.tsx        # Layout principal con sidebar
│   ├── lib/
│   │   └── supabase.ts       # Cliente de Supabase
│   ├── pages/
│   │   ├── Login.tsx         # Página de login
│   │   ├── Dashboard.tsx     # Dashboard principal
│   │   ├── StoreApplications.tsx  # Aplicaciones de tiendas
│   │   ├── OfficialStores.tsx     # Gestión de tiendas
│   │   ├── Products.tsx      # Listado de productos
│   │   ├── FeaturedProducts.tsx   # Productos destacados
│   │   ├── Banners.tsx       # Gestión de banners (pendiente)
│   │   └── Users.tsx         # Gestión de usuarios
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx               # Componente principal
│   ├── main.tsx              # Entry point
│   └── index.css             # Estilos globales
├── public/                   # Assets estáticos
├── index.html                # HTML template
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Funcionalidades Detalladas

### Dashboard
- Total de usuarios, productos, órdenes
- Ingresos totales acumulados
- Tiendas oficiales activas
- Aplicaciones pendientes (con highlight si hay alguna)
- Acciones rápidas a las secciones principales

### Aplicaciones de Tiendas
- Lista de solicitudes pendientes o en revisión
- Datos completos del aplicante
- Botones de aprobar/rechazar
- Al aprobar: crea automáticamente la tienda oficial + políticas + métricas
- Al rechazar: permite agregar motivo

### Tiendas Oficiales
- Lista todas las tiendas (aprobadas, suspendidas, etc.)
- Métricas: rating, ventas, productos, seguidores
- Activar/desactivar tiendas
- Suspender tiendas (cambia status y desactiva)

### Productos
- Listado de todos los productos
- Filtros por estado: todos, activos, pausados, vendidos
- Info del vendedor
- Precio, stock, condición

### Productos Destacados
- Ver productos actualmente destacados
- Destacar productos por 7 o 30 días
- Remover productos de destacados
- Se actualizan automáticamente en la app móvil

### Usuarios
- Tabla con todos los usuarios
- Filtros: todos, compradores, vendedores
- Información básica y fecha de registro

## Acceso y Permisos

### Login
Cualquier usuario con cuenta en Supabase puede hacer login.

**Recomendación**: Crear un usuario específico para admin:
```bash
# Desde la app móvil o Supabase Dashboard
Email: admin@marketplace.com
Password: TuPasswordSeguro123!
```

### Seguridad
- RLS (Row Level Security) habilitado en Supabase
- Todas las operaciones críticas verifican permisos
- Session management con Supabase Auth

## Deployment

### Build de Producción
```bash
npm run build
```

Esto genera la carpeta `dist/` con los archivos estáticos.

### Opciones de Deploy
- **Vercel** (recomendado para Vite)
- **Netlify**
- **Firebase Hosting**
- **Cualquier servidor estático**

### Variables de Entorno en Producción
Si usas variables de entorno, crea `.env.production`:
```
VITE_SUPABASE_URL=https://dhfnfdschxhfwrfaoyqa.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Y actualiza `src/lib/supabase.ts` para usar:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Próximas Mejoras

1. **Sistema de Banners**
   - Upload de imágenes
   - Configurar enlaces (productos, categorías, URLs externas)
   - Programar inicio/fin de campaña
   - Vista previa en tiempo real

2. **Gestión de Órdenes**
   - Ver todas las transacciones
   - Cambiar estados de órdenes
   - Gestionar reembolsos

3. **Analytics Avanzados**
   - Gráficos con Recharts
   - Ventas por categoría
   - Top productos
   - Top vendedores

4. **Notificaciones Push**
   - Configurar campañas de notificaciones
   - Notificaciones automáticas (nuevas órdenes, etc.)

5. **Gestión de Categorías**
   - CRUD de categorías y subcategorías
   - Reordenar prioridades

## Troubleshooting

### Error: "Cannot connect to Supabase"
- Verifica que las credenciales en `src/lib/supabase.ts` sean correctas
- Verifica que las RLS policies estén configuradas

### Error: "Cannot read properties of undefined"
- Verifica que las tablas existan en Supabase
- Ejecuta el SQL de migración: `supabase/migrations/001_official_stores.sql`

### La página se queda en "Cargando..."
- Abre la consola del navegador (F12)
- Revisa errores de autenticación
- Verifica que el usuario tenga permisos

## Soporte

Para problemas o mejoras, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
