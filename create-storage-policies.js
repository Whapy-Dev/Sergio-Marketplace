const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw'
);

async function createPolicies() {
  console.log('Creando políticas de storage para chat-images...\n');

  // Intentar crear políticas con SQL usando la función postgres
  const sql = `
    DO $$
    BEGIN
      -- Eliminar políticas existentes
      DROP POLICY IF EXISTS "chat_images_insert" ON storage.objects;
      DROP POLICY IF EXISTS "chat_images_select" ON storage.objects;

      -- Crear política INSERT para usuarios autenticados
      CREATE POLICY "chat_images_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'chat-images');

      -- Crear política SELECT pública
      CREATE POLICY "chat_images_select" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'chat-images');

      RAISE NOTICE 'Políticas creadas exitosamente';
    END $$;
  `;

  // Usar la REST API directamente
  const response = await fetch('https://dhfnfdschxhfwrfaoyqa.supabase.co/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const text = await response.text();
    console.log('No se puede crear políticas via RPC, probando método directo...');

    // Intentar con el endpoint de SQL directo
    const sqlResponse = await fetch('https://dhfnfdschxhfwrfaoyqa.supabase.co/pg/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!sqlResponse.ok) {
      console.log('❌ No se pueden crear políticas automáticamente.\n');
      console.log('Por favor, ve al Dashboard de Supabase y haz lo siguiente:');
      console.log('\n1. Ve a Storage > chat-images');
      console.log('2. Click en la pestaña "Policies"');
      console.log('3. Click "New policy"');
      console.log('4. Selecciona "For full customization"\n');

      console.log('POLÍTICA 1 - Para INSERT:');
      console.log('  - Policy name: chat_images_insert');
      console.log('  - Allowed operation: INSERT');
      console.log('  - Target roles: authenticated');
      console.log('  - WITH CHECK expression: true\n');

      console.log('POLÍTICA 2 - Para SELECT:');
      console.log('  - Policy name: chat_images_select');
      console.log('  - Allowed operation: SELECT');
      console.log('  - Target roles: public');
      console.log('  - USING expression: true');
    } else {
      console.log('✅ Políticas creadas exitosamente!');
    }
  } else {
    console.log('✅ Políticas creadas exitosamente!');
  }
}

createPolicies();
