const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function setupAppSettings() {
  console.log('Setting up app_settings table...\n');

  // Check if table exists
  const { data: existingData, error: checkError } = await supabase
    .from('app_settings')
    .select('key')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('Table app_settings does not exist.');
    console.log('Please create it in Supabase SQL Editor:\n');
    console.log(`
CREATE TABLE app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public can read settings"
  ON app_settings FOR SELECT
  USING (true);

-- Insert default values
INSERT INTO app_settings (key, value, description) VALUES
  ('support_phone', '0800-333-1234', 'Teléfono de soporte al cliente'),
  ('support_email', 'soporte@sergiomarketplace.com', 'Email de soporte'),
  ('business_hours', 'Lunes a Viernes de 09:00 a 18:00\\nSábados de 9:00 a 13:00', 'Horario de atención'),
  ('pickup_address', 'Av. Principal 1234, Formosa', 'Dirección para retiro en sucursal'),
  ('default_shipping_cost', '3500', 'Costo de envío por defecto'),
  ('tax_rate', '0.21', 'Tasa de IVA'),
  ('installments_count', '3', 'Cantidad de cuotas sin interés');
    `);
    return;
  }

  console.log('✅ Table app_settings exists');

  // Check if settings exist
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key');

  if (!settings || settings.length === 0) {
    console.log('Inserting default settings...');

    const { error: insertError } = await supabase
      .from('app_settings')
      .insert([
        { key: 'support_phone', value: '0800-333-1234', description: 'Teléfono de soporte al cliente' },
        { key: 'support_email', value: 'soporte@sergiomarketplace.com', description: 'Email de soporte' },
        { key: 'business_hours', value: 'Lunes a Viernes de 09:00 a 18:00\nSábados de 9:00 a 13:00', description: 'Horario de atención' },
        { key: 'pickup_address', value: 'Av. Principal 1234, Formosa', description: 'Dirección para retiro en sucursal' },
        { key: 'default_shipping_cost', value: '3500', description: 'Costo de envío por defecto' },
        { key: 'tax_rate', value: '0.21', description: 'Tasa de IVA' },
        { key: 'installments_count', value: '3', description: 'Cantidad de cuotas sin interés' },
      ]);

    if (insertError) {
      console.error('Error inserting settings:', insertError);
    } else {
      console.log('✅ Default settings inserted');
    }
  } else {
    console.log(`✅ Settings already exist (${settings.length} keys)`);
  }

  // Show current settings
  const { data: allSettings } = await supabase
    .from('app_settings')
    .select('key, value');

  console.log('\nCurrent settings:');
  allSettings?.forEach(s => console.log(`  ${s.key}: ${s.value}`));
}

setupAppSettings();
