import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Get the user ID from the authenticated session
    const supabase = createSupabaseAdmin();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Query the users table to check if they've ever had a trial
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, trial_end_date')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      );
    }
    
    // Check if user has ever had a trial (current or past)
    // We consider a user ineligible if they have a trial_end_date set (even in the past)
    const isEligible = !userData.trial_end_date;
    
    return NextResponse.json({
      isEligible,
      reason: isEligible ? null : 'User has already used their free trial',
    });
  } catch (error) {
    console.error('Trial eligibility check error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 