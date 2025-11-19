const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function verifyTables() {
  console.log('🔍 VERIFICANDO TABLAS CORRECTAMENTE...\n');

  const tables = [
    'profiles',
    'products',
    'categories',
    'orders',
    'order_items',
    'seller_wallets',
    'withdrawal_requests',
    'official_stores',
    'store_applications',
    'favorites',
    'cart_items',
    'banners',
    'product_images',
    'recently_viewed',
    'search_history',
    'notifications',
    'settings'
  ];

  const existing = [];
  const missing = [];

  for (const table of tables) {
    try {
      // Intentar hacer un SELECT simple
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        // Si hay error, verificar si es por tabla inexistente
        if (error.code === 'PGRST204' ||
            error.code === 'PGRST205' ||
            error.code === '42P01' ||
            error.message.includes('does not exist') ||
            error.message.includes('schema cache')) {
          missing.push(table);
          console.log(`❌ ${table}: NO EXISTE`);
          console.log(`   Error: ${error.message}`);
        } else {
          // Error de otro tipo (RLS, permisos, etc.) pero la tabla existe
          existing.push(table);
          console.log(`✅ ${table}: Existe (error de permisos: ${error.message})`);
        }
      } else {
        existing.push(table);
        console.log(`✅ ${table}: Existe (${data?.length || 0} registros en preview)`);
      }
    } catch (err) {
      missing.push(table);
      console.log(`❌ ${table}: ERROR - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL:');
  console.log('='.repeat(60));
  console.log(`✅ Tablas existentes: ${existing.length}`);
  console.log(`❌ Tablas faltantes: ${missing.length}\n`);

  if (missing.length > 0) {
    console.log('🔧 TABLAS QUE NECESITAN SER CREADAS:');
    missing.forEach(t => console.log(`   - ${t}`));
    console.log();
  }

  if (existing.length > 0) {
    console.log('✅ TABLAS QUE EXISTEN:');
    existing.forEach(t => console.log(`   - ${t}`));
    console.log();
  }

  return { existing, missing };
}

verifyTables().catch(console.error);
