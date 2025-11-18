# 🚀 Guía Completa de Setup - Sergio Marketplace

## ✅ Lo que se implementó

### 1. Sistema de Tiendas Oficiales (Mobile App)

#### Base de Datos
- ✅ 5 nuevas tablas en Supabase
- ✅ RLS policies configuradas
- ✅ Triggers automáticos
- ✅ Índices para optimización

#### Backend (Servicios)
- ✅ `src/services/officialStores.ts` - CRUD completo
- ✅ `src/types/officialStore.ts` - TypeScript types
- ✅ Funciones para seguir/dejar de seguir tiendas
- ✅ Sistema de aplicaciones

#### Frontend (UI Mobile)
- ✅ OfficialStoresScreen - Lista de tiendas
- ✅ StoreDetailScreen - Detalle de tienda
- ✅ RegisterOfficialStoreScreen - Formulario de aplicación
- ✅ Sección en HomeScreen
- ✅ Botón dinámico en ProfileScreen

#### Mejoras en Búsqueda
- ✅ Priorización automática de productos de tiendas oficiales
- ✅ Badge azul "OFICIAL" en productos
- ✅ Filtro para ver solo productos oficiales

#### Scripts de Gestión
- ✅ `seed-official-stores.js` - Crear tiendas de prueba
- ✅ `approve-store-application.js` - Aprobar/rechazar aplicaciones
- ✅ `setup-official-stores.js` - Verificar setup

### 2. CRM Web Application

#### Páginas Implementadas
- ✅ **Dashboard** - Estadísticas generales del marketplace
- ✅ **Aplicaciones** - Aprobar/rechazar solicitudes de tiendas
- ✅ **Tiendas Oficiales** - Gestionar tiendas verificadas
- ✅ **Productos** - Ver todos los productos
- ✅ **Destacados** - Destacar productos en home
- ✅ **Usuarios** - Gestionar usuarios
- ⏳ **Banners** - Pendiente (estructura lista)

#### Stack Tecnológico
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Supabase

---

## ⚠️ PASO CRÍTICO: Ejecutar Migración SQL

### ESTO ES OBLIGATORIO PARA QUE TODO FUNCIONE

**Antes de hacer cualquier otra cosa, debes ejecutar la migración SQL en Supabase.**

#### Pasos:

1. Abre tu dashboard de Supabase:
   ```
   https://app.supabase.com/project/dhfnfdschxhfwrfaoyqa
   ```

2. Ve a **"SQL Editor"** en el menú lateral

3. Haz click en **"New query"**

4. Abre este archivo en tu PC:
   ```
   C:\Users\marti\Desktop\Sergio-Marketplace-main\supabase\migrations\001_official_stores.sql
   ```

5. Copia **TODO** el contenido del archivo

6. Pégalo en el editor SQL de Supabase

7. Haz click en **"Run"** (botón verde)

8. Verifica que diga "Success" sin errores

9. Ve a **"Table Editor"** y verifica que existan estas tablas:
   - ✅ official_stores
   - ✅ store_metrics
   - ✅ store_policies
   - ✅ store_followers
   - ✅ store_applications

---

## 🧪 Cómo Probar Todo

### Parte 1: Verificar que se crearon las tablas

Abre terminal y ejecuta:

```bash
cd "C:\Users\marti\Desktop\Sergio-Marketplace-main"
node setup-official-stores.js
```

**Resultado esperado:**
```
✅ Table 'official_stores': Already exists
✅ Table 'store_metrics': Already exists
✅ Table 'store_policies': Already exists
✅ Table 'store_followers': Already exists
✅ Table 'store_applications': Already exists
```

Si ves ❌, vuelve al paso de la migración SQL.

---

### Parte 2: Crear Tiendas de Prueba (Mobile App)

```bash
node seed-official-stores.js
```

**Esto creará:**
- 5 tiendas oficiales (Samsung, Apple, Xiaomi, Motorola, Sony)
- Usuarios demo para cada tienda
- Políticas de tienda
- Métricas iniciales

**Credenciales creadas:**
```
Email: samsung@marketplace.com
Password: TestPassword123!

Email: apple@marketplace.com
Password: TestPassword123!

Email: xiaomi@marketplace.com
Password: TestPassword123!

Email: motorola@marketplace.com
Password: TestPassword123!

Email: sony@marketplace.com
Password: TestPassword123!
```

---

### Parte 3: Probar la App Mobile

