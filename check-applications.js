const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function checkApplications() {
  console.log('Verificando aplicaciones pendientes...\n');

  // 1. Verificar todas las aplicaciones
  const { data: allApps, error: allError } = await supabase
    .from('store_applications')
    .select('*');

  if (allError) {
    console.error('Error al obtener aplicaciones:', allError);
    return;
  }

  console.log(`Total de aplicaciones en la tabla: ${allApps?.length || 0}\n`);

  if (allApps && allApps.length > 0) {
    console.log('Todas las aplicaciones:');
    allApps.forEach((app, i) => {
      console.log(`\n${i + 1}. ID: ${app.id}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   User ID: ${app.user_id}`);
      console.log(`   Store Name: ${app.application_data?.store_name || 'N/A'}`);
      console.log(`   Created: ${app.created_at}`);
      console.log(`   Reviewed: ${app.reviewed_at || 'N/A'}`);
    });
  }

  // 2. Verificar aplicaciones pendientes/en revisión
  console.log('\n\n--- Aplicaciones PENDIENTES o EN REVISIÓN ---\n');
  const { data: pendingApps, error: pendingError } = await supabase
    .from('store_applications')
    .select('*')
    .in('status', ['pending', 'under_review']);

  if (pendingError) {
    console.error('Error:', pendingError);
    return;
  }

  console.log(`Total pendientes/en revisión: ${pendingApps?.length || 0}\n`);

  if (pendingApps && pendingApps.length > 0) {
    pendingApps.forEach((app, i) => {
      console.log(`\n${i + 1}. ID: ${app.id}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   User ID: ${app.user_id}`);
      console.log(`   Store Name: ${app.application_data?.store_name || 'N/A'}`);
      console.log(`   Email: ${app.application_data?.email || 'N/A'}`);
      console.log(`   Created: ${new Date(app.created_at).toLocaleString()}`);
      console.log(`   Full data:`, JSON.stringify(app, null, 2));
    });

    console.log('\n\n⚠️  Encontré aplicaciones pendientes. ¿Deseas eliminarlas?');
    console.log('Para eliminar una aplicación, ejecuta:');
    pendingApps.forEach(app => {
      console.log(`   DELETE FROM store_applications WHERE id = '${app.id}';`);
    });
  } else {
    console.log('✅ No hay aplicaciones pendientes (¡esto es raro si el dashboard muestra 1!)');
    console.log('\nPosible problema de caché o de RLS (Row Level Security)');
  }

  // 3. Contar por status
  console.log('\n\n--- Conteo por Status ---');
  const statuses = ['pending', 'under_review', 'approved', 'rejected'];
  for (const status of statuses) {
    const { count } = await supabase
      .from('store_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    console.log(`${status}: ${count || 0}`);
  }
}

checkApplications().catch(console.error);
