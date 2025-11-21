// Script to add sample images to products and stores
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

// Sample product images by category
const productImages = {
  electronics: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', // phone
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800', // tv
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800', // watch
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', // headphones
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', // camera
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800', // laptop
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', // ipad
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', // smartwatch
  ],
  clothing: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', // tshirt
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', // jeans
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', // jacket
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', // hoodie
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800', // clothes
  ],
  home: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // sofa
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800', // lamp
    'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800', // chair
    'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800', // furniture
  ],
  sports: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', // gym
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', // soccer
    'https://images.unsplash.com/photo-1461896836934- voices-55ffe23?w=800', // bike
  ],
  default: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
  ]
};

// Store logos
const storeLogos = [
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
];

// Store banners
const storeBanners = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
  'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=1200',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200',
];

async function seedImages() {
  console.log('🖼️  Actualizando imágenes de productos y tiendas...\n');

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, category_id');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log(`📦 Encontrados ${products.length} productos\n`);

  // Update each product with a random image
  for (const product of products) {
    const images = productImages.default;
    const randomImage = images[Math.floor(Math.random() * images.length)];

    const { error } = await supabase
      .from('products')
      .update({ image_url: randomImage })
      .eq('id', product.id);

    if (error) {
      console.error(`❌ Error actualizando ${product.name}:`, error.message);
    } else {
      console.log(`✅ ${product.name} - imagen actualizada`);
    }
  }

  // Get all official stores
  const { data: stores, error: storesError } = await supabase
    .from('official_stores')
    .select('id, store_name');

  if (!storesError && stores) {
    console.log(`\n🏪 Encontradas ${stores.length} tiendas oficiales\n`);

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      const logo = storeLogos[i % storeLogos.length];
      const banner = storeBanners[i % storeBanners.length];

      const { error } = await supabase
        .from('official_stores')
        .update({
          logo_url: logo,
          banner_url: banner
        })
        .eq('id', store.id);

      if (error) {
        console.error(`❌ Error actualizando ${store.store_name}:`, error.message);
      } else {
        console.log(`✅ ${store.store_name} - logo y banner actualizados`);
      }
    }
  }

  // Get all sellers and update their avatar
  const { data: sellers, error: sellersError } = await supabase
    .from('sellers')
    .select('id, store_name');

  if (!sellersError && sellers) {
    console.log(`\n👤 Encontrados ${sellers.length} vendedores\n`);

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const logo = storeLogos[i % storeLogos.length];

      const { error } = await supabase
        .from('sellers')
        .update({ logo_url: logo })
        .eq('id', seller.id);

      if (error) {
        console.error(`❌ Error actualizando ${seller.store_name}:`, error.message);
      } else {
        console.log(`✅ ${seller.store_name} - logo actualizado`);
      }
    }
  }

  console.log('\n✨ ¡Imágenes actualizadas exitosamente!');
}

seedImages().catch(console.error);
