const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNzUsImV4cCI6MjA3NjIxOTI3NX0.5GBOglEoCE1pNd6N5uBAC-jiPWMkaA1qbWO8wN2pMCM'
);

async function setupNotificationsTables() {
  console.log('Setting up push notifications tables...\n');

  // Create push_tokens table
  const { error: pushTokensError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS push_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
        device_name TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, token)
      );

      CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
    `
  });

  if (pushTokensError) {
    console.log('Creating push_tokens via direct insert test...');

    // Try alternative approach - check if table exists
    const { data, error } = await supabase
      .from('push_tokens')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('❌ push_tokens table does not exist');
      console.log('Please create it manually in Supabase SQL Editor with:');
      console.log(`
CREATE TABLE push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
      `);
    } else {
      console.log('✅ push_tokens table exists');
    }
  } else {
    console.log('✅ push_tokens table created');
  }

  // Check notification_history table
  const { data: historyData, error: historyError } = await supabase
    .from('notification_history')
    .select('id')
    .limit(1);

  if (historyError && historyError.code === '42P01') {
    console.log('❌ notification_history table does not exist');
    console.log('Please create it manually in Supabase SQL Editor with:');
    console.log(`
CREATE TABLE notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'read')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_history_user ON notification_history(user_id);
CREATE INDEX idx_notification_history_read ON notification_history(user_id, read_at);

ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notification_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notification_history FOR UPDATE
  USING (auth.uid() = user_id);
    `);
  } else {
    console.log('✅ notification_history table exists');
  }

  console.log('\n--- OAuth Provider Configuration ---\n');
  console.log('To configure Google OAuth:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create OAuth 2.0 credentials');
  console.log('3. Set authorized redirect URI: https://dhfnfdschxhfwrfaoyqa.supabase.co/auth/v1/callback');
  console.log('4. In Supabase Dashboard > Authentication > Providers > Google');
  console.log('   - Enable Google provider');
  console.log('   - Add Client ID and Client Secret\n');

  console.log('To configure Apple OAuth:');
  console.log('1. Go to https://developer.apple.com/');
  console.log('2. Create a Services ID for Sign in with Apple');
  console.log('3. Set redirect URI: https://dhfnfdschxhfwrfaoyqa.supabase.co/auth/v1/callback');
  console.log('4. In Supabase Dashboard > Authentication > Providers > Apple');
  console.log('   - Enable Apple provider');
  console.log('   - Add Service ID, Team ID, Key ID, and Private Key\n');

  console.log('App URL Scheme for deep linking: sergiomarketplace://');
  console.log('\nDone!');
}

setupNotificationsTables();
