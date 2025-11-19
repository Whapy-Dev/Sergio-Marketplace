const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.u38sVn5pDovPsWPqN1wg6fvZ4DPo7I4DGLbOh_B9uBs'
);

async function insertBanners() {
  console.log('🎨 Insertando banners de prueba...\n');

  const bannersData = [
    {
      title: 'Ofertas de Verano',
      description: 'Hasta 50% de descuento en productos seleccionados',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
      link_type: 'none',
      link_value: null,
      display_order: 1,
      is_active: true
    },
    {
      title: 'Electrónica Premium',
      description: 'Los mejores dispositivos al mejor precio',
      image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
      link_type: 'category',
      link_value: 'Electrónica',
      display_order: 2,
      is_active: true
    },
    {
      title: 'Envío Gratis',
      description: 'En compras superiores a $50.000',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
      link_type: 'none',
      link_value: null,
      display_order: 3,
      is_active: true
    }
  ];

  try {
    // Eliminar banners existentes
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log('⚠️  Error al eliminar banners anteriores:', deleteError.message);
      console.log('   (Esto es normal si no había banners)');
    }

    // Insertar nuevos banners
    const { data, error } = await supabase
      .from('banners')
      .insert(bannersData)
      .select();

    if (error) {
      console.error('❌ Error insertando banners:', error);
      throw error;
    }

    console.log(`✅ ${data.length} banners insertados exitosamente!\n`);

    // Mostrar banners
    data.forEach((banner, i) => {
      console.log(`${i + 1}. ${banner.title}`);
      console.log(`   Tipo: ${banner.link_type}`);
      console.log(`   Orden: ${banner.display_order}`);
      console.log(`   Activo: ${banner.is_active ? 'Sí' : 'No'}`);
      console.log();
    });

    // Verificar que se pueden leer
    console.log('📖 Verificando lectura con la API anon...\n');

    const supabaseAnon = createClient(
      'https://dhfnfdschxhfwrfaoyqa.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
    );

    const { data: readData, error: readError } = await supabaseAnon
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (readError) {
      console.log('❌ Error leyendo banners (error de schema cache):', readError.message);
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   1. Ve a https://supabase.com/dashboard/project/dhfnfdschxhfwrfaoyqa');
      console.log('   2. Settings → API');
      console.log('   3. Haz clic en "Reload schema cache"');
      console.log('   4. Espera 1-2 minutos');
      console.log('   5. Prueba la app nuevamente\n');
    } else {
      console.log(`✅ Banners leídos correctamente: ${readData.length} banners`);
      console.log('\n🎉 Todo funciona! Los banners aparecerán en la app.');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

insertBanners();
