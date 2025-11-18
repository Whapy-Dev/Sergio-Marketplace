const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tiendas oficiales de prueba
const officialStoresData = [
  {
    store_name: 'Samsung Store Argentina',
    slug: 'samsung-store-argentina',
    description: 'Tienda oficial de Samsung en Argentina. Productos originales con garantía oficial.',
    email: 'samsung@marketplace.com',
    phone: '+54 11 4000-5000',
    website: 'https://www.samsung.com/ar',
    address: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1043',
    business_type: 'corporation',
    tax_id: '30-12345678-9',
    legal_name: 'Samsung Electronics Argentina S.A.',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    is_active: true,
    rating: 4.8,
    total_sales: 15420,
    total_products: 245,
    followers_count: 8920,
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    banner_url: null,
  },
  {
    store_name: 'Apple Store Oficial',
    slug: 'apple-store-oficial',
    description: 'Productos Apple originales. iPhone, iPad, Mac, AirPods y más con garantía Apple.',
    email: 'apple@marketplace.com',
    phone: '+54 11 5555-0000',
    website: 'https://www.apple.com/ar',
    address: 'Av. Santa Fe 2950',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1425',
    business_type: 'corporation',
    tax_id: '30-87654321-0',
    legal_name: 'Apple Argentina S.R.L.',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    is_active: true,
    rating: 4.9,
    total_sales: 8750,
    total_products: 156,
    followers_count: 12450,
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    banner_url: null,
  },
  {
    store_name: 'Xiaomi Oficial Argentina',
    slug: 'xiaomi-oficial-argentina',
    description: 'Tienda oficial Xiaomi. Smartphones, smart home, wearables y accesorios.',
    email: 'xiaomi@marketplace.com',
    phone: '+54 11 6000-7000',
    website: 'https://www.mi.com/ar',
    address: 'Av. Cabildo 2999',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1428',
    business_type: 'company',
    tax_id: '30-11223344-5',
    legal_name: 'Xiaomi Argentina S.A.',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    is_active: true,
    rating: 4.7,
    total_sales: 22100,
    total_products: 378,
    followers_count: 15670,
    logo_url: null,
    banner_url: null,
  },
  {
    store_name: 'Motorola Store',
    slug: 'motorola-store',
    description: 'Tienda oficial Motorola. Smartphones y accesorios con garantía oficial.',
    email: 'motorola@marketplace.com',
    phone: '+54 11 4444-3333',
    website: 'https://www.motorola.com.ar',
    address: 'Av. Del Libertador 5678',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1426',
    business_type: 'corporation',
    tax_id: '30-55667788-9',
    legal_name: 'Motorola Argentina S.A.',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    is_active: true,
    rating: 4.6,
    total_sales: 9830,
    total_products: 189,
    followers_count: 6540,
    logo_url: null,
    banner_url: null,
  },
  {
    store_name: 'Sony Store Argentina',
    slug: 'sony-store-argentina',
    description: 'Productos Sony originales. Audio, cámaras, consolas PlayStation y más.',
    email: 'sony@marketplace.com',
    phone: '+54 11 3000-2000',
    website: 'https://www.sony.com.ar',
    address: 'Av. Belgrano 890',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1092',
    business_type: 'corporation',
    tax_id: '30-99887766-5',
    legal_name: 'Sony Argentina S.A.',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    is_active: true,
    rating: 4.8,
    total_sales: 12340,
    total_products: 267,
    followers_count: 9870,
    logo_url: null,
    banner_url: null,
  },
];

