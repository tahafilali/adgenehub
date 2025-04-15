"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, PenLine, Sparkles, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  target_audience: string | null;
  product_description: string | null;
  tone: string | null;
  status: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview_text: string;
  category: string;
  tier: string;
}

export default function GenerateAdsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const [customAdContent, setCustomAdContent] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [seedingTemplates, setSeedingTemplates] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        setLoading(true);
        const response = await fetch(`/api/campaigns/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }
        
        const data = await response.json();
        setCampaign(data.campaign);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Could not load campaign details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCampaign();
  }, [params.id]);

  useEffect(() => {
    // Fetch available templates
    async function fetchTemplates() {
      try {
        setTemplatesLoading(true);
        const response = await fetch('/api/templates?tier=basic');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0) {
          setSelectedTemplateId(data.templates[0].id);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplateError('Failed to load templates. You may need to seed the database first.');
      } finally {
        setTemplatesLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  async function seedTemplates() {
    try {
      setSeedingTemplates(true);
      setTemplateError(null);
      
      const toastId = toast.loading("Creating template database...");
      
      const response = await fetch('/api/templates/seed', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to seed templates');
      }
      
      const data = await response.json();
      toast.success("Templates created successfully!", { id: toastId });
      
      // Re-fetch templates
      setTemplatesLoading(true);
      const templatesResponse = await fetch('/api/templates?tier=basic');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
        if (templatesData.templates && templatesData.templates.length > 0) {
          setSelectedTemplateId(templatesData.templates[0].id);
        }
      }
    } catch (error) {
      console.error('Error seeding templates:', error);
      setTemplateError(error instanceof Error ? error.message : 'Failed to seed templates');
      toast.error("Failed to create templates");
    } finally {
      setSeedingTemplates(false);
      setTemplatesLoading(false);
    }
  }

  const handleGenerateAds = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template first");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Show a loading toast
      const toastId = toast.loading(`Generating ads from template...`);
      
      const response = await fetch(`/api/campaigns/${params.id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate ads');
      }
      
      const data = await response.json();
      
      // Update the toast to success
      toast.success(`Successfully generated ${data.ads?.length || 0} ads!`, {
        id: toastId,
        description: "View your new ads in the campaign details"
      });
      
      // Redirect to campaign details to see the ads
      router.push(`/dashboard/campaigns/${params.id}`);
    } catch (err) {
      console.error('Error generating ads:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Failed to generate ads: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleCreateCustomAd = async () => {
    // Validate input
    if (!customAdContent.trim()) {
      toast.error("Please enter ad content");
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      // Show a loading toast
      const toastId = toast.loading("Creating custom ad...");
      
      const response = await fetch(`/api/campaigns/${params.id}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_text: customAdContent }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ad');
      }
      
      // Update the toast to success
      toast.success("Custom ad created successfully!", {
        id: toastId,
        description: "View your new ad in the campaign details"
      });
      
      // Redirect to campaign details to see the ad
      router.push(`/dashboard/campaigns/${params.id}`);
    } catch (err) {
      console.error('Error creating ad:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Failed to create ad: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <div className="bg-muted h-7 w-48 rounded-md animate-pulse mb-2"></div>
              <div className="bg-muted h-5 w-96 rounded-md animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted h-16 rounded-md animate-pulse"></div>
              <div className="bg-muted h-16 rounded-md animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold ml-4">Generate Ads for {campaign?.name}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="ai">
          <TabsList className="mb-6">
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generated Ads
            </TabsTrigger>
            <TabsTrigger value="custom">
              <PenLine className="h-4 w-4 mr-2" />
              Custom Ad
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>Generate AI-Powered Ads</CardTitle>
                <CardDescription>
                  Create optimized ad variations based on your campaign information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {templateError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-6">
                    {templateError}
                    <div className="mt-2">
                      <Button onClick={seedTemplates} disabled={seedingTemplates}>
                        {seedingTemplates ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating templates...
                          </>
                        ) : (
                          'Create Template Database'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="template">Ad Template</Label>
                  <Select 
                    value={selectedTemplateId} 
                    onValueChange={setSelectedTemplateId}
                    disabled={templatesLoading || templates.length === 0}
                  >
                    <SelectTrigger id="template" className="w-full">
                      <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select a template"} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplateId && templates.find(t => t.id === selectedTemplateId) && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="text-sm italic">
                        {templates.find(t => t.id === selectedTemplateId)?.preview_text}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="count">Number of Variations</Label>
                  <Select value={String(count)} onValueChange={(value) => setCount(Number(value))}>
                    <SelectTrigger id="count">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 variation</SelectItem>
                      <SelectItem value="2">2 variations</SelectItem>
                      <SelectItem value="3">3 variations</SelectItem>
                      <SelectItem value="5">5 variations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Campaign Information</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Product/Service:</span>{" "}
                      {campaign?.product_description || "Not specified"}
                    </div>
                    <div>
                      <span className="font-semibold">Target Audience:</span>{" "}
                      {campaign?.target_audience || "Not specified"}
                    </div>
                    <div>
                      <span className="font-semibold">Tone:</span>{" "}
                      {campaign?.tone || "Professional"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleGenerateAds}
                  disabled={generating || !selectedTemplateId || templates.length === 0}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Ads
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Create Custom Ad</CardTitle>
                <CardDescription>
                  Write your own ad content manually.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ad-content">Ad Content</Label>
                    <Textarea
                      id="ad-content"
                      placeholder="Enter your ad content here..."
                      className="min-h-[200px]"
                      value={customAdContent}
                      onChange={(e) => setCustomAdContent(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCreateCustomAd}
                  disabled={creating || !customAdContent.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Custom Ad"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 