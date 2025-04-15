import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get auth user from cookie/session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Failed to get session', 
        details: sessionError.message 
      }, { status: 401 });
    }
    
    if (!sessionData.session?.user) {
      return NextResponse.json({ 
        error: 'No authenticated user found',
        authenticated: false,
        message: 'You need to sign in first'
      }, { status: 401 });
    }
    
    const user = sessionData.session.user;
    
    // Check if the user exists in auth.users table (they should, since we have a session)
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, last_sign_in_at, created_at')
      .eq('id', user.id)
      .maybeSingle();
    
    // Check if users table exists and if the user is in it
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_tier, created_at')
      .eq('id', user.id)
      .maybeSingle();
    
    // Get all tables in the database
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');
    
    // Check RLS policies on users table
    const { data: policies, error: policiesError } = await supabase
      .from('pg_catalog.pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    // Force create user record if it doesn't exist
    let userCreationResult = null;
    if (!publicUser && !publicError) {
      try {
        const timestamp = new Date().toISOString();
        const { data, error } = await supabase
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
          })
          .select();
          
        userCreationResult = { 
          success: !error, 
          error: error ? error.message : null,
          data
        };
      } catch (e) {
        userCreationResult = { 
          success: false,
          error: String(e)
        };
      }
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata.provider,
        fullName: user.user_metadata?.full_name
      },
      checks: {
        authUserExists: !!authUsers,
        publicUserExists: !!publicUser,
        authUserDetails: authUsers,
        publicUserDetails: publicUser,
        authError: authError ? authError.message : null,
        publicError: publicError ? publicError.message : null,
        tableCount: tablesData ? tablesData.length : 0,
        tables: tablesData ? tablesData.map(t => `${t.table_schema}.${t.table_name}`) : [],
        policiesCount: policies ? policies.length : 0,
        policies: policies,
        userCreationResult
      }
    });
  } catch (error) {
    console.error('Error in check-user:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: String(error) 
    }, { status: 500 });
  }
} 