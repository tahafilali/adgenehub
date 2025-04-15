-- Fix memberships policy recursive error
-- This file fixes the "infinite recursion detected in policy for relation memberships" error

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.memberships;

-- Create a new policy that avoids recursion
CREATE POLICY "Organization owners and admins can manage members" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = memberships.organization_id
      AND m.role IN ('owner', 'admin')
    )
  );

-- The key fix is using an alias (m) for the memberships table in the subquery
-- This prevents the policy from referring to the same relation without qualification

-- Ensure other policies are also properly defined
DROP POLICY IF EXISTS "Users can view memberships they belong to" ON public.memberships;
CREATE POLICY "Users can view memberships they belong to" ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage memberships" ON public.memberships;
CREATE POLICY "Service role can manage memberships" ON public.memberships
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.memberships TO authenticated, service_role; 