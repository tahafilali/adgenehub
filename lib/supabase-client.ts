"use client";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a singleton client to avoid multiple instances warning
let supabaseInstance: ReturnType<typeof createClientInstance> | null = null;

// For client components
function createClientInstance() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'supabase-auth',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      // Use implicit flow for better Google OAuth compatibility
      flowType: 'implicit'
    }
  });
}

// Create or return existing client
export const createSupabaseClient = () => {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createClientInstance();
  }
  return supabaseInstance || createClientInstance();
}; 