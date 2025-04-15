import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

// Regular email/password login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabaseAdmin();

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user details from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user profile' },
        { status: 500 }
      );
    }

    // Return success response with user details and session
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        companyName: userData.company_name,
        subscriptionTier: userData.subscription_tier,
        subscriptionStatus: userData.subscription_status,
        creditsUsed: userData.credits_used,
        creditsLimit: userData.credits_limit,
      },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Google OAuth login URL generator
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const redirectTo = new URL(request.url).searchParams.get('redirectTo') || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'email profile',
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.json(
        { error: 'Failed to initialize Google login' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 