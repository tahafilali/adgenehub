-- Migration: Add Social Media Integration Tables
-- This migration adds tables for social media platform integration, token storage, and content publishing tracking.

BEGIN;

-- Table for storing social media access tokens
CREATE TABLE IF NOT EXISTS public.social_media_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT,
  page_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Add RLS policies to social_media_tokens
ALTER TABLE public.social_media_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for users to retrieve their own social media tokens
CREATE POLICY "Users can view their own social media tokens" ON public.social_media_tokens
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to update their own social media tokens
CREATE POLICY "Users can update their own social media tokens" ON public.social_media_tokens
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own social media tokens
CREATE POLICY "Users can insert their own social media tokens" ON public.social_media_tokens
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own social media tokens
CREATE POLICY "Users can delete their own social media tokens" ON public.social_media_tokens
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Table for tracking social media posts
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_id TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies to social_media_posts
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Policy for users to retrieve their own social media posts
CREATE POLICY "Users can view their own social media posts" ON public.social_media_posts
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own social media posts
CREATE POLICY "Users can insert their own social media posts" ON public.social_media_posts
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add columns to the ads table for media support and publishing tracking
ALTER TABLE public.ads 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS ad_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT now();

-- Create a trigger to update the last_modified_at timestamp
CREATE OR REPLACE FUNCTION update_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the ads table
DROP TRIGGER IF EXISTS update_ads_last_modified_at ON public.ads;
CREATE TRIGGER update_ads_last_modified_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified_at();

-- Create buckets for storing ad media
DO $$
BEGIN
  -- Create bucket for ad images if it doesn't exist
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('ad-images', 'ad-images', TRUE);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Bucket ad-images already exists or could not be created';
  END;

  -- Create bucket for ad videos if it doesn't exist
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('ad-videos', 'ad-videos', TRUE);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Bucket ad-videos already exists or could not be created';
  END;
END $$;

-- Create a policy for users to upload media to their own folder
DO $$
BEGIN
  -- Policy for image uploads
  BEGIN
    CREATE POLICY "Users can upload images to their own folder" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'ad-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Policy for ad-images already exists or could not be created';
  END;

  -- Policy for video uploads
  BEGIN
    CREATE POLICY "Users can upload videos to their own folder" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'ad-videos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Policy for ad-videos already exists or could not be created';
  END;
END $$;

-- Grant public read access to media in these buckets
DO $$
BEGIN
  -- Policy for reading images
  BEGIN
    CREATE POLICY "Public read access for ad images" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'ad-images');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Policy for public reading of ad-images already exists or could not be created';
  END;

  -- Policy for reading videos
  BEGIN
    CREATE POLICY "Public read access for ad videos" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'ad-videos');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Policy for public reading of ad-videos already exists or could not be created';
  END;
END $$;

COMMIT; 