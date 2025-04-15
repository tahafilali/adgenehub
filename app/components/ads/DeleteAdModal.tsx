import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeleteAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adName?: string;
  campaignId: string;
  onDeleted?: () => void;
}

export function DeleteAdModal({ isOpen, onClose, adId, adName, campaignId, onDeleted }: DeleteAdModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!adId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/ads/${adId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ad');
      }
      
      // Close the modal
      onClose();
      
      // Call the onDeleted callback if provided
      if (onDeleted) {
        onDeleted();
      }
      
      toast.success('Ad deleted successfully');
      
      // Force a router refresh to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while deleting the ad');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Ad</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this ad? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm font-medium text-gray-700">
            {adName ? `"${adName}"` : 'This ad'} will be permanently removed from your campaign.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 