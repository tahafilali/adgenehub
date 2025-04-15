-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_audience TEXT,
  product_description TEXT,
  tone TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  budget DECIMAL(10, 2),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Users can read their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Service role can do anything with campaigns" ON public.campaigns;

-- Policies for users
CREATE POLICY "Users can read their own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for service role (important for backend operations)
CREATE POLICY "Service role can do anything with campaigns" ON public.campaigns
  FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX campaigns_user_id_idx ON public.campaigns(user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.campaigns TO service_role; 