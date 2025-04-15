import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { tier, billingCycle, withTrial = false } = await request.json();
    
    // Validate required fields
    if (!tier || !billingCycle) {
      return NextResponse.json(
        { error: 'Subscription tier and billing cycle are required' },
        { status: 400 }
      );
    }
    
    // Validate tier
    if (!['starter', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier. Must be either starter or pro' },
        { status: 400 }
      );
    }
    
    // Validate cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be either monthly or yearly' },
        { status: 400 }
      );
    }
    
    // Get price ID based on tier and billingCycle
    let priceId;
    if (tier === 'starter' && billingCycle === 'monthly') {
      priceId = process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID;
    } else if (tier === 'starter' && billingCycle === 'yearly') {
      priceId = process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID;
    } else if (tier === 'pro' && billingCycle === 'monthly') {
      priceId = process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID;
    } else if (tier === 'pro' && billingCycle === 'yearly') {
      priceId = process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID;
    }
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not found for the selected tier and billing cycle' },
        { status: 400 }
      );
    }
    
    // Check if user is trying to checkout for free tier
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Cannot checkout for free tier' },
        { status: 400 }
      );
    }
    
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
    
    // Fetch user data to get or create Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, trial_end_date')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      );
    }
    
    // Check if we should add a trial period
    let trialPeriodDays = undefined;
    if (withTrial && !userData.trial_end_date) {
      trialPeriodDays = 14; // 14-day trial
    }
    
    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: userData.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      subscription_data: trialPeriodDays ? {
        trial_period_days: trialPeriodDays
      } : undefined,
      metadata: {
        userId,
        tier,
        billingCycle,
      },
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 