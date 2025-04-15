import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { PLANS } from '@/lib/stripe'; // Assuming PLANS includes credit limits

// Get the webhook secret from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable Next.js body parsing for this route, as we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  if (!req.body) {
    return NextResponse.json({ error: 'Webhook error: Missing request body' }, { status: 400 });
  }
  
  // Read body as text for signature verification
  const rawBody = await req.text(); 
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    // Verify using the raw text body
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
    console.log(`Webhook received: ${event.type}`);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err);
    const message = err instanceof Error ? err.message : 'Unknown signature verification error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the specific event type
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Handling checkout.session.completed');
      // TODO: Implement user creation logic here
      await handleCheckoutSessionCompleted(session);
      break;

    // Handle subscription updates - status changes, plan changes, etc.
    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`Handling subscription update: ${subscriptionUpdated.id}`);
      await handleSubscriptionUpdate(subscriptionUpdated);
      break;
      
    // Handle subscription cancellations and expirations
    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`Handling subscription deletion: ${subscriptionDeleted.id}`);
      await handleSubscriptionDelete(subscriptionDeleted);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

// --- Handler Functions ---

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed for customer: ${session.customer}, email: ${session.customer_email}`);
  // Metadata should contain the details we passed during session creation
  const metadata = session.metadata;
  const subscription = session.subscription 
    ? await stripe.subscriptions.retrieve(session.subscription as string) 
    : null;

  if (!metadata || !metadata.email) {
    console.error('Required metadata missing from checkout session:', session.id);
    return;
  }
  
  const email = metadata.email;
  const fullName = metadata.fullName || '';
  const companyName = metadata.companyName || '';
  const intendedTier = (metadata.intendedTier || 'starter') as 'starter' | 'pro';
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string || null;
  
  const supabase = createSupabaseAdmin();

  // 1. Check if user already exists (in case of webhook retries)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    console.log(`User ${email} already exists, updating Stripe info.`);
    // Update Stripe customer/subscription ID
    const updateData: {
      stripe_customer_id: string;
      updated_at: string;
      stripe_subscription_id?: string | null;
      subscription_tier?: 'free' | 'starter' | 'pro';
      subscription_status?: string | null;
      billing_cycle?: 'monthly' | 'yearly' | null;
      credits_limit?: number;
      trial_end_date?: string | null;
    } = {
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString()
    };
    
    // Only add subscription data if it exists
    if (stripeSubscriptionId) {
      updateData.stripe_subscription_id = stripeSubscriptionId;
      
      // Update subscription details if subscription exists
      if (subscription) {
        const subscriptionItems = subscription.items.data;
        if (subscriptionItems && subscriptionItems.length > 0) {
          // Determine the tier based on price ID
          const priceId = subscriptionItems[0].price.id;
          let tier: 'free' | 'starter' | 'pro' = 'free';
          let billingCycle: 'monthly' | 'yearly' | null = null;
          
          // Check monthly prices
          if (priceId === process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID) {
            tier = 'starter';
            billingCycle = 'monthly';
          } else if (priceId === process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID) {
            tier = 'pro';
            billingCycle = 'monthly';
          }
          // Check yearly prices
          else if (priceId === process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID) {
            tier = 'starter';
            billingCycle = 'yearly';
          } else if (priceId === process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID) {
            tier = 'pro';
            billingCycle = 'yearly';
          }
          
          // Add subscription details to update data
          updateData.subscription_tier = tier;
          updateData.subscription_status = subscription.status;
          updateData.billing_cycle = billingCycle;
          updateData.credits_limit = tier === 'starter' 
            ? PLANS.STARTER.credits 
            : tier === 'pro' 
              ? PLANS.PRO.credits 
              : PLANS.FREE.credits;
              
          // Add trial end date if applicable
          if (subscription.trial_end) {
            updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
          }
        }
      }
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', existingUser.id);
      
    if (updateError) {
      console.error(`Error updating existing user ${existingUser.id} with Stripe info:`, updateError);
    } else {
      console.log(`Successfully updated user ${existingUser.id} with Stripe info`);
    }
    return;
  }

  // 2. Create Supabase Auth user
  console.log(`Creating Supabase Auth user for ${email}`);
  
  // Generate a secure random password since we don't have the user's password
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword, // Use temporary random password
    email_confirm: true, // Auto-confirm email
    user_metadata: { 
      full_name: fullName,
      needs_password_reset: true // Flag to force password reset on login
    }
  });

  if (authError || !authData.user) {
    console.error(`Error creating Supabase Auth user for ${email}:`, authError);
    return;
  }
  console.log(`Supabase Auth user created: ${authData.user.id}`);

  // 3. Create record in public.users table
  const timestamp = new Date().toISOString();
  
  // Determine subscription details
  let subStatus: string | null = null;
  let trialEndDate: string | null = null;
  let tier: 'free' | 'starter' | 'pro' = 'free';
  let billingCycle: 'monthly' | 'yearly' | null = null;
  
  if (subscription) {
    subStatus = subscription.status as string;
    if (subscription.trial_end) {
      trialEndDate = new Date(subscription.trial_end * 1000).toISOString();
    }
    
    // Determine tier from subscription items
    const subscriptionItems = subscription.items.data;
    if (subscriptionItems && subscriptionItems.length > 0) {
      const priceId = subscriptionItems[0].price.id;
      
      // Check monthly prices
      if (priceId === process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID) {
        tier = 'starter';
        billingCycle = 'monthly';
      } else if (priceId === process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID) {
        tier = 'pro';
        billingCycle = 'monthly';
      }
      // Check yearly prices
      else if (priceId === process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID) {
        tier = 'starter';
        billingCycle = 'yearly';
      } else if (priceId === process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID) {
        tier = 'pro';
        billingCycle = 'yearly';
      }
    }
  } else {
    // If no subscription, use the intended tier from metadata
    tier = intendedTier;
  }
  
  // Get credit limit based on tier
  const creditsLimit = tier === 'starter' 
    ? PLANS.STARTER.credits 
    : tier === 'pro' 
      ? PLANS.PRO.credits 
      : PLANS.FREE.credits;

  console.log(`Creating user record in DB for ${authData.user.id} with ${tier} tier`);
  const { error: dbError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    company_name: companyName,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    subscription_tier: tier,
    subscription_status: subStatus,
    billing_cycle: billingCycle,
    trial_end_date: trialEndDate,
    credits_used: 0,
    credits_limit: creditsLimit, 
    created_at: timestamp,
    updated_at: timestamp,
  });

  if (dbError) {
    console.error(`Error creating user record in DB for ${authData.user.id}:`, dbError);
    // Attempt cleanup of auth user on failure
    await supabase.auth.admin.deleteUser(authData.user.id);
    return;
  }

  console.log(`Successfully created user ${email} with ${tier} tier`);
  
  // Generate a password reset link for the user to set their own password
  try {
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    
    if (resetError) {
      console.error(`Error generating password reset link for ${email}:`, resetError);
    } else {
      console.log(`Password reset link generated for ${email}`);
      // In production, you would send this link via email
    }
  } catch (error) {
    console.error(`Error in password reset flow for ${email}:`, error);
  }
}

// Handle subscription updates (plan changes, status changes)
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`Processing subscription update for: ${subscription.id}`);
  
  // Get customer ID from the subscription
  const customerId = subscription.customer as string;
  
  // Initialize Supabase admin client
  const supabase = createSupabaseAdmin();
  
  // Find the user with this Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, subscription_tier, subscription_status, billing_cycle')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (userError || !user) {
    console.error(`User not found for Stripe customer: ${customerId}`, userError);
    return;
  }
  
  // Get subscription details including items (plan)
  const subscriptionItems = subscription.items.data;
  if (!subscriptionItems || subscriptionItems.length === 0) {
    console.error(`No subscription items found for subscription: ${subscription.id}`);
    return;
  }
  
  // Determine the new subscription tier based on price ID
  const priceId = subscriptionItems[0].price.id;
  let newTier: 'free' | 'starter' | 'pro' = 'free';
  let billingCycle: 'monthly' | 'yearly' | null = null;
  
  // Check monthly prices
  if (priceId === process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID) {
    newTier = 'starter';
    billingCycle = 'monthly';
  } else if (priceId === process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID) {
    newTier = 'pro';
    billingCycle = 'monthly';
  }
  // Check yearly prices
  else if (priceId === process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID) {
    newTier = 'starter';
    billingCycle = 'yearly';
  } else if (priceId === process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID) {
    newTier = 'pro';
    billingCycle = 'yearly';
  }
  
  // Get new credit limit based on tier
  const newCreditLimit = newTier === 'starter' 
    ? PLANS.STARTER.credits 
    : newTier === 'pro' 
      ? PLANS.PRO.credits 
      : PLANS.FREE.credits;
  
  // Determine trial end date if applicable
  let trialEndDate: string | null = null;
  if (subscription.trial_end) {
    trialEndDate = new Date(subscription.trial_end * 1000).toISOString();
  }
  
  // Determine the new subscription status
  const newStatus = subscription.status as 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
  
  console.log(`Updating user ${user.id} to ${newTier} tier (${newStatus})`);
  
  // Update the user record
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: newTier,
      subscription_status: newStatus,
      billing_cycle: billingCycle,
      credits_limit: newCreditLimit,
      trial_end_date: trialEndDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
    
  if (updateError) {
    console.error(`Error updating user ${user.id} subscription:`, updateError);
    return;
  }
  
  console.log(`Successfully updated subscription for user ${user.id} to ${newTier} (${newStatus})`);
  
  // TODO: Consider sending an email notification about the subscription change
}

// Handle subscription deletions/cancellations
async function handleSubscriptionDelete(subscription: Stripe.Subscription) {
  console.log(`Processing subscription deletion for: ${subscription.id}`);
  
  // Get customer ID from the subscription
  const customerId = subscription.customer as string;
  
  // Initialize Supabase admin client
  const supabase = createSupabaseAdmin();
  
  // Find the user with this Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (userError || !user) {
    console.error(`User not found for Stripe customer: ${customerId}`, userError);
    return;
  }
  
  console.log(`Downgrading user ${user.id} to free tier due to subscription cancellation`);
  
  // Update the user record - downgrade to free tier
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      billing_cycle: null,
      credits_limit: PLANS.FREE.credits,
      trial_end_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
    
  if (updateError) {
    console.error(`Error downgrading user ${user.id} to free tier:`, updateError);
    return;
  }
  
  console.log(`Successfully downgraded user ${user.id} to free tier`);
  
  // TODO: Consider sending an email notification about the cancellation
} 