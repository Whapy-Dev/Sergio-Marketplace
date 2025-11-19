# Resumen: Sistema de Pagos con MercadoPago

## Problema Identificado y Solucionado

### Error Reportado
El usuario reportó que el SQL de orders tenía errores porque varias tablas ya existían en la base de datos.

### Solución Aplicada
1. **Verificación del esquema existente**: Se creó un script `check-orders-schema.js` que verificó las tablas existentes
2. **Adaptación de servicios**: Se actualizó `src/services/orders.ts` para usar el esquema de base de datos que ya existe
3. **Eliminación de migración conflictiva**: Se eliminó la necesidad de ejecutar `003_orders.sql` ya que las tablas existen

## Esquema de Base de Datos Existente

### Tabla `orders`
Columnas principales:
- `id`, `order_number`, `buyer_id`
- `subtotal`, `shipping_total`, `discount_total`, `tax_total`, `total`
- `status`, `payment_method`, `payment_status`
- `payment_id`, `payment_metadata`
- `fiscal_data`, `invoice_number`, `invoice_url`
- `buyer_notes`, `admin_notes`
- `created_at`, `updated_at`

### Tabla `order_items`
Columnas principales:
- `id`, `order_id`, `seller_id`, `product_id`, `variant_id`
- `product_name`, `product_image_url`, `variant_name`
- `unit_price`, `quantity`, `subtotal`
- `commission_rate`, `commission_amount`, `seller_payout`
- `shipping_cost`, `shipping_status`, `tracking_number`, `carrier`
- `shipping_address` (cada item puede tener su propia dirección)
- `created_at`, `updated_at`

### Tabla `payments`
Estado: No existe (se puede crear si es necesario)

## Archivos Creados/Modificados

### 1. Servicios Actualizados
**`src/services/orders.ts`**
- Interfaces actualizadas para coincidir con el esquema existente
- `createOrder()` ahora usa `shipping_total`, `tax_total`, `discount_total`
- Dirección de envío se guarda por item, no por orden
- Soporte para `payment_status` separado de `status`

**`src/services/mercadopago.ts`**
- Ya existía, no requiere cambios
- `createPaymentPreference()` funciona correctamente
- `getPaymentInfo()` para consultar estado de pagos

**`src/config/mercadopago.ts`**
- Configuración con credenciales TEST proporcionadas
- Public Key: `TEST-488455b1-4ee7-43ea-8048-48c3cb0f5231`
- Access Token: `TEST-5641488452009319-111820-...`

### 2. Pantallas de Checkout
**`src/screens/checkout/CheckoutScreen.tsx`**
- Formulario completo de checkout
- Integración con MercadoPago
- Actualizado para usar el esquema correcto de orders

**`src/screens/checkout/PaymentPendingScreen.tsx`**
- Pantalla de espera mientras se procesa el pago
- Incluye placeholder para polling de estado

**`src/screens/checkout/PaymentSuccessScreen.tsx`**
- Confirmación de pago exitoso
- Navegación a "Ver Mi Compra" o "Seguir Comprando"

**`src/screens/checkout/PaymentFailureScreen.tsx`**
- Manejo de errores de pago
- Lista de causas comunes de rechazo
- Opción de reintentar

### 3. Navegación y Deep Linking
**`src/navigation/AppNavigator.tsx`**
- Importación de todas las pantallas de checkout
- Rutas agregadas: `Checkout`, `PaymentPending`, `PaymentSuccess`, `PaymentFailure`
- Configuración de deep linking para callbacks de MercadoPago
- Parse de query params (`order_id` → `orderId`)

**`app.json`**
- Agregado: `"scheme": "sergiomarketplace"`
- Permite que MercadoPago redirija de vuelta a la app

### 4. Scripts de Utilidad
**`check-orders-schema.js`**
- Verifica qué tablas existen en la base de datos
- Útil para debugging futuro

## Flujo Completo de Pago

