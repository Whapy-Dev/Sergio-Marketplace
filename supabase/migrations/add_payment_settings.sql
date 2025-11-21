-- Add MercadoPago and ARCA settings to the settings table

-- MercadoPago settings
INSERT INTO settings (key, value, description) VALUES
  ('mp_public_key', '', 'MercadoPago Public Key')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('mp_access_token', '', 'MercadoPago Access Token (secret)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('mp_test_mode', 'true', 'MercadoPago test mode enabled')
ON CONFLICT (key) DO NOTHING;

-- ARCA (electronic invoicing) settings
INSERT INTO settings (key, value, description) VALUES
  ('arca_cuit', '', 'CUIT del emisor de facturas')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('arca_certificate', '', 'Certificado digital ARCA (.crt)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('arca_private_key', '', 'Clave privada ARCA (.key)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('arca_test_mode', 'true', 'ARCA homologation mode enabled')
ON CONFLICT (key) DO NOTHING;
