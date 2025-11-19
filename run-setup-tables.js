const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.u38sVn5pDovPsWPqN1wg6fvZ4DPo7I4DGLbOh_B9uBs'
);

async function runSQL() {
  console.log('📋 Creando tablas faltantes...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'setup-missing-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);

      // Intentar ejecutar directamente con la API de Supabase
      console.log('\n📝 Intentando ejecutar comando por comando...\n');

      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (cmd.includes('CREATE TABLE') || cmd.includes('CREATE INDEX') || cmd.includes('CREATE POLICY')) {
          console.log(`Ejecutando comando ${i + 1}/${commands.length}...`);
          try {
            await supabase.rpc('exec_sql', { sql_query: cmd + ';' });
          } catch (err) {
            console.log(`⚠️  Comando ${i + 1} puede que ya exista o tuvo un error menor`);
          }
        }
      }
    } else {
      console.log('✅ SQL ejecutado exitosamente!');
      if (data) console.log('Resultado:', data);
    }

    // Verificar que las tablas se crearon
    console.log('\n📊 Verificando tablas...\n');

    const tables = ['banners', 'product_images', 'recently_viewed', 'search_history', 'notifications'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: No existe o tiene error`);
        console.log(`   Error:`, error.message);
      } else {
        console.log(`✅ ${table}: Existe (${count || 0} registros)`);
      }
    }

    console.log('\n🎉 Proceso completado!');

  } catch (error) {
    console.error('💥 Error fatal:', error);
  }
}

runSQL();