```
1. Usuario ve producto → Toca "Comprar"
2. Navega a CheckoutScreen
3. Completa información (nombre, email, teléfono, dirección)
4. Toca "Pagar $XXX"
5. Se crea orden en DB (estado: pending)
6. Se crea preferencia en MercadoPago
7. Se abre checkout de MercadoPago en navegador
8. Usuario completa el pago
9. MercadoPago redirige según resultado:
   - Éxito: sergiomarketplace://payment/success?order_id=xxx
   - Fallo: sergiomarketplace://payment/failure?order_id=xxx
   - Pendiente: sergiomarketplace://payment/pending?order_id=xxx
10. App muestra pantalla correspondiente
```

## Tareas Pendientes

### Críticas (Antes de Producción)
- [ ] **Webhook de MercadoPago**: Crear Edge Function en Supabase para recibir notificaciones de pago
  - Actualizar `payment_status` y `status` de la orden
  - Guardar `payment_id` y `payment_metadata`
  - NO confiar solo en el deep link (puede fallar)

- [ ] **Botón "Comprar" en ProductDetail**: Agregar navegación a Checkout
  ```tsx
  navigation.navigate('Checkout', { product, quantity: 1 })
  ```

- [ ] **Testing del flujo completo**:
  - Crear orden
  - Abrir MercadoPago
  - Completar pago con tarjeta de prueba
  - Verificar redirección correcta
  - Verificar que orden se actualiza

### Importantes (Esta Semana)
- [ ] **CRM - Página de Orders**: Vista de todas las órdenes con filtros
- [ ] **Notificaciones de email**: Enviar a comprador y vendedor
- [ ] **Notificaciones push**: Cuando cambia estado de orden
- [ ] **Carrito de compras**: Comprar múltiples productos a la vez
- [ ] **Migración de banners**: Ejecutar `002_banners.sql`
- [ ] **Storage de banners**: Crear bucket público en Supabase

### Secundarias
- [ ] Implementar Analytics en CRM
- [ ] Gestión de categorías en CRM
- [ ] Sistema de roles de usuario

## Tarjetas de Prueba MercadoPago

Para testing en modo TEST, usar estas tarjetas:

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | Aprobado |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | Aprobado |
| Visa | 4074 0950 0160 3828 | 123 | 11/25 | Rechazado (fondos insuficientes) |

## Próximos Pasos Inmediatos

1. **Testar el flujo de pago**:
   ```bash
   cd C:\Users\marti\Desktop\Sergio-Marketplace-main
   npm start
   ```
   - Navegar a un producto
   - Intentar comprar
   - Verificar que se abre MercadoPago

2. **Implementar webhook** (CRÍTICO):
   - Crear función en `supabase/functions/mercadopago-webhook`
   - Validar firma de MercadoPago
   - Actualizar estado de orden
   - Configurar URL en panel de MercadoPago

3. **Agregar botón de compra** en ProductDetailScreen

4. **Testing end-to-end** con tarjetas de prueba

## Archivos que NO se necesitan más

- ~~`supabase/migrations/003_orders.sql`~~ (Las tablas ya existen)
- ~~`src/screens/orders/CheckoutScreen.tsx`~~ (Duplicado, usar el de `checkout/`)

## Credenciales MercadoPago (TEST)

```
Public Key: TEST-488455b1-4ee7-43ea-8048-48c3cb0f5231
Access Token: TEST-5641488452009319-111820-117c9c785c0b626c7388e8e2929857b4-738900958
```

**⚠️ IMPORTANTE**: Estas son credenciales de TEST. Antes de producción:
1. Obtener credenciales de PRODUCCIÓN desde el panel de MercadoPago
2. Actualizar `src/config/mercadopago.ts`
3. Cambiar `sandbox_init_point` por `init_point` en CheckoutScreen.tsx:136

## Documentación Adicional

- **GUIA_MERCADOPAGO.md**: Cómo obtener credenciales y configurar cuenta
- **SETUP_BANNERS.md**: Cómo configurar el sistema de banners

## Contacto y Soporte

Si hay errores o dudas:
1. Revisar logs de la app: `npx expo start`
2. Revisar logs de Supabase: Panel → Logs
3. Revisar webhooks de MercadoPago: Panel → Integraciones → Webhooks
