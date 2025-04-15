import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const createUsersTable = `
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT,
  credits_used INTEGER DEFAULT 0,
  credits_limit INTEGER DEFAULT 1000,
  trial_end_date TIMESTAMP,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all data" ON public.users;

-- Create policies
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can do anything" ON public.users
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
`;

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
    
    // Check if users table exists
    console.log("Checking if users table exists");
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (checkError) {
      if (checkError.message.includes('relation "users" does not exist')) {
        console.log("Users table doesn't exist, creating it");
        
        // Create the users table using raw SQL
        try {
          // First try with execute_sql function if it exists
          const { error: sqlFuncError } = await supabase.rpc('execute_sql', {
            sql: createUsersTable
          });
          
          if (sqlFuncError) {
            console.error("Failed to execute with function:", sqlFuncError);
            
            // If function doesn't exist, try direct SQL execution
            const { error: directSqlError } = await supabase.rpc('exec_sql', {
              query: createUsersTable
            });
            
            if (directSqlError) {
              console.error("Failed to execute direct SQL:", directSqlError);
              return NextResponse.json({
                success: false,
                error: "Failed to create users table",
                details: directSqlError
              }, { status: 500 });
            }
          }
          
          // Try again to check if table exists now
          const { error: recheckError } = await supabase
            .from('users')
            .select('id')
            .limit(1);
            
          if (recheckError) {
            return NextResponse.json({
              success: false,
              error: "Table creation appeared to succeed but still can't access table",
              details: recheckError
            }, { status: 500 });
          }
          
          return NextResponse.json({
            success: true,
            message: "Users table created successfully"
          });
        } catch (error) {
          console.error("Error creating users table:", error);
          return NextResponse.json({
            success: false,
            error: "Exception creating users table",
            details: error
          }, { status: 500 });
        }
      } else {
        console.error("Error checking users table:", checkError);
        return NextResponse.json({
          success: false,
          error: "Error checking users table",
          details: checkError
        }, { status: 500 });
      }
    }
    
    // Table exists, check the auth user if provided in query
    const userId = request.nextUrl.searchParams.get('userId');
    if (userId) {
      // Get auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        return NextResponse.json({
          success: false,
          error: "Error fetching auth user",
          details: authError
        }, { status: 500 });
      }
      
      if (!authUser?.user) {
        return NextResponse.json({
          success: false,
          error: "User not found in auth.users",
          userId
        }, { status: 404 });
      }
      
      // Check if user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (userError) {
        return NextResponse.json({
          success: false,
          error: "Error checking user in users table",
          details: userError,
          userId
        }, { status: 500 });
      }
      
      if (!userData) {
        // User exists in auth but not in users table, create record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authUser.user.email || '',
            full_name: authUser.user.user_metadata?.full_name || null,
            subscription_tier: 'free',
            credits_used: 0,
            credits_limit: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          return NextResponse.json({
            success: false,
            error: "Error creating user record",
            details: insertError,
            userId
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: "User record created successfully",
          userId,
          email: authUser.user.email
        });
      }
      
      return NextResponse.json({
        success: true,
        message: "User record already exists",
        userId,
        userData
      });
    }
    
    // No userId provided, just return table status
    return NextResponse.json({
      success: true,
      message: "Users table exists",
      canExecuteSql: true
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error
    }, { status: 500 });
  }
} 