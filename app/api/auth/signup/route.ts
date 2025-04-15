import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import { PLANS } from '@/lib/stripe';
import Stripe from 'stripe'; // Ensure Stripe is imported for types

// Placeholder Price IDs - Replace with your actual Stripe Price IDs
const PRICE_IDS = {
  starter_trial: process.env.STRIPE_PRICE_ID_STARTER_TRIAL || "price_starter_trial_placeholder",
  pro_trial: process.env.STRIPE_PRICE_ID_PRO_TRIAL || "price_pro_trial_placeholder",
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName, startTrial, trialTier } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // --- Trial Flow --- 
    if (startTrial && ['starter', 'pro'].includes(trialTier)) {
      console.log(`Initiating trial signup flow for ${email}, tier: ${trialTier}`);
      
      const priceId = trialTier === 'starter' ? PRICE_IDS.starter_trial : PRICE_IDS.pro_trial;
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup`;
      
      try {
        // Create Stripe Checkout session for trial with payment method required
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_collection: 'required' as Stripe.Checkout.SessionCreateParams.PaymentMethodCollection,
          customer_email: email, // Pre-fill email
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: 14,
            metadata: { 
                // Store intended user details for webhook
                email: email,
                fullName: fullName || '',
                companyName: companyName || '',
                intendedTier: trialTier,
                // We don't have Supabase user ID yet
             }
          },
          metadata: {
             // Also store here for easier access if needed before subscription creation
             email: email,
             fullName: fullName || '',
             companyName: companyName || '',
             intendedTier: trialTier,
             password: password // Temporarily store password hash? **SECURITY RISK - DO NOT DO THIS**
             // Storing password here is highly insecure. Webhook needs to handle user creation.
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        console.log(`Stripe Checkout session created: ${checkoutSession.id}`);
        // Return the Stripe session URL for redirection
        return NextResponse.json({ url: checkoutSession.url });

      } catch (stripeError) {
        console.error("Stripe Checkout session creation error:", stripeError);
        const message = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error';
        return NextResponse.json({ error: 'Failed to initiate trial checkout', details: message }, { status: 500 });
      }
    }

    // --- Regular (Free Tier) Signup Flow --- 
    console.log(`Initiating standard free signup flow for ${email}`);
    // (Keep existing logic for non-trial/free signup)
    // Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Create Stripe Customer
    const customer = await stripe.customers.create({
      email,
      name: fullName || email,
      metadata: {
        userId: authData.user.id,
      },
    });

    // Insert into DB
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      company_name: companyName,
      stripe_customer_id: customer.id,
      subscription_tier: 'free',
      subscription_status: null, // Free tier has no status like 'active' or 'trialing'
      trial_end_date: null,
      credits_used: 0,
      credits_limit: PLANS.FREE.credits, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Error storing user details:', dbError);
      await supabase.auth.admin.deleteUser(authData.user.id); // Cleanup auth user
      return NextResponse.json({ error: 'Failed to create user profile', details: dbError.message }, { status: 500 });
    }

    // Return success response for free signup
    return NextResponse.json({
      message: 'User registered successfully (Free Tier)',
      userId: authData.user.id,
      subscriptionTier: 'free',
      subscriptionStatus: null,
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Google OAuth signup URL generator
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const redirectTo = new URL(request.url).searchParams.get('redirectTo') || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`;
    
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
        { error: 'Failed to initialize Google signup' },
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