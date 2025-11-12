const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
  // Verificar estructura de sellers
  const { data: sellers, error } = await supabase
    .from('sellers')
    .select('*')
    .limit(1);

  console.log('Sellers table structure:', sellers);
  console.log('Error:', error);

  // Verificar estructura de products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  console.log('\nProducts table structure:', products);
}

checkSchema();
