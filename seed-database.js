const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🚀 Iniciando seed de la base de datos...\n');

  try {
    // 1. ELIMINAR PRODUCTOS EXISTENTES (comentado por foreign keys)
    console.log('ℹ️  Nota: No se eliminan productos existentes para evitar conflictos con pedidos\n');

    // 2. CREAR VENDEDORES
    console.log('👥 Creando vendedores...');

    const sellers = [
      { email: 'vendedor1@marketplace.com', password: 'vendedor123', name: 'Electro Store' },
      { email: 'vendedor2@marketplace.com', password: 'vendedor123', name: 'Fashion Shop' },
      { email: 'vendedor3@marketplace.com', password: 'vendedor123', name: 'Super Mercado' },
      { email: 'vendedor4@marketplace.com', password: 'vendedor123', name: 'Tech World' },
    ];

    const sellerIds = [];

    for (const seller of sellers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: seller.email,
        password: seller.password,
        email_confirm: true,
        user_metadata: {
          full_name: seller.name
        }
      });

      if (authError) {
        console.log(`⚠️  Error al crear ${seller.name}:`, authError.message);
        // Si ya existe, intentar obtener su ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === seller.email);
        if (existingUser) {
          sellerIds.push(existingUser.id);
          console.log(`✅ Usando vendedor existente: ${seller.name} (${existingUser.id.substring(0, 8)}...)`);
        }
      } else {
        sellerIds.push(authData.user.id);
        console.log(`✅ Vendedor creado: ${seller.name} (${authData.user.id.substring(0, 8)}...)`);
      }
    }

    console.log(`\n✅ ${sellerIds.length} vendedores de auth listos\n`);

    // 2.5. CREAR REGISTROS EN TABLA SELLERS
    console.log('🏪 Creando perfiles de vendedores...');

    const sellersData = sellerIds.map((id, index) => ({
      id: id,
      store_name: sellers[index].name,
      description: `Tienda de ${sellers[index].name}`,
      rating: 4.5 + Math.random() * 0.5,
      is_verified: true
    }));

    const { error: sellersInsertError } = await supabase
      .from('sellers')
      .upsert(sellersData, { onConflict: 'id' });

    if (sellersInsertError) {
      console.log('⚠️  Error al crear perfiles:', sellersInsertError.message);
    } else {
      console.log(`✅ ${sellersData.length} perfiles de vendedores creados\n`);
    }

    // 3. OBTENER CATEGORÍAS
    console.log('📦 Obteniendo categorías...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name');

    if (catError) {
      console.error('❌ Error al obtener categorías:', catError);
      return;
    }

    const electronicsId = categories.find(c => c.name === 'Electrónica')?.id;
    const modaId = categories.find(c => c.name === 'Moda')?.id;
    const hogarId = categories.find(c => c.name === 'Hogar')?.id;
    const deportesId = categories.find(c => c.name === 'Deportes')?.id;
    const supermercadoId = categories.find(c => c.name === 'Supermercado')?.id;

    console.log(`✅ ${categories.length} categorías encontradas\n`);

    // 4. CREAR PRODUCTOS CON IMÁGENES
    console.log('🛍️  Creando productos...\n');

    const products = [
      // Electrónica
      {
        name: 'Smart TV LED 43" Full HD',
        description: 'Smart TV con tecnología LED, resolución Full HD 1920x1080, Netflix, YouTube, HDMI, USB',
        price: 89990,
        compare_at_price: 119990,
        category_id: electronicsId,
        seller_id: sellerIds[0],
        condition: 'new',
        stock: 15,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80'
      },
      {
        name: 'Auriculares Bluetooth Sony WH-1000XM4',
        description: 'Auriculares inalámbricos con cancelación de ruido, batería 30hs, micrófono HD',
        price: 45990,
        compare_at_price: 59990,
        category_id: electronicsId,
        seller_id: sellerIds[3],
        condition: 'new',
        stock: 25,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
      },
      {
        name: 'Notebook HP 15.6" Intel Core i5',
        description: 'Laptop HP 15.6", Intel Core i5 11va Gen, 8GB RAM, 256GB SSD, Windows 11',
        price: 129990,
        compare_at_price: null,
        category_id: electronicsId,
        seller_id: sellerIds[3],
        condition: 'new',
        stock: 8,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80'
      },
      {
        name: 'Smartphone Samsung Galaxy A54 128GB',
        description: 'Celular Samsung Galaxy A54, 128GB, 6GB RAM, Cámara 50MP, Pantalla 6.4"',
        price: 67990,
        compare_at_price: 79990,
        category_id: electronicsId,
        seller_id: sellerIds[0],
        condition: 'new',
        stock: 30,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80'
      },

      // Moda
      {
        name: 'Zapatillas Nike Air Max 270',
        description: 'Zapatillas deportivas Nike Air Max, diseño moderno, suela de goma, colores variados',
        price: 34990,
        compare_at_price: 45990,
        category_id: modaId,
        seller_id: sellerIds[1],
        condition: 'new',
        stock: 50,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
      },
      {
        name: 'Campera de Cuero Hombre',
        description: 'Campera de cuero sintético, cierre frontal, bolsillos laterales, forrada',
        price: 28990,
        compare_at_price: null,
        category_id: modaId,
        seller_id: sellerIds[1],
        condition: 'new',
        stock: 20,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80'
      },
      {
        name: 'Reloj Inteligente Smartwatch',
        description: 'Smartwatch con monitor cardíaco, GPS, resistente al agua, notificaciones',
        price: 15990,
        compare_at_price: 22990,
        category_id: modaId,
        seller_id: sellerIds[3],
        condition: 'new',
        stock: 40,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
      },

      // Hogar
      {
        name: 'Cafetera Express Philips',
        description: 'Cafetera express automática, sistema cappuccino, 15 bares de presión',
        price: 18990,
        compare_at_price: 24990,
        category_id: hogarId,
        seller_id: sellerIds[0],
        condition: 'new',
        stock: 12,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80'
      },
      {
        name: 'Aspiradora Robot iRobot Roomba',
        description: 'Aspiradora robot inteligente, navegación inteligente, recarga automática',
        price: 89990,
        compare_at_price: 119990,
        category_id: hogarId,
        seller_id: sellerIds[0],
        condition: 'new',
        stock: 6,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80'
      },
      {
        name: 'Juego de Sábanas 2 Plazas',
        description: 'Juego de sábanas de algodón, 2 plazas, incluye funda y almohadas',
        price: 8990,
        compare_at_price: null,
        category_id: hogarId,
        seller_id: sellerIds[1],
        condition: 'new',
        stock: 35,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1615800098779-1be32e60cca3?w=500&q=80'
      },

      // Deportes
      {
        name: 'Bicicleta Mountain Bike Rodado 29',
        description: 'Bicicleta MTB rodado 29, 21 cambios Shimano, frenos de disco, suspensión',
        price: 78990,
        compare_at_price: 95990,
        category_id: deportesId,
        seller_id: sellerIds[2],
        condition: 'new',
        stock: 10,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500&q=80'
      },
      {
        name: 'Pelota de Fútbol Adidas',
        description: 'Pelota de fútbol profesional Adidas, tamaño 5, construcción termosellada',
        price: 4990,
        compare_at_price: null,
        category_id: deportesId,
        seller_id: sellerIds[2],
        condition: 'new',
        stock: 60,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0afc?w=500&q=80'
      },

      // Supermercado
      {
        name: 'Pack Aceite de Oliva Extra Virgen 1L x3',
        description: 'Pack de 3 botellas de aceite de oliva extra virgen, primera prensada en frío',
        price: 5990,
        compare_at_price: 7990,
        category_id: supermercadoId,
        seller_id: sellerIds[2],
        condition: 'new',
        stock: 100,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80'
      },
      {
        name: 'Pack Yerba Mate Premium 1kg x2',
        description: 'Pack de 2 paquetes de yerba mate premium con palo, suave y rendidora',
        price: 3990,
        compare_at_price: null,
        category_id: supermercadoId,
        seller_id: sellerIds[2],
        condition: 'new',
        stock: 150,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80'
      },
      {
        name: 'Chocolate Toblerone 360g x3',
        description: 'Pack de 3 barras de chocolate Toblerone con miel y almendras',
        price: 4590,
        compare_at_price: 5990,
        category_id: supermercadoId,
        seller_id: sellerIds[2],
        condition: 'new',
        stock: 80,
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&q=80'
      },
    ];

    // Insertar productos
    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (insertError) {
      console.error('❌ Error al crear productos:', insertError);
      return;
    }

    console.log(`✅ ${insertedProducts.length} productos creados exitosamente!\n`);

    // Mostrar resumen
    console.log('📊 RESUMEN:');
    console.log(`   • Vendedores: ${sellerIds.length}`);
    console.log(`   • Productos: ${insertedProducts.length}`);
    console.log(`   • Categorías: ${categories.length}\n`);

    console.log('🎉 Base de datos poblada exitosamente!');
    console.log('\n📧 Credenciales de vendedores:');
    sellers.forEach(s => {
      console.log(`   • ${s.email} / ${s.password}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
seedDatabase();
