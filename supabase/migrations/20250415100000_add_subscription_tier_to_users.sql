-- supabase/migrations/20250415100000_add_subscription_tier_to_users.sql

-- Add the subscription_tier column to the users table
ALTER TABLE users
ADD COLUMN subscription_tier TEXT DEFAULT 'free';