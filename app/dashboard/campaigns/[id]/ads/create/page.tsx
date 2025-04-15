import { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase-server';
import { CreateAdForm } from '@/components/ads/CreateAdForm';
import { TemplateSelector } from '@/components/TemplateSelector';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

// Import any needed types
import type { Template } from '@/lib/types';

interface AdCreatePageProps {
  params: {
    id: string;
  };
}

export default async function AdCreatePage({ params }: AdCreatePageProps) {
  const supabase = createServerComponentClient();
  
  // Fetch campaign data to verify it exists and to get its name
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', params.id)
    .single();
  
  if (error || !campaign) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Campaign Not Found</h1>
        <p>The campaign you're trying to access doesn't exist or you don't have permission to view it.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/campaigns">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href={`/dashboard/campaigns/${params.id}`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Campaign
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create New Ad</h1>
          <p className="text-gray-500 mt-1">Campaign: {campaign.name}</p>
        </div>
      </div>
      
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="templates">Use a Template</TabsTrigger>
          <TabsTrigger value="custom">Create Custom Ad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
            <p className="text-gray-500 mb-6">
              Templates help you create effective ads quickly. Select a template that matches your needs.
            </p>
            
            <Suspense fallback={<div>Loading templates...</div>}>
              <ClientTemplateSelector campaignId={params.id} />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create Custom Ad</h2>
            <p className="text-gray-500 mb-6">
              Create a custom ad from scratch. You'll be able to specify all details manually.
            </p>
            
            <Suspense fallback={<div>Loading form...</div>}>
              <CreateAdForm campaignId={params.id} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Client component that loads the template selector
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ClientTemplateSelector({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };
  
  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsCreating(true);
    
    try {
      // Create a new ad using the selected template
      const response = await fetch(`/api/campaigns/${campaignId}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_text: selectedTemplate.preview_text,
          name: `Ad based on ${selectedTemplate.name}`,
          template_id: selectedTemplate.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create ad');
      }
      
      const { ad } = await response.json();
      
      toast.success('Ad created successfully!');
      
      // Redirect to the edit page for the new ad
      router.push(`/dashboard/campaigns/${campaignId}/ads/${ad.id}`);
    } catch (error) {
      console.error('Error creating ad from template:', error);
      toast.error('Failed to create ad. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <TemplateSelector onSelectTemplate={handleTemplateSelect} />
      
      {selectedTemplate && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-lg mb-2">Selected Template: {selectedTemplate.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>
          
          <div className="bg-white p-3 rounded border mb-4">
            <p className="font-mono text-sm">{selectedTemplate.preview_text}</p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleUseTemplate} 
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Use This Template'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 