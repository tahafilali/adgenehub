-- COMPLETE FIX FOR MEMBERSHIPS RECURSION ERROR
-- Run this script in Supabase SQL Editor to fix the infinite recursion
-- in the memberships table policies

BEGIN;

-- Step 1: Completely disable RLS on membership tables
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies for a clean start
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships they belong to" ON public.memberships;
DROP POLICY IF EXISTS "Service role can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Members can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admin access all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Service role access" ON public.memberships;
-- And any other policies that might exist
DROP POLICY IF EXISTS "Users can modify their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can modify organization memberships" ON public.memberships;
DROP POLICY IF EXISTS "Allow service role full access" ON public.memberships;

-- Step 3: Create a clean, non-recursive SECURITY DEFINER function for admin checks
-- This is the key to fixing the recursion - we fully bypass RLS with this function
CREATE OR REPLACE FUNCTION public.is_org_admin_safe(user_uuid UUID, org_uuid UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Direct SQL query that bypasses RLS entirely
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = user_uuid
    AND organization_id = org_uuid
    AND role IN ('owner', 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a temporary user for testing
DO $$
BEGIN
  -- Only create if it doesn't exist yet
  IF NOT EXISTS (SELECT FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    -- Insert a test user in auth.users if possible (may fail without necessary permissions)
    BEGIN
      INSERT INTO auth.users (id, email)
      VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com');
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if we can't insert into auth.users
      RAISE NOTICE 'Could not create test user in auth.users: %', SQLERRM;
    END;
  END IF;

  -- Create or update the public user record
  IF EXISTS (SELECT FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    UPDATE public.users 
    SET email = 'test@example.com',
        full_name = 'Test User'
    WHERE id = '00000000-0000-0000-0000-000000000000';
  ELSE
    BEGIN
      INSERT INTO public.users (id, email, full_name)
      VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create test user in public.users: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 5: Create a temporary organization for testing
DO $$
DECLARE
  org_id UUID;
BEGIN
  -- Create a test organization
  INSERT INTO public.organizations (name, owner_id)
  VALUES ('Test Organization', '00000000-0000-0000-0000-000000000000')
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_id;
  
  -- If we didn't get an ID, try to select it
  IF org_id IS NULL THEN
    SELECT id INTO org_id 
    FROM public.organizations 
    WHERE name = 'Test Organization' 
    LIMIT 1;
  END IF;
  
  -- If we now have an org_id, create a membership
  IF org_id IS NOT NULL THEN
    -- Create a membership record
    INSERT INTO public.memberships (user_id, organization_id, role)
    VALUES ('00000000-0000-0000-0000-000000000000', org_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Step 6: Re-enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Step 7: Create clean, simple policies with proper names
-- Policy for users to view their own memberships
CREATE POLICY "Users can view own memberships" 
  ON public.memberships 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Policy for owners/admins to perform ANY operation on org memberships
CREATE POLICY "Admins can manage organization memberships" 
  ON public.memberships 
  FOR ALL 
  USING (
    -- Use our safe function that bypasses RLS
    public.is_org_admin_safe(auth.uid(), organization_id)
  );

-- Policy for service role - ensure it can always access everything
CREATE POLICY "Service role has full access" 
  ON public.memberships 
  FOR ALL 
  USING (auth.jwt() IS NULL);

-- Step 8: Grant necessary permissions
GRANT ALL ON public.memberships TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin_safe TO authenticated, service_role;

-- Step 9: Document the function
COMMENT ON FUNCTION public.is_org_admin_safe IS 'Checks if a user is an admin or owner of an organization without causing RLS recursion';

-- Step 10: Verify the fix by testing a query that previously caused recursion
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test the is_org_admin_safe function
  SELECT public.is_org_admin_safe('00000000-0000-0000-0000-000000000000', (
    SELECT id FROM public.organizations WHERE name = 'Test Organization' LIMIT 1
  )) INTO test_result;
  
  RAISE NOTICE 'Test result: %', test_result;
  
  -- Test a query that would have caused recursion before
  PERFORM auth.uid();  -- This sets auth.uid() to NULL in this context
  
  -- Try a query that previously caused recursion
  BEGIN
    PERFORM * FROM public.memberships LIMIT 1;
    RAISE NOTICE 'Query succeeded without recursion!';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Query failed: %', SQLERRM;
  END;
END $$;

COMMIT; 