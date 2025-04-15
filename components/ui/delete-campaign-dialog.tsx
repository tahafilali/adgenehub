"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteCampaignDialogProps {
  campaignId: string
  campaignName: string
  onDelete: (id: string) => Promise<void>
}

export function DeleteCampaignDialog({ 
  campaignId, 
  campaignName, 
  onDelete 
}: DeleteCampaignDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      
      // We'll show a loading toast that we can update later
      const toastId = toast.loading("Deleting campaign...")
      
      await onDelete(campaignId)
      
      // Update the loading toast to a success message
      toast.success("Campaign deleted successfully", {
        id: toastId
      })
      
      setIsOpen(false)
    } catch (err) {
      console.error("Failed to delete campaign:", err)
      setError("Failed to delete campaign. Please try again.")
      toast.error("Failed to delete campaign")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{campaignName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 