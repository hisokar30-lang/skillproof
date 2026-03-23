import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser-only Supabase client
// Defers initialization until first use to avoid build-time errors

let clientInstance: SupabaseClient | null = null;

function createBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client is browser-only');
  }

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
  if (!clientInstance) {
    clientInstance = createBrowserClient();
  }
  return clientInstance;
}

// Lazy proxy - defers actual client creation until property access
const handler: ProxyHandler<any> = {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    // Bind methods to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
};

export const supabase = new Proxy({}, handler) as SupabaseClient;
