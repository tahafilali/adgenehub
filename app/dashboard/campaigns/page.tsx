"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Zap, Calendar, Users, FileText, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteCampaignDialog } from '@/components/ui/delete-campaign-dialog';
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  target_audience: string | null;
  product_description: string | null;
  tone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
  budget?: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error(`Error fetching campaigns: ${response.status}`);
      }
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting campaign: ${response.status}`);
      }
      
      // Filter out the deleted campaign
      setCampaigns(campaigns.filter(campaign => campaign.id !== id));
      toast.success("Campaign deleted successfully");
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      setError('Failed to delete campaign. Please try again.');
      toast.error("Failed to delete campaign");
      throw err; // Re-throw so the dialog can handle the error
    }
  };

  // Function to get the status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'paused':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch {
      // Return original string if date parsing fails
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage and create ad campaigns for your business
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/campaigns/new')} size="lg" className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Campaign
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-6 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="border rounded-xl p-6 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="bg-muted h-7 w-48 rounded mb-4"></div>
                  <div className="bg-muted h-4 w-32 rounded mb-6"></div>
                </div>
                <div className="bg-muted h-6 w-24 rounded"></div>
              </div>
              <div className="bg-muted h-4 w-full rounded mb-2"></div>
              <div className="bg-muted h-4 w-2/3 rounded mb-6"></div>
              <div className="flex justify-between mt-6">
                <div className="bg-muted h-9 w-24 rounded"></div>
                <div className="bg-muted h-9 w-24 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/10">
          <div className="max-w-md mx-auto">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-8 mx-auto max-w-sm">
              Create your first campaign to start generating professional ad content for your business
            </p>
            <Button onClick={() => router.push('/dashboard/campaigns/new')} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Campaign
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="overflow-hidden hover:shadow-md transition-shadow duration-200"
              onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
            >
              <div className="grid md:grid-cols-[1fr,auto] cursor-pointer">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <CardDescription className="mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          Created {formatDate(campaign.created_at)}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2 text-sm">
                      {campaign.product_description && (
                        <p className="line-clamp-2 text-muted-foreground">
                          {campaign.product_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-4">
                        {campaign.target_audience && (
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="line-clamp-1">{campaign.target_audience}</span>
                          </div>
                        )}
                        {campaign.tone && (
                          <div className="flex items-center text-muted-foreground">
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="capitalize">{campaign.tone}</span>
                          </div>
                        )}
                        {campaign.budget && (
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>${campaign.budget}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
                <div className="flex flex-row md:flex-col justify-end items-center gap-2 p-4 md:border-l md:bg-muted/5" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/campaigns/${campaign.id}/generate`);
                    }}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" /> Generate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/campaigns/${campaign.id}/edit`);
                    }}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <DeleteCampaignDialog
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 