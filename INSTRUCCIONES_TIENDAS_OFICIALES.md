# 🏪 Guía Completa: Sistema de Tiendas Oficiales

## ✅ Lo que se implementó

### 1. Base de Datos
- ✅ 5 nuevas tablas en Supabase
- ✅ RLS policies configuradas
- ✅ Triggers automáticos
- ✅ Índices para optimización

### 2. Backend (Servicios)
- ✅ `src/services/officialStores.ts` - CRUD completo
- ✅ `src/types/officialStore.ts` - TypeScript types
- ✅ Funciones para seguir/dejar de seguir tiendas
- ✅ Sistema de aplicaciones

### 3. Frontend (UI Mobile)
- ✅ OfficialStoresScreen - Lista de tiendas
- ✅ StoreDetailScreen - Detalle de tienda
- ✅ RegisterOfficialStoreScreen - Formulario de aplicación
- ✅ Sección en HomeScreen
- ✅ Botón dinámico en ProfileScreen

### 4. Scripts de Gestión
- ✅ `seed-official-stores.js` - Crear tiendas de prueba
- ✅ `approve-store-application.js` - Aprobar/rechazar aplicaciones
- ✅ `setup-official-stores.js` - Verificar setup

---

## 🚀 PASOS PARA ACTIVAR TODO

### PASO 1: Ejecutar Migración SQL en Supabase ⚠️ CRÍTICO

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
   - official_stores
   - store_metrics
   - store_policies
   - store_followers
   - store_applications

---

### PASO 2: Verificar que se crearon las tablas

Abre terminal en tu proyecto y ejecuta:

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

Si ves ❌, significa que NO ejecutaste el SQL correctamente. Vuelve al PASO 1.

---

### PASO 3: Crear Tiendas de Prueba

Una vez que las tablas existan, ejecuta:

```bash
node seed-official-stores.js
```

**Esto creará:**
- ✅ 5 tiendas oficiales (Samsung, Apple, Xiaomi, Motorola, Sony)
- ✅ Usuarios demo para cada tienda
- ✅ Políticas de tienda
- ✅ Métricas iniciales
- ✅ Todo verificado y aprobado

**Credenciales de prueba creadas:**
```
Email: samsung@marketplace.com
Password: TestPassword123!
---
Email: apple@marketplace.com
Password: TestPassword123!
---
Email: xiaomi@marketplace.com
Password: TestPassword123!
---
Email: motorola@marketplace.com
Password: TestPassword123!
---
Email: sony@marketplace.com
Password: TestPassword123!
```

---

### PASO 4: Probar en la App

#### Opción A: Ver Tiendas Oficiales

1. Abre tu app React Native (Expo)
2. Ve a la pantalla **Home**
3. Scroll down hasta ver la sección **"Tiendas Oficiales"**
4. Deberías ver las 5 tiendas creadas
5. Haz click en cualquiera para ver el detalle

#### Opción B: Aplicar para ser Tienda Oficial

1. Inicia sesión con una cuenta de vendedor
2. Ve a tu **Perfil**
3. Busca el botón **"Convertirse en Tienda Oficial"**
4. Llena el formulario
5. Envía la solicitud
6. Verás el estado "Pendiente de revisión"

---

### PASO 5: Aprobar Aplicaciones (Como Admin)

Cuando un usuario envía una aplicación desde la app, puedes aprobarla:

```bash
node approve-store-application.js
```

**Interfaz interactiva:**
```
📋 Fetching pending applications...

Found 1 pending application(s):

1. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📧 Email: usuario@example.com
   👤 User: Juan Pérez
   🏪 Store Name: Mi Tienda Cool
   📝 Description: Vendo productos increíbles...
   📍 Location: Buenos Aires, Argentina
   📞 Phone: +54 11 1234-5678
   🏢 Business Type: individual
   🆔 Tax ID: 20-12345678-9
   📅 Applied: 18/11/2025
   ⏱️  Status: pending

Enter application number to review (or "q" to quit): 1

Action? (a=approve / r=reject / b=back): a

✅ Approving application...
✅ Official store created
✅ Store policies created
✅ Store metrics created
✅ Application marked as approved

🎉 SUCCESS! Store has been approved!
```

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

4. **Admin revisa la aplicación**
   - Ejecuta `node approve-store-application.js`
   - Aprueba o rechaza

5. **Si se aprueba:**
   - Se crea registro en `official_stores`
   - Estado: `approved`
   - Badge azul visible en toda la app
   - Aparece en sección de Tiendas Oficiales
   - Puede configurar políticas de tienda

---

## 🎨 Características Visuales

