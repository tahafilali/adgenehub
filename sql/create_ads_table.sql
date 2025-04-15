-- Create ads table for storing generated ad content
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, paused, archived
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE, -- Indicates if this is the selected ad for the campaign
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Users can read their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can insert their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can delete their own ads" ON public.ads;
DROP POLICY IF EXISTS "Service role can do anything with ads" ON public.ads;

-- Policies for users
CREATE POLICY "Users can read their own ads" ON public.ads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads" ON public.ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" ON public.ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" ON public.ads
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for service role (important for backend operations)
CREATE POLICY "Service role can do anything with ads" ON public.ads
  FOR ALL USING (true);

-- Create indexes for faster lookups
CREATE INDEX ads_user_id_idx ON public.ads(user_id);
CREATE INDEX ads_campaign_id_idx ON public.ads(campaign_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.ads TO service_role; 