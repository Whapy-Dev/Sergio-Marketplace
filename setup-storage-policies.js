const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupPolicies() {
  console.log('Creando políticas de storage...\n');

  // Crear políticas usando SQL
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      -- Eliminar políticas existentes si hay
      DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow viewing" ON storage.objects;
      DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view chat images" ON storage.objects;

      -- Política para subir (INSERT)
      CREATE POLICY "Allow authenticated uploads to chat-images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'chat-images');

      -- Política para ver (SELECT)
      CREATE POLICY "Allow public viewing of chat-images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'chat-images');
    `
  });

  if (error1) {
    // Si falla el RPC, intentar directo
    console.log('Intentando método alternativo...');

    const { error: sqlError } = await supabase.from('_exec').select('*').limit(0);

    // Las políticas en storage.objects requieren acceso directo
    // Vamos a probar subiendo una imagen de prueba
    console.log('\nProbando si el bucket funciona...');

    const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload('test/test.png', testData, { upsert: true });

    if (uploadError) {
      console.log('❌ Error de prueba:', uploadError.message);
      console.log('\n⚠️  Necesitas crear las políticas manualmente en el Dashboard:');
      console.log('   Storage > chat-images > Policies > New Policy');
    } else {
      console.log('✅ El bucket funciona correctamente!');
      // Limpiar archivo de prueba
      await supabase.storage.from('chat-images').remove(['test/test.png']);
    }
  } else {
    console.log('✅ Políticas creadas correctamente!');
  }
}

setupPolicies();
