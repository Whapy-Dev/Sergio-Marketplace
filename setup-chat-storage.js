const { createClient } = require('@supabase/supabase-js');

// IMPORTANTE: Reemplaza con tu service_role key (NO la anon key)
// La encuentras en: Supabase Dashboard > Settings > API > service_role key
const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw'; // <-- REEMPLAZAR

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupChatStorage() {
  console.log('Configurando storage para chat-images...\n');

  // 1. Verificar/crear bucket
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listando buckets:', listError.message);
    console.log('\n⚠️  Asegúrate de usar la SERVICE_ROLE key, no la anon key');
    return;
  }

  const bucketExists = buckets.some(b => b.name === 'chat-images');

  if (!bucketExists) {
    console.log('Creando bucket chat-images...');
    const { error: createError } = await supabase.storage.createBucket('chat-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (createError) {
      console.error('Error creando bucket:', createError.message);
      return;
    }
    console.log('✅ Bucket chat-images creado');
  } else {
    console.log('✅ Bucket chat-images ya existe');

    // Actualizar a público si no lo está
    const { error: updateError } = await supabase.storage.updateBucket('chat-images', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (updateError) {
      console.error('Error actualizando bucket:', updateError.message);
    } else {
      console.log('✅ Bucket actualizado como público');
    }
  }

  console.log('\n✅ Storage configurado correctamente!');
  console.log('\nAhora ve al Dashboard de Supabase:');
  console.log('1. Storage > chat-images > Policies');
  console.log('2. Click "New Policy" > "For full customization"');
  console.log('3. Crea política INSERT:');
  console.log('   - Name: "Allow uploads"');
  console.log('   - Operation: INSERT');
  console.log('   - Target roles: authenticated');
  console.log('   - WITH CHECK: true');
  console.log('4. Crea política SELECT:');
  console.log('   - Name: "Allow viewing"');
  console.log('   - Operation: SELECT');
  console.log('   - Target roles: public');
  console.log('   - USING: true');
}

setupChatStorage();
