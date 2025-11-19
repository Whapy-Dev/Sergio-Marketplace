const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function testBanners() {
  console.log('🎨 Probando acceso a banners...\n');

  // 1. Intentar leer banners
  console.log('1. Intentando leer banners...');
  const { data: readData, error: readError } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true);

  if (readError) {
    console.log('❌ Error leyendo banners:', readError);
  } else {
    console.log(`✅ Banners leídos exitosamente: ${readData?.length || 0} banners`);
    if (readData && readData.length > 0) {
      console.log('   Banners:', JSON.stringify(readData, null, 2));
    }
  }

  // 2. Intentar contar banners
  console.log('\n2. Intentando contar banners...');
  const { count, error: countError } = await supabase
    .from('banners')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Error contando banners:', countError);
  } else {
    console.log(`✅ Total de banners: ${count || 0}`);
  }

  // 3. Verificar estructura de la tabla
  console.log('\n3. Verificando estructura de la tabla...');
  const { data: structureData, error: structureError } = await supabase
    .from('banners')
    .select('*')
    .limit(1);

  if (structureError) {
    console.log('❌ Error verificando estructura:', structureError);
    console.log('   Code:', structureError.code);
    console.log('   Message:', structureError.message);
    console.log('   Details:', structureError.details);
    console.log('   Hint:', structureError.hint);
  } else {
    console.log('✅ Estructura verificada correctamente');
  }

  console.log('\n✅ Test completado');
}

testBanners().catch(console.error);
