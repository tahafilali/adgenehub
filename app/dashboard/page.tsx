"use client";

import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart, PieChart, Activity, TrendingUp, FileText, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user, isUserInFreeTrial, trialDaysRemaining } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || 'User'}
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {isUserInFreeTrial() && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-800">
                You're in trial mode
              </h3>
              <p className="text-amber-700">
                {trialDaysRemaining()} days left in your trial. Upgrade to continue with full access.
              </p>
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/dashboard/billing">
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Campaign Count
              </p>
              <h3 className="font-bold text-2xl mt-1">0</h3>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">0%</span>
            <span className="ml-1">from last month</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Credits Used
              </p>
              <h3 className="font-bold text-2xl mt-1">{user?.creditsUsed || 0}</h3>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <div className="bg-muted h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full"
                style={{ width: `${user?.creditsLimit ? (user.creditsUsed / user.creditsLimit) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="mt-1">
              {user?.creditsUsed || 0} / {user?.creditsLimit || 0} credits
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Impressions
              </p>
              <h3 className="font-bold text-2xl mt-1">0</h3>
            </div>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">0%</span>
            <span className="ml-1">from last week</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </p>
              <h3 className="font-bold text-2xl mt-1">0%</h3>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">0%</span>
            <span className="ml-1">from last month</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-medium mb-4">Recent Campaigns</h3>
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaigns yet</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/dashboard/campaigns/new">
                Create Your First Campaign
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/campaigns/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Campaign
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/templates">
                <FileText className="mr-2 h-4 w-4" />
                Browse Ad Templates
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/billing">
                <Activity className="mr-2 h-4 w-4" />
                Manage Subscription
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 