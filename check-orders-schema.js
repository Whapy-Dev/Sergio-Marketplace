const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking existing database schema...\n');

  // Check for orders table
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  console.log('📋 Table: orders');
  if (ordersError) {
    if (ordersError.message.includes('does not exist')) {
      console.log('   ❌ Does NOT exist\n');
    } else {
      console.log(`   ⚠️  Error: ${ordersError.message}\n`);
    }
  } else {
    console.log('   ✅ EXISTS');
    if (ordersData && ordersData.length > 0) {
      console.log('   Sample columns:', Object.keys(ordersData[0]).join(', '));
    }
    console.log('');
  }

  // Check for order_items table
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);

  console.log('📋 Table: order_items');
  if (itemsError) {
    if (itemsError.message.includes('does not exist')) {
      console.log('   ❌ Does NOT exist\n');
    } else {
      console.log(`   ⚠️  Error: ${itemsError.message}\n`);
    }
  } else {
    console.log('   ✅ EXISTS');
    if (itemsData && itemsData.length > 0) {
      console.log('   Sample columns:', Object.keys(itemsData[0]).join(', '));
    }
    console.log('');
  }

  // Check for payments table
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .limit(1);

  console.log('📋 Table: payments');
  if (paymentsError) {
    if (paymentsError.message.includes('does not exist')) {
      console.log('   ❌ Does NOT exist\n');
    } else {
      console.log(`   ⚠️  Error: ${paymentsError.message}\n`);
    }
  } else {
    console.log('   ✅ EXISTS');
    if (paymentsData && paymentsData.length > 0) {
      console.log('   Sample columns:', Object.keys(paymentsData[0]).join(', '));
    }
    console.log('');
  }

  console.log('✨ Schema check complete!');
}

checkSchema().catch(console.error);
