const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc3NX0.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupBanners() {
  console.log('🚀 Starting Banners setup...\n');

  try {
    // Check if banners table exists
    console.log('🔍 Checking if banners table exists...\n');

    const { error: checkError } = await supabase
      .from('banners')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('❌ Table "banners" does not exist.');
      console.log('\n📋 You need to execute the SQL migration:\n');
      console.log('1. Open Supabase Dashboard: https://app.supabase.com/project/dhfnfdschxhfwrfaoyqa');
      console.log('2. Go to "SQL Editor"');
      console.log('3. Copy the content of: supabase/migrations/002_banners.sql');
      console.log('4. Paste and run the SQL');
      console.log('5. Run this script again\n');
      return;
    }

    if (checkError) {
      console.error('❌ Error checking table:', checkError);
      return;
    }

    console.log('✅ Table "banners" exists!\n');

    // Check current banners
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('*')
      .order('display_order');

    if (bannersError) {
      console.error('❌ Error fetching banners:', bannersError);
      return;
    }

    console.log(`📊 Current banners in database: ${banners?.length || 0}\n`);

    if (banners && banners.length > 0) {
      console.log('Current banners:');
      banners.forEach((banner, index) => {
        console.log(`  ${index + 1}. ${banner.title} (${banner.is_active ? 'Active' : 'Inactive'})`);
      });
      console.log('');
    }

    // Check if storage bucket exists
    console.log('🗂️  Checking storage bucket...\n');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('⚠️  Could not check storage buckets:', bucketsError.message);
    } else {
      const bannersBucket = buckets.find(b => b.name === 'banners');
      if (bannersBucket) {
        console.log('✅ Storage bucket "banners" exists\n');
      } else {
        console.log('❌ Storage bucket "banners" does not exist\n');
        console.log('📋 To create the bucket:\n');
        console.log('1. Open Supabase Dashboard');
        console.log('2. Go to "Storage"');
        console.log('3. Click "New bucket"');
        console.log('4. Name: banners');
        console.log('5. Set as Public: YES');
        console.log('6. Click "Create bucket"\n');
      }
    }

    console.log('✅ Setup complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Make sure the storage bucket "banners" is created and public');
    console.log('   2. Open the CRM: cd apps/crm && npm run dev');
    console.log('   3. Go to "Banners" section');
    console.log('   4. Create your first banner\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

setupBanners();
