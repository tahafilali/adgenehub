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
          product_description: string | null;
          tone: string | null;
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
          product_description?: string | null;
          tone?: string | null;
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
          product_description?: string | null;
          tone?: string | null;
          budget?: number | null;
          impressions?: number;
          clicks?: number;
          conversions?: number;
        };
      };
      ads: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          content: string;
          status: string;
          impressions: number;
          clicks: number;
          conversions: number;
          is_selected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          content: string;
          status?: string;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          is_selected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string;
          content?: string;
          status?: string;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          is_selected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          preview_text: string;
          category: string | null;
          tier: 'basic' | 'starter' | 'pro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          preview_text: string;
          category?: string | null;
          tier?: 'basic' | 'starter' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          preview_text?: string;
          category?: string | null;
          tier?: 'basic' | 'starter' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
  };
};

export type User = Database['public']['Tables']['users']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Ad = Database['public']['Tables']['ads']['Row'];
export type Template = Database['public']['Tables']['templates']['Row'];

// Type for the user's subscription tier
export type UserTier = 'basic' | 'starter' | 'pro';

// Type for ad generation parameters
export interface GenerationParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Type for ad generation results
export interface GenerationResult {
  text: string;
  status: 'success' | 'error';
  error?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Type for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// Social media related types
export interface SocialMediaToken {
  id: string;
  user_id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface SocialMediaPost {
  id: string;
  ad_id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  post_id: string;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}

export interface PublishRequest {
  platforms: ('facebook' | 'twitter' | 'linkedin' | 'instagram')[];
  scheduledTime?: string; // ISO date string for scheduled posting
} 