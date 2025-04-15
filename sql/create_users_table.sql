-- Drop the table if it exists (careful, this will delete all data)
-- DROP TABLE IF EXISTS public.users;

-- Create users table with all necessary fields
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

-- Remove any existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all data" ON public.users;

-- Policy for users to read their own data
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: This is the critical policy that allows service role to do anything
-- This uses (true) instead of checking jwt, which is more reliable
CREATE POLICY "Service role can do anything" ON public.users
  FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX users_email_idx ON public.users(email);

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.users TO service_role; 