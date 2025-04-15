-- Create templates table for storing ad templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_text TEXT NOT NULL,
  category TEXT,
  tier TEXT DEFAULT 'basic', -- basic, starter, pro
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for faster lookups
DROP INDEX IF EXISTS templates_tier_idx;
CREATE INDEX templates_tier_idx ON public.templates(tier);

DROP INDEX IF EXISTS templates_category_idx;
CREATE INDEX templates_category_idx ON public.templates(category);

-- Grant read permissions to authenticated users
GRANT SELECT ON public.templates TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON public.templates TO service_role;

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