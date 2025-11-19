import { MERCADOPAGO_ACCESS_TOKEN } from '../config/mercadopago';

export interface CreatePreferenceData {
  items: {
    title: string;
    description?: string;
    picture_url?: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }[];
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'approved' | 'all';
  external_reference?: string;
  notification_url?: string;
}

export interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  client_id: string;
  collector_id: number;
  date_created: string;
  items: any[];
  payer: any;
  back_urls: any;
  auto_return: string;
  external_reference?: string;
}

/**
 * Create a payment preference with MercadoPago
 */
export async function createPaymentPreference(
  data: CreatePreferenceData
): Promise<PreferenceResponse | null> {
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('MercadoPago API Error:', error);
      throw new Error('Failed to create payment preference');
    }

    const preference = await response.json();
    return preference;
  } catch (error) {
    console.error('Error creating payment preference:', error);
    return null;
  }
}

/**
 * Get payment information
 */
export async function getPaymentInfo(paymentId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting payment info:', error);
    return null;
  }
}
