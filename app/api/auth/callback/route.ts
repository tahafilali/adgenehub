import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';
import { toast } from 'react-toastify';

/**
 * Helper function to create a user record in the public.users table
 * Uses multiple fallback approaches to ensure success
 */
async function createUserRecord(supabase: SupabaseClient<Database>, user: User) {
  const timestamp = new Date().toISOString();
  
  try {
    // Method 1: Direct insert with service role (should bypass RLS)
    console.log('Attempting standard insert with service role');
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
        subscription_tier: 'free',
        credits_used: 0,
        credits_limit: 1000,
        created_at: timestamp,
        updated_at: timestamp
      });
      
    if (!error) {
      console.log(`User record created for ${user.email}`);
      return true;
    }
    
    console.error('Standard insert failed:', error);
    
    // Method 2: Try with RPC function (completely bypasses RLS)
    console.log('Attempting insert via RPC function');
    try {
      const { error: sqlError } = await supabase.rpc('create_user_record', { 
        user_id: user.id,
        user_email: user.email || '',
        user_full_name: user.user_metadata?.full_name || null
      });
      
      if (!sqlError) {
        console.log(`User record created via SQL for ${user.email}`);
        return true;
      }
      
      console.error('SQL insert failed:', sqlError);
    } catch (rpcError) {
      console.error('RPC function error:', rpcError);
    }
    
    // Method 3: Try direct insert with minimal fields
    console.log('Attempting minimal insert');
    const { error: minimalError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || ''
      });
      
    if (!minimalError) {
      console.log(`Minimal user record created for ${user.email}`);
      return true;
    }
    
    console.error('All insert attempts failed:', minimalError);
    
    // Method 4: Last resort - raw SQL query
    try {
      console.log('Attempting raw SQL insert as last resort');
      const { error: rawError } = await supabase.rpc('execute_sql', {
        sql: `INSERT INTO public.users (id, email, subscription_tier, created_at, updated_at) 
              VALUES ('${user.id}', '${user.email || ''}', 'free', NOW(), NOW()) 
              ON CONFLICT (id) DO NOTHING`
      });
      
      if (!rawError) {
        console.log('User created via raw SQL');
        return true;
      }
      
      console.error('Raw SQL insert failed:', rawError);
    } catch (sqlError) {
      console.error('Raw SQL error:', sqlError);
    }
    
    return false;
  } catch (error) {
    console.error('Failed to create user record:', error);
    return false;
  }
}

/**
 * OAuth callback handler for Google authentication
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Auth callback initiated");
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (!code) {
      console.log("Error: Missing code in callback");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=missing_code`);
    }
    
    // Initialize Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Try to create helper functions first (silently fail if it doesn't work)
    try {
      await supabase.rpc('create_user_function', {});
      console.log('Helper function created/verified');
    } catch (e) {
      console.error('Helper function creation failed:', e);
    }
    
    try {
      await supabase.rpc('create_execute_sql_function', {});
      console.log('SQL execution function created/verified');
    } catch (e) {
      console.error('SQL execution function creation failed:', e);
    }
    
    // Exchange code for session
    console.log("Exchanging code for session");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.user) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`);
    }
    
    console.log(`User authenticated: ${data.user.email} (${data.user.id})`);
    
    // Check if user exists in users table
    console.log('Checking if user exists in users table');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.user.email)
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking user:', userError);
      toast.error('Error checking user existence. Please try again.');
    }
    
    // If user doesn't exist in the database, create a record
    if (!userData) {
      toast.success('Successfully authenticated! Redirecting to onboarding...');
      const success = await createUserRecord(supabase, data.user);
      
      if (!success) {
        console.error('Failed to create user record after multiple attempts');
        // Continue anyway - the user is authenticated, just missing a profile
      }
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`);
    }
    
    // User exists, redirect to dashboard
    console.log('Existing user found, redirecting to dashboard');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=callback_failed`);
  }
} 