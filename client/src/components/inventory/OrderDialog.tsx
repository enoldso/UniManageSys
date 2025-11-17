import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inventory } from "@shared/schema";

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
  quantity: string;
  onQuantityChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function OrderDialog({
  isOpen,
  onClose,
  item,
  quantity,
  onQuantityChange,
  onSubmit,
  isLoading = false,
}: OrderDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order New Stock</DialogTitle>
          <DialogDescription>
            Place an order for {item.itemType} ({item.size})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="orderQuantity">Quantity to Order</Label>
            <Input
              id="orderQuantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="Enter quantity"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Current stock: {item.quantity} (Threshold: {item.lowStockThreshold})
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmit}
              disabled={!quantity || parseInt(quantity) <= 0 || isLoading}
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
