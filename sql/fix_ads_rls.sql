-- Check current RLS policies on ads table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads';

-- Make sure RLS is enabled on ads table
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to rebuild them
DROP POLICY IF EXISTS "Users can view their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can insert their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can delete their own ads" ON public.ads;
DROP POLICY IF EXISTS "Service role has full access to ads" ON public.ads;

-- Create policies that ensure proper access
-- Users can view their own ads
CREATE POLICY "Users can view their own ads" ON public.ads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own ads
CREATE POLICY "Users can insert their own ads" ON public.ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own ads
CREATE POLICY "Users can update their own ads" ON public.ads
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own ads
CREATE POLICY "Users can delete their own ads" ON public.ads
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access to ads
CREATE POLICY "Service role has full access to ads" ON public.ads
  FOR ALL USING (auth.role() = 'service_role');

-- Check updated policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads';

-- Additional diagnostic query for ads table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'ads'
) AS ads_table_exists;

-- Check columns and constraints
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'ads'
ORDER BY ordinal_position; 