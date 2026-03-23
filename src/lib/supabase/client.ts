import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser-only Supabase client
// Defers initialization until first use to avoid build-time errors

let clientInstance: SupabaseClient | null = null;
let isServer = false;

// Detect if we're on server
if (typeof window === 'undefined') {
  isServer = true;
}

function createBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing env vars:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'MISSING',
    });
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient {
  if (isServer) {
    throw new Error('getSupabaseClient is browser-only. Do not call during SSR.');
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient();
  }
  return clientInstance;
}

// No-op handler for server-side
const serverHandler: ProxyHandler<any> = {
  get() {
    return () => {
      throw new Error('Supabase client not available during SSR');
    };
  },
};

// Lazy handler for browser
const browserHandler: ProxyHandler<any> = {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
};

// Export appropriate proxy based on environment
export const supabase = isServer
  ? (new Proxy({}, serverHandler) as SupabaseClient)
  : (new Proxy({}, browserHandler) as SupabaseClient);
