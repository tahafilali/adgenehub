import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe for server-side operations
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore - API version string compatibility issue
  apiVersion: '2023-10-16',
});

// For client-side operations like redirecting to checkout
// @ts-ignore - Type compatibility between browser and server Stripe
let stripePromise: any;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Define subscription pricing plans
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '5 AI ad generations/month',
      'Basic ad templates',
      'Community support',
    ],
    credits: 5,
  },
  STARTER: {
    name: 'Starter',
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STARTER_MONTHLY_PRICE_ID,
      price: 29,
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STARTER_YEARLY_PRICE_ID,
      price: 290, // 2 months free with yearly billing
    },
    features: [
      '50 AI ad generations/month',
      'All ad templates',
      'Campaign analytics',
      'Email support',
      'Ad performance tracking',
    ],
    credits: 50,
  },
  PRO: {
    name: 'Pro',
    monthly: {
      priceId: process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID,
      price: 99,
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID,
      price: 990, // 2 months free with yearly billing
    },
    features: [
      'Unlimited AI ad generations',
      'Custom brand voice training',
      'Advanced analytics dashboard',
      'Priority support',
      'Multi-user accounts',
      'API access',
    ],
    credits: 999999, // Effectively unlimited
  },
};

// Helper function to check if a user has enough credits
export const hasEnoughCredits = (
  creditsUsed: number, 
  creditsLimit: number
): boolean => {
  return creditsUsed < creditsLimit;
};

// Helper function to determine what features a user can access based on their subscription tier
export const canAccessFeature = (
  feature: string,
  subscriptionTier: 'free' | 'starter' | 'pro' | null
): boolean => {
  if (!subscriptionTier) return false;
  
  const featureTiers: Record<string, ('free' | 'starter' | 'pro')[]> = {
    'basic_templates': ['free', 'starter', 'pro'],
    'advanced_templates': ['starter', 'pro'],
    'campaign_analytics': ['starter', 'pro'],
    'performance_tracking': ['starter', 'pro'],
    'brand_voice_training': ['pro'],
    'advanced_analytics': ['pro'],
    'multi_user': ['pro'],
    'api_access': ['pro'],
  };
  
  const requiredTiers = featureTiers[feature] || [];
  return requiredTiers.includes(subscriptionTier);
}; 