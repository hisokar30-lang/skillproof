import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This file is only for browser (client-side) usage
// User must check for window before using

const createBrowserClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Client Error] Missing environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'MISSING',
    });
    throw new Error(
      'Supabase client configuration missing. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Browser-only singleton
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() is browser-only. Use server.ts for server-side calls.');
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient();
  }
  return clientInstance;
}

// Create a proxy for the exported supabase object
export const supabase: SupabaseClient = {
  get auth() {
    return getSupabaseClient().auth;
  },
  get from() {
    return getSupabaseClient().from;
  },
  get storage() {
    return getSupabaseClient().storage;
  },
  get realtime() {
    return getSupabaseClient().realtime;
  },
} as SupabaseClient;
