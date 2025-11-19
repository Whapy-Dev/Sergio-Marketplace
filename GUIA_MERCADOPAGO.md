# 🔑 Cómo Obtener Credenciales de MercadoPago

## Paso 1: Crear Cuenta de MercadoPago

1. Ve a: https://www.mercadopago.com.ar
2. Click en **"Crear cuenta"**
3. Completa el registro con tus datos
4. Verifica tu email

---

## Paso 2: Obtener Credenciales de TEST (Para Desarrollo)

1. Inicia sesión en MercadoPago

2. Ve a: https://www.mercadopago.com.ar/developers

3. Click en **"Tus integraciones"** en el menú lateral

4. Click en **"Crear aplicación"**

5. Completa:
   - **Nombre:** "Sergio Marketplace - Test"
   - **Tipo de integración:** Pagos online
   - **Descripción:** (opcional)

6. Click **"Crear aplicación"**

7. Verás dos credenciales:
   - **Public Key (TEST):** Comienza con `TEST-...`
   - **Access Token (TEST):** Comienza con `TEST-...`

8. **COPIA AMBAS CREDENCIALES** (las necesitarás)

---

## Paso 3: Obtener Credenciales de PRODUCCIÓN (Para Lanzar)

⚠️ **IMPORTANTE:** Solo cuando estés listo para recibir pagos reales

1. En la misma página de tu aplicación

2. Cambia el toggle de **"Credenciales de prueba"** a **"Credenciales de producción"**

3. Verás:
   - **Public Key (PROD):** Comienza con `APP_USR_...`
   - **Access Token (PROD):** Comienza con `APP_USR_...`

4. **GUÁRDALAS EN UN LUGAR SEGURO**

---

## 📋 Resumen de Credenciales

Deberías tener 4 credenciales en total:

### TEST (Para desarrollo)
```
PUBLIC_KEY_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ACCESS_TOKEN_TEST=TEST-xxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
```

### PRODUCCIÓN (Para lanzar)
```
PUBLIC_KEY_PROD=APP_USR_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ACCESS_TOKEN_PROD=APP_USR_xxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
```

---

## 🧪 Tarjetas de Prueba de MercadoPago

Para testear pagos en modo TEST, usa estas tarjetas:

### ✅ APROBADO
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: APRO
```

### ❌ RECHAZADO
```
Número: 5031 4332 1540 6351
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
```

### ⏳ PENDIENTE
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: CALL
```

**Más tarjetas de prueba:** https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing

---

## 🔐 Dónde Configurar las Credenciales

### En el CRM
Crearemos un archivo `.env`:

```bash
# apps/crm/.env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key
```

### En la App Mobile
En el archivo de configuración:

```typescript
// src/config/mercadopago.ts
export const MERCADOPAGO_PUBLIC_KEY = 'TEST-tu-public-key';
```

### En el Backend (Supabase Edge Functions)
Para procesar webhooks:

```
ACCESS_TOKEN=TEST-tu-access-token
```

---

## ⚠️ Seguridad

- ✅ **Public Key:** Puede ir en el frontend (app mobile, web)
- ❌ **Access Token:** NUNCA en el frontend, solo backend/edge functions
- 🔒 Usa `.env` y agrega al `.gitignore`
- 🔄 Rota las credenciales cada 6 meses

---

## 📞 Soporte de MercadoPago

Si tienes problemas:
- Docs: https://www.mercadopago.com.ar/developers
- Soporte: developers@mercadopago.com
- Comunidad: https://www.mercadopago.com.ar/developers/es/community

---

**Una vez que tengas las credenciales TEST, avísame y continuamos con la integración.**
