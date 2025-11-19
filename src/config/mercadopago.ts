// MercadoPago Configuration
export const MERCADOPAGO_CONFIG = {
  // Public Key (safe to use in frontend)
  publicKey: process.env.EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'TEST-488455b1-4ee7-43ea-8048-48c3cb0f5231',

  // Test mode
  isTestMode: true,

  // Locale
  locale: 'es-AR',
};

// IMPORTANT: Access Token should NEVER be in frontend
// Use it only in backend/edge functions for:
// - Creating payment preferences
// - Processing webhooks
// - Refunds
export const MERCADOPAGO_ACCESS_TOKEN = 'TEST-5641488452009319-111820-117c9c785c0b626c7388e8e2929857b4-738900958';
