const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = 'https://dhfnfdschxhfwrfaoyqa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function generateSlug(storeName) {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function listPendingApplications() {
  console.log('\n📋 Fetching pending applications...\n');

  const { data: applications, error } = await supabase
    .from('store_applications')
    .select(`
      *,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .in('status', ['pending', 'under_review'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching applications:', error);
    return [];
  }

  if (!applications || applications.length === 0) {
    console.log('ℹ️  No pending applications found.\n');
    return [];
  }

  console.log(`Found ${applications.length} pending application(s):\n`);

  applications.forEach((app, index) => {
    console.log(`${index + 1}. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   📧 Email: ${app.profiles?.email || 'N/A'}`);
    console.log(`   👤 User: ${app.profiles?.full_name || 'N/A'}`);
    console.log(`   🏪 Store Name: ${app.application_data.store_name}`);
    console.log(`   📝 Description: ${app.application_data.description.substring(0, 60)}...`);
    console.log(`   📍 Location: ${app.application_data.city}, ${app.application_data.state}`);
    console.log(`   📞 Phone: ${app.application_data.phone}`);
    console.log(`   🏢 Business Type: ${app.application_data.business_type}`);
    console.log(`   🆔 Tax ID: ${app.application_data.tax_id}`);
    console.log(`   📅 Applied: ${new Date(app.created_at).toLocaleDateString()}`);
    console.log(`   ⏱️  Status: ${app.status}`);
    console.log('');
  });

  return applications;
}

async function approveApplication(application) {
  console.log(`\n✅ Approving application for: ${application.application_data.store_name}\n`);

  const slug = generateSlug(application.application_data.store_name);

  try {
    // 1. Create the official store
    const { data: newStore, error: storeError } = await supabase
      .from('official_stores')
      .insert({
        user_id: application.user_id,
        store_name: application.application_data.store_name,
        slug: slug,
        description: application.application_data.description,
        email: application.application_data.email,
        phone: application.application_data.phone,
        website: application.application_data.website || null,
        address: application.application_data.address,
        city: application.application_data.city,
        state: application.application_data.state,
        postal_code: application.application_data.postal_code,
        country: 'Argentina',
        business_type: application.application_data.business_type,
        tax_id: application.application_data.tax_id,
        legal_name: application.application_data.legal_name,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        is_active: true,
        rating: 0,
        total_sales: 0,
        total_products: 0,
        followers_count: 0,
      })
      .select()
      .single();

    if (storeError) {
      console.error('❌ Error creating official store:', storeError);
      return false;
    }

    console.log('✅ Official store created with ID:', newStore.id);

    // 2. Create default store policies
    const { error: policiesError } = await supabase
      .from('store_policies')
      .insert({
        store_id: newStore.id,
        warranty_days: 30,
        return_policy: 'Consultar con el vendedor',
        accepts_returns: true,
        return_window_days: 30,
        shipping_policy: 'Envío a coordinar con el vendedor',
        payment_methods: ['cash', 'transfer'],
        accepts_installments: false,
        support_email: application.application_data.email,
        support_phone: application.application_data.phone,
        support_hours: 'Lun-Vie 9-18hs',
      });

    if (policiesError) {
      console.error('⚠️  Warning: Error creating policies:', policiesError);
    } else {
      console.log('✅ Store policies created');
    }

    // 3. Create initial metrics
    const { error: metricsError } = await supabase
      .from('store_metrics')
      .insert({
        store_id: newStore.id,
        metric_type: 'all_time',
        total_revenue: 0,
        monthly_revenue: 0,
        avg_order_value: 0,
        avg_rating: 0,
        total_reviews: 0,
        customer_satisfaction_rate: 0,
        response_time_hours: 0,
        response_rate: 100,
        products_count: 0,
        active_products_count: 0,
        out_of_stock_count: 0,
        total_customers: 0,
        repeat_customers: 0,
        repeat_customer_rate: 0,
        return_rate: 0,
        refund_rate: 0,
      });

    if (metricsError) {
      console.error('⚠️  Warning: Error creating metrics:', metricsError);
    } else {
      console.log('✅ Store metrics created');
    }

    // 4. Update application status
    const { error: updateError } = await supabase
      .from('store_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: 'Application approved. Welcome to Official Stores!',
      })
      .eq('id', application.id);

    if (updateError) {
      console.error('⚠️  Warning: Error updating application:', updateError);
    } else {
      console.log('✅ Application marked as approved');
    }

    console.log('\n🎉 SUCCESS! Store has been approved and created!\n');
    return true;

  } catch (error) {
    console.error('❌ Fatal error during approval:', error);
    return false;
  }
}

async function rejectApplication(application, reason) {
  console.log(`\n❌ Rejecting application for: ${application.application_data.store_name}\n`);

  const { error } = await supabase
    .from('store_applications')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: reason || 'Application does not meet requirements.',
    })
    .eq('id', application.id);

  if (error) {
    console.error('❌ Error rejecting application:', error);
    return false;
  }

  console.log('✅ Application has been rejected.\n');
  return true;
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  OFFICIAL STORES - APPLICATION MANAGER ║');
  console.log('╚════════════════════════════════════════╝\n');

  while (true) {
    const applications = await listPendingApplications();

    if (applications.length === 0) {
      console.log('👋 No more applications to review. Goodbye!\n');
      rl.close();
      return;
    }

    const choice = await question('Enter application number to review (or "q" to quit): ');

    if (choice.toLowerCase() === 'q') {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      return;
    }

    const appIndex = parseInt(choice) - 1;

    if (isNaN(appIndex) || appIndex < 0 || appIndex >= applications.length) {
      console.log('\n❌ Invalid selection. Please try again.\n');
      continue;
    }

    const selectedApp = applications[appIndex];

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SELECTED APPLICATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(selectedApp.application_data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const action = await question('Action? (a=approve / r=reject / b=back): ');

    if (action.toLowerCase() === 'a') {
      await approveApplication(selectedApp);
      await question('\nPress Enter to continue...');
    } else if (action.toLowerCase() === 'r') {
      const reason = await question('Reason for rejection (optional): ');
      await rejectApplication(selectedApp, reason);
      await question('\nPress Enter to continue...');
    } else if (action.toLowerCase() === 'b') {
      continue;
    } else {
      console.log('\n❌ Invalid action.\n');
    }
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  rl.close();
});
