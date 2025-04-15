import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Webhook handler for Stripe events
export async function POST(request: NextRequest) {
  try {
    // Get the Stripe signature from the headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }
    
    // Get the raw body
    const rawBody = await request.text();
    
    // Verify the event
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }
    
    // Initialize Supabase admin client
    const supabase = createSupabaseAdmin();
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // If there's a subscription in the session, handle it
        if (session.subscription) {
          // Get the subscription
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Get the customer
          const customer = await stripe.customers.retrieve(
            session.customer as string
          );
          
          if (customer.deleted) {
            console.error('Customer was deleted');
            return NextResponse.json(
              { error: 'Customer was deleted' },
              { status: 400 }
            );
          }
          
          // Find the user by Stripe customer ID
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', customer.id)
            .single();
            
          if (userError || !user) {
            console.error('User not found:', userError);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
          
          // Get the subscription tier from the price ID
          let subscriptionTier = 'free';
          const priceId = subscription.items.data[0].price.id;
          
          if (priceId === process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID || 
              priceId === process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID) {
            subscriptionTier = 'starter';
          } else if (priceId === process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID || 
              priceId === process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID) {
            subscriptionTier = 'pro';
          }
          
          // Determine billing cycle
          const billingCycle = priceId === process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID || 
            priceId === process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID ? 'yearly' : 'monthly';
          
          // Determine the subscription status
          const status = subscription.status;
          
          // Determine the end date
          let endDate = null;
          if (subscription.trial_end) {
            endDate = new Date(subscription.trial_end * 1000).toISOString();
          } else if ('current_period_end' in subscription && subscription.current_period_end) {
            endDate = new Date((subscription as any).current_period_end * 1000).toISOString();
          }
          
          // Update the user in the database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_tier: subscriptionTier,
              subscription_status: status,
              billing_cycle: billingCycle,
              trial_end_date: subscription.trial_end ? endDate : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json(
              { error: 'Error updating user' },
              { status: 500 }
            );
          }
        }
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        
        // Check if there is a subscription ID in the invoice
        if (invoice.subscription) {
          const subscriptionId = invoice.subscription;
          
          // Get the subscription
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Get the customer
          const customer = await stripe.customers.retrieve(
            invoice.customer as string
          );
          
          if (customer.deleted) {
            console.error('Customer was deleted');
            return NextResponse.json(
              { error: 'Customer was deleted' },
              { status: 400 }
            );
          }
          
          // Find the user by Stripe customer ID
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', customer.id)
            .single();
            
          if (userError || !user) {
            console.error('User not found:', userError);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
          
          // Update the subscription status and end date
          const { error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json(
              { error: 'Error updating user' },
              { status: 500 }
            );
          }
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer;
        
        // Find the user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userError || !user) {
          console.error('User not found:', userError);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Check if the subscription status changed
        if (user.subscription_status !== subscription.status) {
          // Update the user in the database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json(
              { error: 'Error updating user' },
              { status: 500 }
            );
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer ID from the subscription
        const customerId = subscription.customer;
        
        // Find the user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userError || !user) {
          console.error('User not found:', userError);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Update the user in the database
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_tier: 'free',
            trial_end_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating user:', updateError);
          return NextResponse.json(
            { error: 'Error updating user' },
            { status: 500 }
          );
        }
        
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 