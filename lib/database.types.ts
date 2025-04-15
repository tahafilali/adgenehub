export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          subscription_tier: string | null
          subscription_status: string | null
          credits_used: number
          credits_limit: number
          trial_end_date: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          subscription_tier?: string | null
          subscription_status?: string | null
          credits_used?: number
          credits_limit?: number
          trial_end_date?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          subscription_tier?: string | null
          subscription_status?: string | null
          credits_used?: number
          credits_limit?: number
          trial_end_date?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          target_audience: string | null
          product_description: string | null
          tone: string | null
          status: string
          budget: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_audience?: string | null
          product_description?: string | null
          tone?: string | null
          status?: string
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_audience?: string | null
          product_description?: string | null
          tone?: string | null
          status?: string
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ads: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          content: string
          status: string
          impressions: number
          clicks: number
          conversions: number
          is_selected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          content: string
          status?: string
          impressions?: number
          clicks?: number
          conversions?: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          content?: string
          status?: string
          impressions?: number
          clicks?: number
          conversions?: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          preview_text: string
          category: string | null
          tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          preview_text: string
          category?: string | null
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          preview_text?: string
          category?: string | null
          tier?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 