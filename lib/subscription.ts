/**
 * Subscription and pricing tiers for AdGenie
 */

export type SubscriptionTier = 'free' | 'starter' | 'pro';

export interface TierLimits {
  maxCampaigns: number;
  monthlyCredits: number;
  templateAccess: string[];
  price: number; // monthly price in USD
  features: string[];
}

// Define the limits and features for each subscription tier
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxCampaigns: 3,
    monthlyCredits: 50,
    templateAccess: ['basic'],
    price: 0,
    features: [
      'Up to 3 campaigns',
      '50 generation credits/month',
      'Access to basic templates',
      'Email support'
    ]
  },
  starter: {
    maxCampaigns: 10,
    monthlyCredits: 200,
    templateAccess: ['basic', 'starter'],
    price: 19,
    features: [
      'Up to 10 campaigns',
      '200 generation credits/month',
      'Access to starter templates',
      'Priority email support',
      'Campaign analytics'
    ]
  },
  pro: {
    maxCampaigns: 1000, // effectively unlimited
    monthlyCredits: 1000,
    templateAccess: ['basic', 'starter', 'pro'],
    price: 49,
    features: [
      'Unlimited campaigns',
      '1000 generation credits/month',
      'Access to all premium templates',
      'Priority support',
      'Advanced analytics',
      'Custom brand voice',
      'API access'
    ]
  }
};

/**
 * Check if a user has access to a specific template tier
 */
export function hasAccessToTemplateTier(userTier: SubscriptionTier, templateTier: string): boolean {
  return TIER_LIMITS[userTier].templateAccess.includes(templateTier);
}

/**
 * Get the credit limit for a specific subscription tier
 */
export function getCreditLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].monthlyCredits;
}

/**
 * Get the campaign limit for a specific subscription tier
 */
export function getCampaignLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].maxCampaigns;
}

/**
 * Calculate remaining credits
 */
export function getRemainingCredits(creditsUsed: number, creditsLimit: number): number {
  return Math.max(0, creditsLimit - creditsUsed);
}

/**
 * Format the price for display
 */
export function formatPrice(price: number): string {
  return `$${price}/month`;
}

/**
 * Get list of accessible template tiers for a user
 */
export function getAccessibleTemplateTiers(tier: SubscriptionTier): string[] {
  return TIER_LIMITS[tier].templateAccess;
} 