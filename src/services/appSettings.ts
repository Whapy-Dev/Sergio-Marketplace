import { supabase } from './supabase';

export interface AppSettings {
  support_phone: string;
  support_email: string;
  business_hours: string;
  pickup_address: string;
  default_shipping_cost: number;
  tax_rate: number;
  installments_count: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  support_phone: '',
  support_email: '',
  business_hours: '',
  pickup_address: '',
  default_shipping_cost: 3500,
  tax_rate: 0.21,
  installments_count: 3,
};

let cachedSettings: AppSettings | null = null;

/**
 * Load app settings from database
 */
export async function getAppSettings(): Promise<AppSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'support_phone',
        'support_email',
        'business_hours',
        'pickup_address',
        'default_shipping_cost',
        'tax_rate',
        'installments_count',
      ]);

    if (error) {
      console.warn('Error loading app settings, using defaults:', error);
      return DEFAULT_SETTINGS;
    }

    const settings: AppSettings = { ...DEFAULT_SETTINGS };

    if (data) {
      data.forEach((item) => {
        switch (item.key) {
          case 'support_phone':
            settings.support_phone = item.value;
            break;
          case 'support_email':
            settings.support_email = item.value;
            break;
          case 'business_hours':
            settings.business_hours = item.value;
            break;
          case 'pickup_address':
            settings.pickup_address = item.value;
            break;
          case 'default_shipping_cost':
            settings.default_shipping_cost = parseFloat(item.value) || DEFAULT_SETTINGS.default_shipping_cost;
            break;
          case 'tax_rate':
            settings.tax_rate = parseFloat(item.value) || DEFAULT_SETTINGS.tax_rate;
            break;
          case 'installments_count':
            settings.installments_count = parseInt(item.value) || DEFAULT_SETTINGS.installments_count;
            break;
        }
      });
    }

    cachedSettings = settings;
    return settings;
  } catch (error) {
    console.error('Error loading app settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Clear cached settings (call when settings are updated)
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
}
