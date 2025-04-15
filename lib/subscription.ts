/**
 * Subscription and pricing tiers for AdGenie
 */

export type SubscriptionTier = 'free' | 'premium' | 'business';

export interface TierLimits {
  maxCampaigns: number;
  adsPerCampaign: number;
  geminiFeatures: 'basic' | 'advanced';
  chatSupport: boolean;
  phoneSupport: boolean;
  adsScheduling: boolean;
  teamAccess: boolean;
  features: string[];
}

// Define the limits and features for each subscription tier
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxCampaigns: 5,
    adsPerCampaign: 2,
    geminiFeatures: 'basic',
    chatSupport: false,
    phoneSupport: false,
    adsScheduling: false,
    teamAccess: false,
    features: [
      '5 campaigns',
      '2 ads by campaign',
      'Access to templates',
      'Access to basic Gemini features'
    ]
  },
  premium: {
    maxCampaigns: 50,
    adsPerCampaign: 10,
    geminiFeatures: 'advanced',
    chatSupport: true,
    phoneSupport: false,
    adsScheduling: true,
    teamAccess: false,
    features: [
      '50 campaigns',
      '10 ads by campaign',
      'Access to templates',
      'Access to advanced Gemini features',
      'Chat support',
      'Ads scheduling'
    ]
  },
  business: {
    maxCampaigns: Infinity, // unlimited
    adsPerCampaign: Infinity, // unlimited
    geminiFeatures: 'advanced',
    chatSupport: true,
    phoneSupport: true,
    adsScheduling: true,
    teamAccess: true,
    features: [
      'Unlimited campaigns',
      'Unlimited ads',
      'Access to templates',
      'Access to advanced Gemini features',
      'Chat and phone support',
      'Ads scheduling',
      'Team access'
    ]
  }
};

/**
 * Get the campaign limit for a specific subscription tier
 */
export function getCampaignLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].maxCampaigns;
}