import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Asset } from "./types";

interface DeleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteAssetDialog({ open, onOpenChange, asset, onConfirm }: DeleteAssetDialogProps) {
  async function handleDelete() {
    if (!asset) return;
    try {
      await onConfirm(asset.id);
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Asset</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium">{asset?.name}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {asset && (
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{asset.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price</span>
              <span className="font-medium">
                ${asset.purchase_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
