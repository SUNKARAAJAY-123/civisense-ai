import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseEnv() {
  const serverEnv = typeof process !== 'undefined' ? process.env : undefined;
  const clientEnv = (import.meta as any).env;

  const isServer = typeof window === 'undefined';
  return {
    url: isServer ? serverEnv?.SUPABASE_URL : clientEnv?.VITE_SUPABASE_URL,
    key: isServer ? serverEnv?.SUPABASE_SECRET_KEY : clientEnv?.VITE_SUPABASE_ANON_KEY,
    keyName: isServer ? 'SUPABASE_SECRET_KEY' : 'VITE_SUPABASE_ANON_KEY',
  };
}

/**
 * Lazily initializes and returns the Supabase Client.
 * This prevents the application from crashing on startup if the environment variables are not yet set.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { url: supabaseUrl, key: supabaseKey, keyName } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        `Supabase connection parameters are missing. Please configure SUPABASE_URL and ${keyName} in your environment variables.`
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Server side should not persist session globally
        autoRefreshToken: false,
      }
    });
  }
  return supabaseInstance;
}
