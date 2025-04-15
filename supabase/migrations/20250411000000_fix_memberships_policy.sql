-- Migration: Fix Memberships Policy Recursion
-- Created at: 2025-04-11
-- Description: Fixes the "infinite recursion detected in policy for relation memberships" error

-- Step 1: Temporarily disable RLS to allow policy modifications
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships they belong to" ON public.memberships;
DROP POLICY IF EXISTS "Service role can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Members can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admin access all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Service role access" ON public.memberships;

-- Step 3: Create a helper function to check if a user is an admin for an organization
-- This avoids the recursion by using direct SQL rather than going through RLS
CREATE OR REPLACE FUNCTION public.is_org_admin(user_uuid UUID, org_uuid UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = user_uuid
    AND organization_id = org_uuid
    AND role IN ('owner', 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Re-enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simpler, non-recursive policies that use the helper function
-- Policy for viewing your own memberships
CREATE POLICY "Members can view their own memberships" 
  ON public.memberships FOR SELECT 
  USING (user_id = auth.uid());

-- Policy for owners/admins to modify organization memberships 
CREATE POLICY "Admin access all memberships" 
  ON public.memberships FOR ALL 
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Policy for service role access
CREATE POLICY "Service role access" 
  ON public.memberships FOR ALL 
  USING (true);

-- Step 6: Grant permissions
GRANT ALL ON public.memberships TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated, service_role;

-- Step 7: Add function documentation
COMMENT ON FUNCTION public.is_org_admin IS 'Checks if a user is an admin or owner of an organization'; 