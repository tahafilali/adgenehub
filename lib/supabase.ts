import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// For server components and API routes
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// For server components (with cookies)
export const createSupabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const cookieStore = cookies();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
};

// For client components
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Type definitions for our Supabase database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          company_name: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | null;
          subscription_tier: 'free' | 'starter' | 'pro' | null;
          billing_cycle: 'monthly' | 'yearly' | null;
          trial_end_date: string | null;
          credits_used: number;
          credits_limit: number;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          company_name?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | null;
          subscription_tier?: 'free' | 'starter' | 'pro' | null;
          billing_cycle?: 'monthly' | 'yearly' | null;
          trial_end_date?: string | null;
          credits_used?: number;
          credits_limit?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          company_name?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | null;
          subscription_tier?: 'free' | 'starter' | 'pro' | null;
          billing_cycle?: 'monthly' | 'yearly' | null;
          trial_end_date?: string | null;
          credits_used?: number;
          credits_limit?: number;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          name: string;
          status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          start_date: string | null;
          end_date: string | null;
          target_audience: string | null;
          platform: string | null;
          budget: number | null;
          impressions: number;
          clicks: number;
          conversions: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          start_date?: string | null;
          end_date?: string | null;
          target_audience?: string | null;
          platform?: string | null;
          budget?: number | null;
          impressions?: number;
          clicks?: number;
          conversions?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          start_date?: string | null;
          end_date?: string | null;
          target_audience?: string | null;
          platform?: string | null;
          budget?: number | null;
          impressions?: number;
          clicks?: number;
          conversions?: number;
        };
      };
      ad_content: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          content_type: 'headline' | 'description' | 'image_prompt' | 'full_ad';
          content: string;
          is_ai_generated: boolean;
          performance_score: number | null;
          variant: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          content_type: 'headline' | 'description' | 'image_prompt' | 'full_ad';
          content: string;
          is_ai_generated?: boolean;
          performance_score?: number | null;
          variant?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          content_type?: 'headline' | 'description' | 'image_prompt' | 'full_ad';
          content?: string;
          is_ai_generated?: boolean;
          performance_score?: number | null;
          variant?: string | null;
        };
      };
    };
  };
}; 