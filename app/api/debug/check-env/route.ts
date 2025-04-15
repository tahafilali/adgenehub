import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing',
    };
    
    // Check if we can initialize Supabase client
    let supabaseInitStatus = '❌ Failed';
    let supabaseAuthStatus = '❌ Failed';
    let usersTableStatus = '❌ Failed';
    let errorDetails = null;
    
    try {
      // Try to initialize the Supabase client 
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
      
      supabaseInitStatus = '✅ Success';
      
      // Check Auth service
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (!authError) {
        supabaseAuthStatus = '✅ Success';
      } else {
        supabaseAuthStatus = `❌ Failed: ${authError.message}`;
        errorDetails = authError;
      }
      
      // Check users table
      const { error: tableError } = await supabase.from('users').select('id').limit(1);
      
      if (!tableError) {
        usersTableStatus = '✅ Success';
      } else {
        usersTableStatus = `❌ Failed: ${tableError.message}`;
        errorDetails = tableError;
      }
      
    } catch (error) {
      errorDetails = error;
    }
    
    // Construct response
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envVars,
      services: {
        supabaseInit: supabaseInitStatus,
        supabaseAuth: supabaseAuthStatus,
        usersTable: usersTableStatus
      },
      errorDetails
    };
    
    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json({
      error: 'Error running diagnostics',
      details: String(error)
    }, { status: 500 });
  }
} 