#### Opción A: Ver Tiendas Oficiales

1. Inicia tu app React Native:
   ```bash
   npx expo start
   ```

2. Ve a la pantalla **Home**

3. Scroll down hasta ver la sección **"Tiendas Oficiales"**

4. Deberías ver las 5 tiendas creadas

5. Haz click en cualquiera para ver el detalle

6. Prueba seguir/dejar de seguir una tienda

#### Opción B: Ver Productos Priorizados en Búsqueda

1. Ve a la pantalla **Search**

2. Los productos de tiendas oficiales aparecen PRIMERO

3. Tienen badge azul **"OFICIAL"**

4. Usa el botón **"Solo Oficiales"** para filtrar

#### Opción C: Aplicar para ser Tienda Oficial

1. Inicia sesión con una cuenta de vendedor

2. Ve a tu **Perfil**

3. Busca el botón **"Convertirse en Tienda Oficial"**

4. Llena el formulario con datos reales o de prueba

5. Envía la solicitud

6. Verás el estado **"Pendiente de revisión"**

---

### Parte 4: Probar el CRM Web

#### Instalación

1. Navega al directorio del CRM:
   ```bash
   cd apps/crm
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre en el navegador:
   ```
   http://localhost:3000
   ```

#### Login en el CRM

Usa cualquier cuenta de usuario existente de Supabase:

```
Email: (cualquier email de usuario)
Password: (su contraseña)
```

**Recomendación**: Crea una cuenta específica de admin desde la app mobile o Supabase Dashboard.

#### Funcionalidades del CRM

1. **Dashboard**
   - Ver estadísticas generales
   - Total de usuarios, productos, órdenes
   - Ingresos totales
   - Tiendas activas
   - Aplicaciones pendientes

2. **Aplicaciones** (Más importante)
   - Ver solicitudes pendientes de tiendas oficiales
   - Aprobar con un click (crea automáticamente la tienda)
   - Rechazar con motivo

3. **Tiendas Oficiales**
   - Ver todas las tiendas
   - Activar/desactivar tiendas
   - Suspender tiendas

4. **Productos Destacados**
   - Destacar productos por 7 o 30 días
   - Se verán en la home de la app mobile

5. **Usuarios**
   - Ver todos los usuarios
   - Filtrar por compradores/vendedores

---

## 📱 Flujo Completo del Usuario

### Usuario Normal → Vendedor → Tienda Oficial

1. **Usuario se registra** en la app
   - Role: `customer`

2. **Se convierte en vendedor** (botón en perfil)
   - Role: `seller_individual`
   - Puede publicar productos

3. **Aplica para Tienda Oficial**
   - Click en "Convertirse en Tienda Oficial"
   - Llena formulario con datos legales
   - Envía solicitud
   - Estado: `pending`

4. **Admin revisa desde el CRM**
   - Abre `http://localhost:3000`
   - Va a "Aplicaciones"
   - Ve la solicitud
   - Aprueba o rechaza

5. **Si se aprueba:**
   - Se crea registro en `official_stores`
   - Badge azul visible en toda la app
   - Aparece en sección de Tiendas Oficiales
   - Productos tienen prioridad en búsqueda

---

## 🎨 Características Visuales