### Badge de Verificación
- **Color:** Azul (#3B82F6)
- **Icono:** Checkmark en círculo
- **Texto:** "OFICIAL"
- **Ubicación:**
  - Cards de tienda
  - Detalle de tienda
  - Productos de tienda oficial
  - Perfil de usuario

### Estados en ProfileScreen

**Si tiene tienda aprobada:**
```
┌─────────────────────────────────────┐
│ 🏪  Mi Tienda Oficial     [OFICIAL] │
│     Samsung Store                   │
│                                  →  │
└─────────────────────────────────────┘
Fondo: Azul claro
```

**Si tiene aplicación pendiente:**
```
┌─────────────────────────────────────┐
│ ⏰  Solicitud Enviada               │
│     Pendiente de revisión           │
│                                  →  │
└─────────────────────────────────────┘
Fondo: Amarillo claro
```

**Si puede aplicar:**
```
┌─────────────────────────────────────┐
│ ⭐  Convertirse en Tienda Oficial  │
│     Badge verificado + más beneficios│
│                                  →  │
└─────────────────────────────────────┘
Borde: Punteado azul
```

---

## 🔧 Scripts Disponibles

### 1. setup-official-stores.js
**Propósito:** Verificar que las tablas existan

**Uso:**
```bash
node setup-official-stores.js
```

**Cuándo usar:** Después de ejecutar la migración SQL

---

### 2. seed-official-stores.js
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

**Cuándo usar:**
- Primera vez para testing
- Cuando quieras resetear datos de prueba

---

### 3. approve-store-application.js
**Propósito:** Gestionar aplicaciones de usuarios

**Uso:**
```bash
node approve-store-application.js
```

**Características:**
- Interfaz CLI interactiva
- Lista aplicaciones pendientes
- Aprobar con un click
- Rechazar con motivo
- Auto-creación de tienda oficial al aprobar

**Cuándo usar:**
- Cuando un usuario envía aplicación desde la app
- Para gestionar todas las aplicaciones pendientes

---

## 📊 Estructura de Base de Datos

### Tabla: official_stores
Información principal de la tienda

**Campos clave:**
- `user_id` - Dueño de la tienda
- `store_name` - Nombre público
- `slug` - URL amigable
- `verification_status` - pending/approved/rejected/suspended
- `is_active` - true/false
- `rating` - Promedio de calificación
- `total_sales` - Total de ventas
- `followers_count` - Seguidores (auto-actualizado)

---

### Tabla: store_applications
Aplicaciones de usuarios

**Estados:**
- `pending` - Recién enviada
- `under_review` - En revisión
- `approved` - Aprobada (se crea tienda)
- `rejected` - Rechazada

---

### Tabla: store_followers
Usuarios que siguen una tienda

**Trigger automático:**
- Actualiza `followers_count` en `official_stores`

---

### Tabla: store_policies
Políticas de la tienda

**Incluye:**
- Garantía
- Devoluciones
- Envíos
- Métodos de pago
- Contacto de soporte

---

### Tabla: store_metrics
Métricas y estadísticas

**Tipos:**
- `all_time` - Desde siempre
- `monthly` - Del mes
- `weekly` - De la semana

---

## 🐛 Troubleshooting

### Error: "Table does not exist"

**Solución:** No ejecutaste el SQL.
1. Ve a Supabase SQL Editor
2. Ejecuta `001_official_stores.sql`
3. Verifica en Table Editor

---

### Error: "No pending applications found"

**Solución:** Nadie ha aplicado aún.
1. Inicia sesión en la app como vendedor
2. Ve a Perfil
3. Click en "Convertirse en Tienda Oficial"
4. Envía el formulario
5. Vuelve a ejecutar `approve-store-application.js`

---

### Las tiendas no aparecen en Home

**Solución:**
1. Verifica que ejecutaste `seed-official-stores.js`
2. Reinicia la app (recarga Metro)
3. Verifica en Supabase Table Editor que las tiendas tengan:
   - `verification_status = 'approved'`
   - `is_active = true`

---

### No puedo hacer login con las cuentas demo

**Solución:** Las cuentas demo son solo para ver las tiendas.

**Para testear como dueño de tienda:**
1. Crea una cuenta nueva en la app
2. Conviértete en vendedor
3. Aplica para tienda oficial
4. Apruébala con el script
5. Inicia sesión nuevamente

---

## 🎯 Próximos Pasos

Una vez que todo esté funcionando:

1. ✅ **Agregar productos a tiendas oficiales**
   - Usar `CreateProductScreen`
   - Vincular con `official_store_id`

2. ✅ **Implementar CRM Web** (Fase 2)
   - Dashboard administrativo
   - Gestión de aplicaciones
   - Gestión de productos destacados
   - Gestión de banners

3. ✅ **Sistema de productos destacados**
   - Tabla `featured_products`
   - Prioridad configurable
   - Sección en home

4. ✅ **Banners configurables**
   - Tabla `banners`
   - Upload de imágenes
   - Programación de campañas

5. ✅ **Modificar búsqueda**
   - Priorizar tiendas oficiales
   - Filtro por tienda oficial

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que ejecutaste todos los pasos en orden
2. Revisa los logs de la consola
3. Verifica en Supabase Table Editor
4. Revisa que las RLS policies estén habilitadas

---

## ✨ Resumen Rápido

### Para empezar a probar AHORA:

```bash
# 1. Ejecutar SQL en Supabase (manual, desde el dashboard)

# 2. Verificar tablas
node setup-official-stores.js

# 3. Crear tiendas de prueba
node seed-official-stores.js

# 4. Abrir la app y ver HomeScreen
# Las 5 tiendas deberían aparecer en "Tiendas Oficiales"

# 5. (Opcional) Aprobar aplicaciones de usuarios
node approve-store-application.js
```

---

**🎉 ¡Listo! Tu sistema de Tiendas Oficiales está completo y funcional.**
