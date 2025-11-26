const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhfnfdschxhfwrfaoyqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5mZHNjaHhoZndyZmFveXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0MzI3NSwiZXhwIjoyMDc2MjE5Mjc1fQ.pT7FO60PJLRvxVa1QwRSHRs-o06SMzFBotVmSm2p7rw'
);

async function test() {
  // 1x1 PNG pixel
  const data = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,10,73,68,65,84,120,156,99,0,1,0,0,5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130]);

  const { error } = await supabase.storage
    .from('chat-images')
    .upload('test/pixel.png', data, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Upload funciona correctamente con service_role');
    await supabase.storage.from('chat-images').remove(['test/pixel.png']);
  }
}

test();
