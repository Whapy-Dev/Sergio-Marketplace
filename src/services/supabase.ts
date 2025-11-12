import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Debug: Ver todas las variables de entorno
console.log('🔍 DEBUG - Todas las env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
console.log('🔍 DEBUG - EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('🔍 DEBUG - EXPO_PUBLIC_SUPABASE_ANON_KEY length:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔑 Supabase URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}... ✅` : '❌ EMPTY');
console.log('🔑 Supabase Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 30)}... (${SUPABASE_ANON_KEY.length} chars) ✅` : '❌ EMPTY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌❌❌ CRITICAL: Supabase credentials NOT loaded from .env file!');
  console.error('📁 Make sure .env exists in project root with:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});