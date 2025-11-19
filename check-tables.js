const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function checkTables() {
  console.log('🔍 Verificando tablas en Supabase...\n');

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

  const results = {
    existing: [],
    missing: []
  };

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.missing.push(table);
        console.log(`❌ ${table}: NO EXISTE`);
      } else {
        results.existing.push(table);
        console.log(`✅ ${table}: Existe (${count || 0} registros)`);
      }
    } catch (err) {
      results.missing.push(table);
      console.log(`❌ ${table}: ERROR`);
    }
  }

  console.log('\n📊 RESUMEN:');
  console.log(`✅ Tablas existentes: ${results.existing.length}`);
  console.log(`❌ Tablas faltantes: ${results.missing.length}`);

  if (results.missing.length > 0) {
    console.log('\n🔧 Tablas que necesitan ser creadas:');
    results.missing.forEach(t => console.log(`   - ${t}`));
  }
}

checkTables().catch(console.error);
