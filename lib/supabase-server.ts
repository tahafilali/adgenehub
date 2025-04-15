import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Creates a Supabase client with the service role key
 * Use this only for trusted server operations that need admin rights
 */
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Creates a Supabase client for server components and API routes
 * Uses the cookie store to maintain sessions
 */
export const createSupabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  try {
    // Get cookies from the Next.js cookie store
    const cookieStore = cookies();
    
    // Check specifically for auth cookies which start with "sb-"
    // This is critical for maintaining the session
    const authCookies = cookieStore.getAll()
      .filter(cookie => cookie.name.startsWith('sb-'))
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    // Log for debugging
    console.log('Auth cookies found:', authCookies ? 'Yes' : 'No');
    
    if (!authCookies) {
      console.log('WARNING: No Supabase auth cookies found in request');
    }
    
    // Create client with auth cookies in global headers
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // Add any auth cookies to the request headers
          ...(authCookies ? { 'Cookie': authCookies } : {})
        }
      }
    });
  } catch (error) {
    console.error('Error accessing cookies in createSupabaseServer:', error);
    
    // If cookies() fails, try an alternative approach with admin key for API routes
    // This ensures something works even if cookie access fails
    console.log('Falling back to admin client as last resort');
    return createSupabaseAdmin();
  }
}; 