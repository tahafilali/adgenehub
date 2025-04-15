-- Add new columns to organizations table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'industry') THEN
        ALTER TABLE public.organizations ADD COLUMN industry TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'size') THEN
        ALTER TABLE public.organizations ADD COLUMN size TEXT; -- Small, Medium, Enterprise
    END IF;
END $$;

-- Add any missing columns to memberships table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'role') THEN
        ALTER TABLE public.memberships ADD COLUMN role TEXT NOT NULL DEFAULT 'member'; -- owner, admin, member
    END IF;
END $$;

-- Add organization_id to campaigns if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_id') THEN
        ALTER TABLE public.campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS campaigns_organization_id_idx ON public.campaigns(organization_id);
    END IF;
END $$;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Service role can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view memberships they belong to" ON public.memberships;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.memberships;
DROP POLICY IF EXISTS "Service role can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can read their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can read organization campaigns" ON public.campaigns;

-- Create updated policies for organizations table
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage organizations" ON public.organizations
  FOR ALL USING (true);

-- Updated policies for memberships table
CREATE POLICY "Users can view memberships they belong to" ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners and admins can manage members" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
      AND organization_id = memberships.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role can manage memberships" ON public.memberships
  FOR ALL USING (true);

-- Update campaigns policies to include organization check
CREATE POLICY "Users can read organization campaigns" ON public.campaigns
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Ensure permissions are granted
GRANT ALL ON public.organizations TO authenticated, service_role;
GRANT ALL ON public.memberships TO authenticated, service_role;
