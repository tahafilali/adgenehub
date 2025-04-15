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
    
    // Query the users table to check trial details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier, trial_end_date')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      );
    }
    
    // Check if user is in trial
    const isInTrial = userData.subscription_status === 'trialing' && userData.trial_end_date;
    
    if (!isInTrial) {
      return NextResponse.json({
        isInTrial: false,
        message: 'User is not currently in a trial period'
      });
    }
    
    // Calculate days remaining
    const trialEndDate = new Date(userData.trial_end_date);
    const today = new Date();
    const diffTime = trialEndDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    return NextResponse.json({
      isInTrial: true,
      trialTier: userData.subscription_tier,
      trialEndDate: userData.trial_end_date,
      daysRemaining,
      formattedEndDate: trialEndDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    });
  } catch (error) {
    console.error('Trial details error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 