'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, CheckCircle, Edit, Loader2, RefreshCw, Trash2, Zap } from 'lucide-react';
import { toast } from "sonner";
import { DeleteAdModal } from '@/app/components/ads/DeleteAdModal';

interface Campaign {
  id: string;
  name: string;
  target_audience: string | null;
  product_description: string | null;
  tone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Ad {
  id: string;
  campaign_id: string;
  user_id: string;
  content: string;
  status: string;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingAd, setPublishingAd] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState<string | null>(null);
  const [generatingQuickAds, setGeneratingQuickAds] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<{ id: string, content?: string } | null>(null);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${params.id}`);
      if (!response.ok) {
        throw new Error(`Error fetching campaign: ${response.status}`);
      }
      const data = await response.json();
      setCampaign(data.campaign);
      setAds(data.ads || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Failed to load campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [params.id]);

  const handlePublishAd = async (adId: string) => {
    try {
      setPublishingAd(adId);
      
      // Show loading toast
      const toastId = toast.loading("Publishing ad...");
      
      const response = await fetch(`/api/campaigns/${params.id}/ads/${adId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_selected: true,
          status: 'published',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish ad');
      }

      // Update local state to reflect changes
      setAds(
        ads.map((ad) =>
          ad.id === adId
            ? { ...ad, is_selected: true, status: 'published' }
            : { ...ad, is_selected: ad.id === adId }
        )
      );
      
      // Update toast to success
      toast.success("Ad published successfully", {
        id: toastId
      });
    } catch (err) {
      console.error('Error publishing ad:', err);
      setError('Failed to publish ad. Please try again.');
      toast.error("Failed to publish ad");
    } finally {
      setPublishingAd(null);
    }
  };

  const handleDeleteAd = async (adId: string, adName?: string) => {
    // Open the delete modal instead of showing a confirm alert
    setAdToDelete({ id: adId, content: adName });
    setDeleteModalOpen(true);
  };
  
  const handleDeleteConfirmed = async () => {
    if (!adToDelete) return;
    
    try {
      setDeletingAd(adToDelete.id);
      
      // Remove the deleted ad from the state
      setAds(ads.filter((ad) => ad.id !== adToDelete.id));
      
      // Close the modal
      setDeleteModalOpen(false);
      setAdToDelete(null);
      
      // Show success toast
      toast.success("Ad deleted successfully");
    } catch (err) {
      console.error('Error deleting ad:', err);
      setError('Failed to delete ad. Please try again.');
      toast.error("Failed to delete ad");
    } finally {
      setDeletingAd(null);
    }
  };

  const handleQuickGenerateAds = async () => {
    try {
      setGeneratingQuickAds(true);
      
      // Show loading toast
      const toastId = toast.loading("Generating ads...");
      
      const response = await fetch(`/api/campaigns/${params.id}/ads?generate=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 3 }), // Generate 3 ads by default
      });

      if (!response.ok) {
        throw new Error('Failed to generate ads');
      }

      const data = await response.json();
      
      // Add the newly generated ads to the state
      if (data.ads && Array.isArray(data.ads)) {
        setAds(prevAds => [...data.ads, ...prevAds]);
      }
      
      // Update toast to success
      toast.success(`Generated ${data.ads?.length || 0} ads successfully!`, {
        id: toastId
      });
    } catch (err) {
      console.error('Error generating ads:', err);
      setError('Failed to generate ads. Please try again.');
      toast.error("Failed to generate ads");
    } finally {
      setGeneratingQuickAds(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-destructive/15 p-4 rounded-md text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => router.push('/dashboard/campaigns')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to campaigns
      </Button>

      {campaign && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <p className="text-muted-foreground">
                Created on {new Date(campaign.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push(`/dashboard/campaigns/${params.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Campaign
              </Button>
              <Button 
                onClick={() => router.push(`/dashboard/campaigns/${params.id}/generate`)}
              >
                <Zap className="h-4 w-4 mr-2" /> Generate Ads
              </Button>
            </div>
          </div>

          <Tabs defaultValue="ads" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="ads">Ad Content</TabsTrigger>
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="analytics" disabled={!ads.some(ad => ad.is_selected)}>
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ads">
              <div className="space-y-8">
                {ads.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No ads yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Generate your first ad to get started
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button 
                          onClick={handleQuickGenerateAds}
                          disabled={generatingQuickAds}
                        >
                          {generatingQuickAds ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="mr-2 h-4 w-4" />
                          )}
                          {generatingQuickAds ? "Generating..." : "Quick Generate"}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/campaigns/${params.id}/generate`)}
                        >
                          Advanced Options
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {ads.map((ad) => (
                      <Card key={ad.id} className={ad.is_selected ? 'border-primary' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {ad.is_selected && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full mr-2">
                                  Selected
                                </span>
                              )}
                              {ad.status === 'published' && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                                  Published
                                </span>
                              )}
                              Ad #{ads.findIndex((a) => a.id === ad.id) + 1}
                            </CardTitle>
                            <CardDescription>
                              Created {new Date(ad.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-serif p-4 border bg-muted/30 rounded-md">
                            {ad.content}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteAd(ad.id, ad.content?.substring(0, 30))}
                              disabled={deletingAd === ad.id}
                            >
                              {deletingAd === ad.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Delete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/dashboard/campaigns/${params.id}/ads/${ad.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          </div>
                          {(!ad.is_selected || ad.status !== 'published') && (
                            <Button 
                              size="sm"
                              onClick={() => handlePublishAd(ad.id)}
                              disabled={publishingAd === ad.id}
                            >
                              {publishingAd === ad.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : ad.is_selected ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              {ad.is_selected ? 'Publish' : 'Select & Publish'}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>
                    Details used to generate ad content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Product/Service Description</h3>
                    <p className="text-muted-foreground">
                      {campaign.product_description || 'No description provided'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-1">Target Audience</h3>
                    <p className="text-muted-foreground">
                      {campaign.target_audience || 'No target audience specified'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-1">Tone</h3>
                    <p className="text-muted-foreground capitalize">
                      {campaign.tone || 'Professional'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-1">Status</h3>
                    <p className="text-muted-foreground capitalize">
                      {campaign.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Performance metrics for your published ad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                    <p className="text-muted-foreground">
                      We&apos;re working on providing detailed analytics for your campaigns.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Delete modal */}
      {adToDelete && (
        <DeleteAdModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setAdToDelete(null);
          }}
          adId={adToDelete.id}
          adName={adToDelete.content}
          campaignId={params.id}
          onDeleted={() => {
            // Remove the deleted ad from the local state
            setAds(ads.filter(ad => ad.id !== adToDelete.id));
          }}
        />
      )}
    </div>
  );
} 