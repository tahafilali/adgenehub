/**
 * Supabase Configuration Debug and Fix Script
 * 
 * Run this with: node scripts/fix-supabase-config.js
 */

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ All required environment variables are present');
  return true;
}

// Create and test Supabase client
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Test a simple query
    const { data, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase query error:', error.message);
      
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('The users table does not exist. Let\'s create it.');
        await createUsersTable(supabase);
      } else {
        return false;
      }
    } else {
      console.log('✅ Successfully connected to Supabase and queried the users table');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}

// Create users table
async function createUsersTable(supabase) {
  console.log('Creating users table...');
  
  try {
    // SQL to create users table
    const { error } = await supabase.rpc('create_users_table');
    
    if (error) {
      console.error('❌ Failed to create users table:', error.message);
      console.log('Please run this SQL in the Supabase SQL Editor:');
      console.log(`
CREATE TABLE public.users (
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

-- Policy for users to read their own data
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy for service role to manage all data
CREATE POLICY "Service role can do anything" ON public.users
  FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX users_email_idx ON public.users(email);

-- Grant permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;
      `);
      return false;
    }
    
    console.log('✅ Created users table');
    return true;
  } catch (error) {
    console.error('❌ Error creating users table:', error.message);
    return false;
  }
}

// Create a test user
async function createTestUser(supabase) {
  console.log('Creating a test user...');
  
  const userId = '00000000-0000-0000-0000-000000000000';
  const email = 'test@example.com';
  
  try {
    // First check if the user exists
    const { data, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error checking for test user:', checkError.message);
      return false;
    }
    
    if (data) {
      console.log('✅ Test user already exists');
      return true;
    }
    
    // Create the test user
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: 'Test User',
        subscription_tier: 'free',
        credits_used: 0,
        credits_limit: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError) {
      console.error('❌ Failed to create test user:', createError.message);
      return false;
    }
    
    console.log('✅ Created test user');
    return true;
  } catch (error) {
    console.error('❌ Error in createTestUser:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Supabase Configuration Debug and Fix Tool ===');
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    console.log('❌ Please fix environment variables before continuing');
    process.exit(1);
  }
  
  // Test Supabase connection
  if (!await testSupabaseConnection()) {
    console.log('❌ Please fix Supabase connection issues before continuing');
    process.exit(1);
  }
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Try to create a test user
  await createTestUser(supabase);
  
  console.log('✅ All tests completed');
}

main().catch(console.error); 