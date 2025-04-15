import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Template } from '@/lib/types';

interface CreateAdFormProps {
  campaignId: string;
  templateId?: string;
  initialText?: string;
}

export function CreateAdForm({ campaignId, templateId, initialText = '' }: CreateAdFormProps) {
  const router = useRouter();
  const [adName, setAdName] = useState<string>('');
  const [adText, setAdText] = useState<string>(initialText);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Fetch template details if templateId is provided
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      
      try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) throw new Error('Failed to fetch template');
        
        const data = await response.json();
        setSelectedTemplate(data.template);
        
        // Pre-populate form fields if not already set
        if (!adText && data.template.preview_text) {
          setAdText(data.template.preview_text);
        }
        
        if (!adName && data.template.name) {
          setAdName(`Ad based on ${data.template.name}`);
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast.error('Failed to load template');
      }
    };
    
    fetchTemplate();
  }, [templateId, adText, adName]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!adText.trim()) {
      toast.error('Please enter ad text');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a new ad
      const response = await fetch(`/api/campaigns/${campaignId}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adName || `New Ad ${new Date().toLocaleDateString()}`,
          ad_text: adText,
          template_id: templateId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create ad');
      }
      
      const { ad } = await response.json();
      
      toast.success('Ad created successfully!');
      
      // Redirect to the ad detail page
      router.push(`/dashboard/campaigns/${campaignId}/ads/${ad.id}`);
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
      
      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating...' : 'Create Ad'}
        </Button>
      </div>
    </form>
  );
} 