"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, AlertCircle } from "lucide-react";

// Pricing plans data
const pricingPlans = [
  {
    name: "Free",
    price: 0,
    description: "Basic access to ad creation tools",
    features: [
      "5 AI ad generations/month",
      "Basic ad templates",
      "Community support",
    ],
    highlighted: false,
    credits: 5,
  },
  {
    name: "Starter",
    price: 29,
    description: "Perfect for small businesses and creators",
    features: [
      "50 AI ad generations/month",
      "All ad templates",
      "Campaign analytics",
      "Email support",
      "Ad performance tracking",
    ],
    highlighted: true,
    credits: 50,
  },
  {
    name: "Pro",
    price: 99,
    description: "Advanced features for growing businesses",
    features: [
      "Unlimited AI ad generations",
      "Custom brand voice training",
      "Advanced analytics dashboard",
      "Priority support",
      "Multi-user accounts",
      "API access",
    ],
    highlighted: false,
    credits: 999999, // Effectively unlimited
  },
];

export default function BillingPage() {
  const { user, trialDaysRemaining } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const getPlanDescription = () => {
    if (!user) return "Not subscribed";
    
    switch (user.subscriptionStatus) {
      case "trialing":
        return `Trial - ${trialDaysRemaining()} days left`;
      case "active":
        return `${user.subscriptionTier?.charAt(0).toUpperCase()}${user.subscriptionTier?.slice(1) || ""} Plan`;
      case "canceled":
        return "Canceled";
      default:
        return user.subscriptionTier === "free" ? "Free Plan" : "Not subscribed";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Current Plan</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">You are currently on the</p>
            <p className="text-xl font-bold">
              {user?.subscriptionTier
                ? `${user.subscriptionTier.charAt(0).toUpperCase()}${user.subscriptionTier.slice(1)} Plan`
                : "Free Plan"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Status: {getPlanDescription()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {user?.subscriptionStatus === "active" && (
              <Button variant="outline">
                Manage Payment Methods
              </Button>
            )}
            {user?.subscriptionStatus === "active" && (
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Credit Usage */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Credit Usage</h3>
          <div className="bg-muted/30 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span>Used</span>
              <span>{user?.creditsUsed || 0} / {user?.creditsLimit || 0} credits</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-2 bg-primary rounded-full"
                style={{ 
                  width: `${user?.creditsLimit ? Math.min(100, (user.creditsUsed / user.creditsLimit) * 100) : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Credits reset at the beginning of each billing cycle.
            </p>
          </div>
        </div>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-medium">Available Plans</h2>
          <div className="flex items-center p-1 border rounded-md">
            <button
              className={`px-3 py-1 text-sm rounded ${
                billingCycle === "monthly" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                billingCycle === "yearly" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly (20% off)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name}
              className={`p-6 border ${plan.highlighted ? 'border-primary' : ''}`}
            >
              <div className="space-y-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground ml-1">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
                
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={user?.subscriptionTier === plan.name.toLowerCase()}
                >
                  {user?.subscriptionTier === plan.name.toLowerCase()
                    ? "Current Plan"
                    : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Payment History</h2>
        {user?.subscriptionStatus === "active" ? (
          <div className="border rounded-md divide-y">
            <div className="p-4 text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {user.subscriptionTier?.charAt(0).toUpperCase()}
                    {user.subscriptionTier?.slice(1)} Plan - Monthly Subscription
                  </p>
                  <p className="text-muted-foreground">Apr 1, 2023</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${user.subscriptionTier === "starter" ? 29 : 99}</p>
                  <p className="text-green-600">Paid</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="mx-auto h-12 w-12 mb-3 text-muted-foreground/60" />
            <p>No payment history available</p>
            <p className="text-sm">Payment records will appear here once you subscribe to a paid plan.</p>
          </div>
        )}
      </Card>

      {/* Cancellation Policy */}
      <Card className="p-6 bg-muted/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <h3 className="font-medium mb-1">Cancellation Policy</h3>
            <p className="text-sm text-muted-foreground">
              You can cancel your subscription at any time. Your plan will remain active until the end of your current billing period.
              After that, your account will revert to the Free tier with limited features.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 