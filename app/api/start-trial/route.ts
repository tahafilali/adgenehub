import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { trialTier, billingCycle } = await request.json();
    
    // Validate required fields
    if (!trialTier) {
      return NextResponse.json(
        { error: 'Trial tier is required' },
        { status: 400 }
      );
    }
    
    // Validate tier
    if (!['starter', 'pro'].includes(trialTier)) {
      return NextResponse.json(
        { error: 'Invalid trial tier. Must be either starter or pro' },
        { status: 400 }
      );
    }
    
    // Validate cycle
    if (billingCycle && !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be either monthly or yearly' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const supabase = createSupabaseAdmin();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the user is eligible for a trial
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_tier, trial_end_date')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      );
    }
    
    // Check if the user already had a trial
    if (userData.trial_end_date) {
      return NextResponse.json(
        { error: 'User has already used their free trial' },
        { status: 400 }
      );
    }
    
    // Check if user is on free tier (can't start trial from paid tier)
    if (userData.subscription_tier !== 'free') {
      return NextResponse.json(
        { error: 'Only users on the free tier can start a trial' },
        { status: 400 }
      );
    }
    
    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    
    // Determine credits limit based on trial tier
    const creditsLimit = trialTier === 'starter' 
      ? PLANS.STARTER.credits 
      : PLANS.PRO.credits;
    
    // Update user with trial information
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: trialTier,
        subscription_status: 'trialing',
        billing_cycle: billingCycle || 'monthly',
        trial_end_date: trialEndDate.toISOString(),
        credits_limit: creditsLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error starting trial:', updateError);
      return NextResponse.json(
        { error: 'Failed to start trial' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Trial started successfully',
      trialTier,
      trialEndDate: trialEndDate.toISOString(),
      daysRemaining: 14,
    });
  } catch (error) {
    console.error('Start trial error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 