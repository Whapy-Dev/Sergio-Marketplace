const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking marketplace schema...\n');

  const tables = ['categories', 'profiles', 'official_stores', 'withdrawal_requests', 'settings'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    console.log(`📋 Table: ${table}`);
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ❌ Does NOT exist\n');
      } else {
        console.log(`   ⚠️  Error: ${error.message}\n`);
      }
    } else {
      console.log('   ✅ EXISTS');
      if (data && data.length > 0) {
        console.log('   Sample columns:', Object.keys(data[0]).join(', '));
      }
      console.log('');
    }
  }

  console.log('✨ Schema check complete!');
}

checkSchema().catch(console.error);
