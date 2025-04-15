-- Migration: your_migration_name
-- Created at: 2025-04-09T15:58:37.376Z

-- Write your SQL migration here
-- For example:
-- CREATE TABLE my_table (id SERIAL PRIMARY KEY, name TEXT);

-- Add Up Migration SQL here

-- Create metrics table for tracking ad performance over time
CREATE TABLE public.ad_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5, 2), -- Click-through rate (percentage)
  cvr DECIMAL(5, 2), -- Conversion rate (percentage)
  cost DECIMAL(10, 2) DEFAULT 0, -- Daily cost
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can read their own metrics" ON public.ad_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for service role
CREATE POLICY "Service role can do anything with metrics" ON public.ad_metrics
  FOR ALL USING (true);

-- Create indexes for faster lookups
CREATE INDEX ad_metrics_ad_id_idx ON public.ad_metrics(ad_id);
CREATE INDEX ad_metrics_campaign_id_idx ON public.ad_metrics(campaign_id);
CREATE INDEX ad_metrics_user_id_idx ON public.ad_metrics(user_id);
CREATE INDEX ad_metrics_date_idx ON public.ad_metrics(date);

-- Grant permissions
GRANT SELECT ON public.ad_metrics TO authenticated;
GRANT ALL ON public.ad_metrics TO service_role;

-- Commit the transaction
COMMIT;
