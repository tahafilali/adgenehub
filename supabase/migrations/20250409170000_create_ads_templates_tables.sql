-- Migration: Create Campaigns, Ads, and Templates Tables
-- Created at: 2025-04-09

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_audience TEXT,
  product_description TEXT,
  tone TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  budget DECIMAL(10, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- Create templates table for storing ad templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  preview_text TEXT NOT NULL,
  category TEXT,
  tier TEXT DEFAULT 'basic', -- basic, starter, pro
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Everyone can read templates" ON public.templates;
DROP POLICY IF EXISTS "Service role can manage templates" ON public.templates;

-- Policies for read access
CREATE POLICY "Everyone can read templates" ON public.templates
  FOR SELECT USING (true);

-- Policy for service role (important for backend operations)
CREATE POLICY "Service role can manage templates" ON public.templates
  FOR ALL USING (true);

-- Create indexes for faster lookups
CREATE INDEX templates_tier_idx ON public.templates(tier);
CREATE INDEX templates_category_idx ON public.templates(category);

-- Grant read permissions to authenticated users
GRANT SELECT ON public.templates TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON public.templates TO service_role;

-- Create ads table for storing generated ad content
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, paused, archived
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE, -- Indicates if this is the selected ad for the campaign
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- Insert default templates (basic tier)
INSERT INTO public.templates (name, description, preview_text, category, tier)
VALUES 
  ('Product Announcement', 'Announce a new product or feature with this template', 'Introducing [Product]: The [adjective] solution for [target audience].', 'product', 'basic'),
  ('Special Offer', 'Promote a limited-time discount or special offer', 'For a limited time: Get [discount]% off on [product/service]. Don''t miss out!', 'promotion', 'basic'),
  ('Testimonial Highlight', 'Showcase customer testimonials to build trust', '"[Product] helped me achieve [benefit]. Highly recommended!" - [Customer Name]', 'testimonial', 'basic'),
  ('Problem-Solution', 'Address a pain point and present your solution', 'Tired of [problem]? [Product] is the solution you''ve been looking for.', 'problem-solution', 'basic'),
  ('Feature Highlight', 'Focus on a specific feature and its benefits', 'Our [feature] helps you [benefit] so you can [desired outcome].', 'feature', 'basic');

-- Insert starter tier templates
INSERT INTO public.templates (name, description, preview_text, category, tier)
VALUES 
  ('Seasonal Promotion', 'Tie your offer to a season or holiday', 'This [season/holiday], treat yourself to [product/service] and enjoy [benefit].', 'seasonal', 'starter'),
  ('Comparison Ad', 'Highlight how your product compares to alternatives', 'Why choose [Product]? Unlike [alternatives], we offer [unique benefits].', 'comparison', 'starter'),
  ('FOMO (Fear of Missing Out)', 'Create urgency with limited availability', 'Only [number] left! Get your [product] before they''re gone.', 'urgency', 'starter'),
  ('Facts & Statistics', 'Use compelling stats to build credibility', '[Percentage]% of customers report [positive outcome] after using [product].', 'statistics', 'starter'),
  ('How-To Guide', 'Provide valuable information and education', 'How to [achieve goal] in [timeframe] using [product/service].', 'educational', 'starter');

-- Insert pro tier templates
INSERT INTO public.templates (name, description, preview_text, category, tier)
VALUES 
  ('Story-Based Narrative', 'Engage with a compelling story format', 'Meet [character]. They struggled with [problem] until they discovered [product].', 'story', 'pro'),
  ('Interactive Quiz', 'Engage users with an interactive element', 'Find out which [product] is right for you with our 30-second quiz.', 'interactive', 'pro'),
  ('Industry-Specific', 'Templates tailored to your specific industry', 'The only [industry-specific product] designed by [industry professionals].', 'industry', 'pro'),
  ('Video Script', 'Ready-to-use scripts for video ads', '[Opening hook]: Are you tired of [problem]? [Solution]: Our [product] can help.', 'video', 'pro'),
  ('Social Proof Bundle', 'Combine reviews, testimonials, and case studies', 'Join over [number] satisfied customers who''ve achieved [benefit] with [product].', 'social-proof', 'pro'); 