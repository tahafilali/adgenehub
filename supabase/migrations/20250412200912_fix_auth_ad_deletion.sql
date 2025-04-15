-- This migration fixes the authentication issues with the ads table
-- Specifically addressing unauthorized errors (401) when deleting ads

-- Drop any existing policies on the ads table to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can view their own ads" ON public.ads;
DROP POLICY IF EXISTS "Service role can manage all ads" ON public.ads;

-- Create clear, well-defined policies for the ads table

-- Policy for authenticated users to view their own ads
CREATE POLICY "Users can view their own ads" ON public.ads
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert, update, and delete their own ads
CREATE POLICY "Users can manage their own ads" ON public.ads
  FOR ALL USING (auth.uid() = user_id);

-- Policy for service role to manage all ads (for admin operations)
CREATE POLICY "Service role can manage all ads" ON public.ads
  FOR ALL USING (true);

-- Update table permissions to ensure they're correct
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;

-- Create a trigger to ensure ads are always associated with the current user
CREATE OR REPLACE FUNCTION public.handle_new_ad()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS set_ad_user_id ON public.ads;

-- Create the trigger
CREATE TRIGGER set_ad_user_id
  BEFORE INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_ad();

-- Create index on user_id for faster policy enforcement
CREATE INDEX IF NOT EXISTS ads_user_id_idx ON public.ads(user_id);

-- Update any existing ads that might have null user_id
UPDATE public.ads SET user_id = (
  SELECT c.user_id FROM public.campaigns c 
  WHERE c.id = campaign_id
) WHERE user_id IS NULL;
