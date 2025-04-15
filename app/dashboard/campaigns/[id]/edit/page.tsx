"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
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
}

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_audience: '',
    product_description: '',
    tone: 'professional'
  });
  
  const router = useRouter();
  
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
        
        // Initialize form data
        setFormData({
          name: data.campaign.name || '',
          target_audience: data.campaign.target_audience || '',
          product_description: data.campaign.product_description || '',
          tone: data.campaign.tone || 'professional'
        });
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Could not load campaign details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCampaign();
  }, [params.id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      toast.error("Campaign name is required");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Display loading toast
      const toastId = toast.loading("Saving campaign changes...");
      
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update campaign: ${response.status}`);
      }
      
      // Update toast to success
      toast.success("Campaign updated successfully", {
        id: toastId
      });
      
      // Navigate back to campaign details
      router.push(`/dashboard/campaigns/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Failed to update campaign. Please try again.');
      toast.error("Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="bg-muted h-8 w-60 rounded-md animate-pulse"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="bg-muted h-7 w-48 rounded-md animate-pulse mb-2"></div>
            <div className="bg-muted h-5 w-96 rounded-md animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-5 w-24 rounded-md animate-pulse"></div>
                <div className="bg-muted h-10 w-full rounded-md animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/campaigns')}>
              View All Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
      </div>
      
      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-6 text-destructive">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Update your campaign information to reflect your current goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Summer Sale 2023"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product_description">Product or Service Description</Label>
              <Textarea
                id="product_description"
                name="product_description"
                value={formData.product_description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe what you're promoting..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Textarea
                id="target_audience"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                rows={3}
                placeholder="Who are you targeting with this campaign?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tone">Tone of Voice</Label>
              <Select
                value={formData.tone}
                onValueChange={(value) => handleSelectChange('tone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-6 gap-3">
          <Button 
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
            {!saving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
} 