async function seedOfficialStores() {
  console.log('🌱 Starting to seed official stores...\n');

  try {
    // Check if official_stores table exists
    const { error: checkError } = await supabase
      .from('official_stores')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error: official_stores table does not exist!');
      console.error('   Please run the migration SQL first.');
      console.error('   Run: node setup-official-stores.js');
      return;
    }

    console.log('✅ Table official_stores exists\n');

    // Get or create test users for each store
    console.log('📝 Creating/getting users for stores...\n');

    for (const storeData of officialStoresData) {
      console.log(`\n🏪 Processing: ${storeData.store_name}`);

      // Create a user for this store (using service role to bypass auth)
      // In production, these would be real user accounts
      const email = storeData.email;
      const password = 'TestPassword123!'; // Demo password

      // Try to get existing user by email
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);

      let userId;

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`   ✓ User already exists: ${email}`);
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
        });

        if (authError) {
          console.error(`   ✗ Error creating user: ${authError.message}`);
          continue;
        }

        userId = authData.user.id;
        console.log(`   ✓ Created new user: ${email}`);

        // Update profile
        await supabase
          .from('profiles')
          .update({
            full_name: storeData.store_name,
            role: 'seller_individual',
          })
          .eq('id', userId);
      }

      // Check if store already exists for this user
      const { data: existingStore } = await supabase
        .from('official_stores')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingStore && existingStore.length > 0) {
        console.log(`   ✓ Store already exists for this user`);
        continue;
      }

      // Create official store
      const { error: storeError } = await supabase
        .from('official_stores')
        .insert({
          ...storeData,
          user_id: userId,
          verified_by: userId, // Self-verified for demo
        });

      if (storeError) {
        console.error(`   ✗ Error creating store: ${storeError.message}`);
        continue;
      }

      console.log(`   ✅ Official store created successfully!`);

      // Create store policies
      const { data: createdStore } = await supabase
        .from('official_stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (createdStore) {
        await supabase.from('store_policies').insert({
          store_id: createdStore.id,
          warranty_days: 365,
          return_policy: 'Devolución gratuita en 30 días. Producto sin uso.',
          accepts_returns: true,
          return_window_days: 30,
          shipping_policy: 'Envío gratis en compras superiores a $50000',
          free_shipping_threshold: 50000,
          shipping_regions: ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe'],
          avg_shipping_days: 3,
          payment_methods: ['cash', 'transfer', 'mercadopago', 'credit_card'],
          accepts_installments: true,
          max_installments: 12,
          support_email: storeData.email,
          support_phone: storeData.phone,
          support_hours: 'Lun-Vie 9-18hs',
        });

        // Create store metrics
        await supabase.from('store_metrics').insert({
          store_id: createdStore.id,
          total_revenue: storeData.total_sales * 25000, // Average price
          monthly_revenue: storeData.total_sales * 2500,
          avg_order_value: 25000,
          avg_rating: storeData.rating,
          total_reviews: Math.floor(storeData.total_sales * 0.3),
          customer_satisfaction_rate: 95,
          response_time_hours: 2,
          response_rate: 98,
          products_count: storeData.total_products,
          active_products_count: storeData.total_products,
          out_of_stock_count: 5,
          total_customers: Math.floor(storeData.total_sales * 0.8),
          repeat_customers: Math.floor(storeData.total_sales * 0.3),
          repeat_customer_rate: 37.5,
          return_rate: 2.5,
          refund_rate: 1.2,
          metric_type: 'all_time',
        });

        console.log(`   ✅ Policies and metrics created`);
      }
    }

    console.log('\n\n✅ ===================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('✅ ===================================\n');

    console.log('📊 Summary:');
    console.log(`   - ${officialStoresData.length} official stores created`);
    console.log(`   - Each store has policies and metrics`);
    console.log(`   - All stores are verified and active\n`);

    console.log('🔐 Test Users Created (for demo):');
    officialStoresData.forEach((store) => {
      console.log(`   Email: ${store.email}`);
      console.log(`   Password: TestPassword123!`);
      console.log('   ---');
    });

    console.log('\n💡 Next Steps:');
    console.log('   1. Restart your React Native app');
    console.log('   2. Go to Home screen');
    console.log('   3. Scroll down to see "Tiendas Oficiales" section');
    console.log('   4. Click on any store to see details\n');

    // Show current stores count
    const { count } = await supabase
      .from('official_stores')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    console.log(`📈 Total approved stores in database: ${count}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the seed
seedOfficialStores();
