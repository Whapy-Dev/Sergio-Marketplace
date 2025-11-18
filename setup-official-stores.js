const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupOfficialStores() {
  console.log('🚀 Starting Official Stores setup...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '001_official_stores.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded successfully\n');

    // First, verify if tables already exist
    console.log('🔍 Checking if tables already exist...\n');

    const tables = [
      'official_stores',
      'store_metrics',
      'store_policies',
      'store_followers',
      'store_applications'
    ];

    let allTablesExist = true;

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': NOT FOUND`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}': Already exists`);
      }
    }

    if (allTablesExist) {
      console.log('\n✅ All tables already exist! No migration needed.\n');
      return;
    }

    // Tables don't exist, show instructions
    console.log('\n===========================================');
    console.log('INSTRUCCIONES PARA CREAR LAS TABLAS:');
    console.log('===========================================\n');
    console.log('1. Ve a tu dashboard de Supabase:');
    console.log('   https://app.supabase.com/project/dhfnfdschxhfwrfaoyqa\n');
    console.log('2. Ve a "SQL Editor" en el menú lateral\n');
    console.log('3. Haz click en "New query"\n');
    console.log('4. Copia y pega el contenido del archivo:\n');
    console.log('   supabase/migrations/001_official_stores.sql\n');
    console.log('5. Haz click en "Run" para ejecutar el SQL\n');
    console.log('6. Verifica que las tablas se crearon correctamente\n');
    console.log('7. Vuelve a ejecutar este script para verificar\n');
    console.log('===========================================\n');

    console.log('📝 Archivo SQL ubicado en:');
    console.log(`   ${sqlPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupOfficialStores();
