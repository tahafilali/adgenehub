"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';

type GoogleAuthButtonProps = {
  mode: 'login' | 'signup';
  className?: string;
  redirectTo?: string;
};

export function GoogleAuthButton({ mode, className, redirectTo }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const buttonText = mode === 'login' ? 'Continue with Google' : 'Sign up with Google';

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Create Supabase client directly
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            flowType: 'pkce' // Match the same flow type as in auth context
          }
        }
      );
      
      // Default redirect URL for the application
      const baseRedirectTo = mode === 'login' 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` 
        : `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`;
      
      // Use provided redirectTo if available, otherwise use default
      const finalRedirectTo = redirectTo 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/${redirectTo}` 
        : baseRedirectTo;
      
      console.log(`Starting Google OAuth flow with redirect to: ${finalRedirectTo}`);
      
      // Initiate OAuth login with enhanced options
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectTo,
          scopes: 'email profile',
          queryParams: {
            // Include metadata in token for improved user creation
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('Error initiating Google auth:', error);
        throw error;
      }
      
      // Redirect to Google's OAuth flow
      if (data?.url) {
        console.log('Redirecting to Google OAuth URL');
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL returned from Supabase');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {buttonText}
        </span>
      )}
    </Button>
  );
} 