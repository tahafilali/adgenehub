"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Lock, Search, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  preview_text: string;
  category: string | null;
  tier: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Check user's subscription tier
  const isPro = user?.subscriptionTier === "pro";
  const isStarter = user?.subscriptionTier === "starter";
  const isFree = !isPro && !isStarter;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add search parameter if needed, but don't filter by tier in the API request
        let url = '/api/templates';
        const params = new URLSearchParams();
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch templates');
        }
        
        const data = await response.json();
        setAllTemplates(data.templates || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [searchQuery]); // Only refetch when search query changes, not when tab changes

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (user) {
        try {
          const response = await fetch('/api/campaigns');
          if (response.ok) {
            const { campaigns } = await response.json();
            setCampaigns(campaigns);
          } else {
            console.error('Failed to fetch campaigns');
          }
        } catch (error) {
          console.error('Error fetching campaigns:', error);
        }
      }
    };

    fetchCampaigns();
  }, [user]);
  
  // Filter templates based on search query and tab
  const filterTemplates = (templates: Template[], tier: string) => {
    return templates.filter((template) => template.tier === tier);
  };
  
  // Get templates for each tier by filtering the full list
  const basicTemplates = filterTemplates(allTemplates, 'basic');
  const starterTemplates = filterTemplates(allTemplates, 'starter');
  const proTemplates = filterTemplates(allTemplates, 'pro');
  
  // Helper for rendering empty states
  const renderEmptyState = (message: string) => (
    <p className="text-center py-8 text-muted-foreground">{message}</p>
  );

  // Function to render template cards  
  const renderTemplateCard = (template: Template, isLocked = false) => (
    <Card key={template.id} className={`p-4 relative border ${isLocked ? 'opacity-70' : ''}`}>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-medium text-md mb-1">{template.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
      <div className="bg-muted p-3 rounded-md text-sm mb-3">
        <p className="italic">{template.preview_text}</p>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
          {template.category}
        </span>
        <DropdownMenu >
          <DropdownMenuContent>
            {campaigns.length === 0 ? (
              <DropdownMenuItem disabled>No campaigns available</DropdownMenuItem>
            ) : (
              campaigns.map((campaign: any) => (
                <DropdownMenuItem key={campaign.id} asChild>
                  <Link href={`/dashboard/campaigns/${campaign.id}/ads/create?template=${template.id}`}>
                    {campaign.name}
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={isLocked || campaigns.length === 0}>
              Use Template
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">Ad Templates</h1>
          <p className="text-muted-foreground">
            Use our pre-built templates to create effective ads
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-800">
          <p>{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading templates...</span>
        </div>
      ) : (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Templates</TabsTrigger>
            <TabsTrigger value="starter" disabled={isFree}>
              Starter Templates
              {isFree && <Lock className="ml-1 h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="pro" disabled={!isPro}>
              Pro Templates
              {!isPro && <Lock className="ml-1 h-3 w-3" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            {basicTemplates.length === 0 ? (
              renderEmptyState("No templates found matching your search.")
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {basicTemplates.map((template: Template) => renderTemplateCard(template))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="starter">
            {isFree ? (
              <Card className="p-6">
                <div className="flex flex-col items-center justify-center py-10">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Starter Templates</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    Upgrade to Starter or Pro plan to access additional ad templates optimized for higher conversions.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/billing">
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              starterTemplates.length === 0 ? (
                renderEmptyState("No templates found matching your search.")
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {starterTemplates.map((template: Template) => renderTemplateCard(template))}
                </div>
              )
            )}
          </TabsContent>
          
          <TabsContent value="pro">
            {!isPro ? (
              <Card className="p-6">
                <div className="flex flex-col items-center justify-center py-10">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Pro Templates</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    Upgrade to the Pro plan to access premium ad templates with advanced features and higher conversion rates.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/billing">
                      Upgrade to Pro
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              proTemplates.length === 0 ? (
                renderEmptyState("No templates found matching your search.")
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {proTemplates.map((template: Template) => renderTemplateCard(template))}
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Preview of higher tier templates for free users */}
      {isFree && !loading && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Premium Templates (Preview)</h2>
          <p className="text-muted-foreground">
            Upgrade your plan to unlock these premium templates.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {starterTemplates.slice(0, 3).map((template: Template) => renderTemplateCard(template, true))}
          </div>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-800">
                  Unlock all premium templates
                </h3>
                <p className="text-amber-700">
                  Upgrade to Starter for 10 premium templates or Pro for 25+ advanced templates.
                </p>
              </div>
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Link href="/dashboard/billing">
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Preview of Pro templates for Starter users */}
      {isStarter && !isPro && !loading && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Pro Templates (Preview)</h2>
          <p className="text-muted-foreground">
            Upgrade to Pro to unlock these advanced templates.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proTemplates.slice(0, 3).map((template: Template) => renderTemplateCard(template, true))}
          </div>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-800">
                  Unlock all advanced templates
                </h3>
                <p className="text-amber-700">
                  Upgrade to Pro for access to all 25+ advanced templates and premium features.
                </p>
              </div>
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Link href="/dashboard/billing">
                  Upgrade to Pro
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 