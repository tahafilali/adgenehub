import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.cookies;
    console.log("Cookies in request:", cookies.getAll().map(c => c.name));
    
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    
    // Try to get session from the code
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    let sessionData = null;
    
    if (code) {
      console.log("Trying to exchange code for session");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Error exchanging code:", error);
      } else {
        sessionData = {
          user: data.user,
          session: {
            access_token: data.session?.access_token ? "[REDACTED]" : null,
            refresh_token: data.session?.refresh_token ? "[REDACTED]" : null,
            expires_at: data.session?.expires_at,
          }
        };
      }
    }
    
    // Get current session
    const { data: currentSession } = await supabase.auth.getSession();
    
    return NextResponse.json({
      cookies: cookies.getAll().map(c => c.name),
      sessionFromCode: sessionData,
      currentSession: currentSession.session ? {
        access_token: "[REDACTED]",
        refresh_token: "[REDACTED]",
        expires_at: currentSession.session.expires_at,
        user: {
          id: currentSession.session.user?.id,
          email: currentSession.session.user?.email,
          user_metadata: currentSession.session.user?.user_metadata
        }
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session information' },
      { status: 500 }
    );
  }
} 