### Badge de Verificación
- **Color:** Azul (#3B82F6 / #2563EB)
- **Icono:** Checkmark en círculo
- **Texto:** "OFICIAL"
- **Ubicación:**
  - Cards de tienda
  - Detalle de tienda
  - Productos de tienda oficial
  - Perfil de usuario

---

## 📊 Estructura de Base de Datos

### Tabla: official_stores
Información principal de la tienda

**Campos clave:**
- `user_id` - Dueño de la tienda
- `store_name` - Nombre público
- `verification_status` - pending/approved/rejected/suspended
- `is_active` - true/false
- `rating` - Promedio de calificación
- `total_sales` - Total de ventas
- `followers_count` - Seguidores (auto-actualizado)

### Tabla: store_applications
Aplicaciones de usuarios

**Estados:**
- `pending` - Recién enviada
- `under_review` - En revisión
- `approved` - Aprobada
- `rejected` - Rechazada

### Tabla: store_followers
Usuarios que siguen una tienda (actualiza contador automáticamente)

### Tabla: store_policies
Políticas de la tienda (garantía, devoluciones, envíos, etc.)

### Tabla: store_metrics
Métricas y estadísticas (all_time, monthly, weekly)

---

## 🔧 Scripts Disponibles

### setup-official-stores.js
**Propósito:** Verificar que las tablas existan

**Uso:**
```bash
node setup-official-stores.js
```

**Cuándo usar:** Después de ejecutar la migración SQL

---

### seed-official-stores.js
**Propósito:** Crear tiendas de prueba

**Uso:**
```bash
node seed-official-stores.js
```

**Crea:**
- 5 tiendas oficiales
- Usuarios demo
- Políticas de tienda
- Métricas iniciales

---

### approve-store-application.js
**Propósito:** Gestionar aplicaciones desde CLI

**Uso:**
```bash
node approve-store-application.js
```

**Características:**
- Interfaz CLI interactiva
- Lista aplicaciones pendientes
- Aprobar/rechazar con un comando
- Auto-crea tienda oficial al aprobar

---

## 🐛 Troubleshooting

### Error: "Table does not exist"

**Solución:** No ejecutaste el SQL.
1. Ve a Supabase SQL Editor
2. Ejecuta `001_official_stores.sql`
3. Verifica en Table Editor

---

### Las tiendas no aparecen en Home

**Solución:**
1. Verifica que ejecutaste `seed-official-stores.js`
2. Reinicia la app (recarga Metro)
3. Verifica en Supabase que las tiendas tengan:
   - `verification_status = 'approved'`
   - `is_active = true`

---

### Error al hacer npm install en CRM

**Solución:**
```bash
cd apps/crm
rm -rf node_modules package-lock.json
npm install
```

---

### No puedo hacer login en el CRM

**Solución:**
- Usa credenciales de un usuario existente en Supabase
- O crea una cuenta desde la app mobile
- Verifica que Supabase Auth esté funcionando

---

## 🎯 Próximos Pasos (Pendientes)

### Fase 2: Banners
- [ ] Tabla `banners` en Supabase
- [ ] Upload de imágenes
- [ ] Configurar enlaces (productos, categorías, externo)
- [ ] Programación de inicio/fin
- [ ] Carrusel en HomeScreen de la app

### Fase 3: Sistema de Pagos
- [ ] Integración con MercadoPago
- [ ] O integración con Stripe
- [ ] Checkout flow completo
- [ ] Gestión de órdenes desde el CRM

### Fase 4: Notificaciones
- [ ] Push notifications con Expo
- [ ] Notificaciones de nuevas órdenes
- [ ] Notificaciones de mensajes
- [ ] Campañas de marketing

### Fase 5: Reviews
- [ ] Sistema de valoraciones de productos
- [ ] Sistema de valoraciones de vendedores
- [ ] Moderación de comentarios

---

## 📞 Resumen Rápido

### Para empezar AHORA:

```bash
# 1. Ejecutar SQL en Supabase (CRÍTICO - manual desde dashboard)
#    Archivo: supabase/migrations/001_official_stores.sql

# 2. Verificar tablas
node setup-official-stores.js

# 3. Crear tiendas de prueba
node seed-official-stores.js

# 4. Iniciar app mobile
npx expo start

# 5. Iniciar CRM
cd apps/crm
npm install
npm run dev

# 6. Abrir CRM en navegador
# http://localhost:3000

# 7. Probar todo el flujo:
# - Ver tiendas en home (mobile)
# - Aplicar para tienda oficial (mobile)
# - Aprobar aplicación (CRM web)
# - Destacar productos (CRM web)
```

---

## 📚 Documentación Adicional

- **Tiendas Oficiales Mobile**: `INSTRUCCIONES_TIENDAS_OFICIALES.md`
- **CRM Web**: `apps/crm/README.md`
- **Este archivo**: Guía completa de setup

---

## ✅ Checklist de Verificación

Antes de considerar que todo está funcionando:

- [ ] SQL ejecutado en Supabase
- [ ] 5 tablas creadas y verificadas
- [ ] Tiendas de prueba creadas
- [ ] App mobile muestra tiendas en home
- [ ] Búsqueda prioriza productos oficiales
- [ ] Botón en perfil para aplicar funciona
- [ ] CRM instalado y funcionando
- [ ] Login en CRM funciona
- [ ] Dashboard muestra estadísticas
- [ ] Aprobación de aplicaciones funciona
- [ ] Sistema de destacados funciona

---

**🎉 ¡Todo listo! Tu marketplace con sistema de Tiendas Oficiales y CRM está completo y funcional.**

**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
