 import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Template } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

interface CreateAdFormProps {
  campaignId: string;
  templateId?: string | null;
  initialText?: string;
}

export function CreateAdForm({ campaignId, initialText = '' }: CreateAdFormProps) {
  const [adName, setAdName] = useState<string>('');
  const [adText, setAdText] = useState<string>(initialText);
  const [adMedia, setAdMedia] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const searchParams = useSearchParams();
  
  // Fetch template details if templateId is provided
  useEffect(() => {
    const fetchTemplate = async (templateId: string | null | undefined) => {
      if (!templateId) return;
      
      try {
        const templateResponse = await fetch(`/api/templates/${templateId}`, { next: { revalidate: 60 } });
        if (!templateResponse.ok) throw new Error('Failed to fetch template');
        
        const { template } = await templateResponse.json();
        setSelectedTemplate(template);
        
        // Pre-populate form fields if not already set
        if (template.preview_text) {
          setAdText(template.preview_text);
        }
        
        if (!adName && template.name) {
          setAdName(`Ad based on ${template.name}`);
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast.error('Failed to load template');
      }
    };

    const templateId = searchParams?.get('template');
    fetchTemplate(templateId);
  }, [searchParams, templateId]);

  const templateId = searchParams?.get('template');

  useEffect(() => {
    const templateId = searchParams?.get('template');
    if (templateId) setAdName('Ad from template'); // Set ad name if templateId exists
    console.log('templateId', templateId);
  }, [templateId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!adText.trim()) {
      toast.error('Please enter ad text');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', adName || `New Ad ${new Date().toLocaleDateString()}`);
      formData.append('ad_text', adText);
      if (templateId) {
        formData.append('template_id', templateId);
      }
      if (adMedia) {
        formData.append('media', adMedia);
      }

      // Create a new ad
      const response = await fetch(`/api/campaigns/${campaignId}/ads`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Fetch updated ad count
        const adsResponse = await fetch(`/api/campaigns/${campaignId}/ads`);
        const { ads } = await adsResponse.json();

        const adCount = ads.length;
        const adsLimit = result.adsLimit;

        toast.success(`Ad created successfully! You now have ${adCount}/${adsLimit} ads.`);

      } else {
        if (response.status === 403) {
          // Ad limit reached
          toast.error(`Ad limit reached. You have ${result.count}/${result.adsLimit} ads. Please upgrade your subscription.`);
        } else {
          // Other errors
          toast.error(result.error || 'Failed to create ad. Please try again.');
        }
      }

    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {selectedTemplate && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-700 mb-2">
            Creating ad from template: <span className="font-medium">{selectedTemplate.name}</span>
          </p>
          <p className="text-xs text-blue-600">{selectedTemplate.description}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="ad-name">Ad Name (optional)</Label>
        <Input
          id="ad-name"
          placeholder="Enter a name for your ad"
          value={adName}
          onChange={(e) => setAdName(e.target.value)}
          className="w-full"
        />
        <p className="text-sm text-gray-500">
          Give your ad a descriptive name for easy reference
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ad-text">Ad Text</Label>
        <Textarea
          id="ad-text"
          placeholder="Enter your ad text here..."
          value={adText}
          onChange={(e) => setAdText(e.target.value)}
          rows={6}
          className="resize-y"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ad-media">Upload Media (Image or Video)</Label>
        <Input
          type="file"
          id="ad-media"
          accept="image/*, video/*"
          onChange={(e) => setAdMedia(e.target.files ? e.target.files[0] : null)}
        />
      </div>
      
      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating...' : 'Create Ad'}
        </Button>
      </div>
    </form>
  );
}