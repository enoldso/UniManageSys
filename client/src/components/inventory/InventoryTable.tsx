import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Inventory, Order } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryTableProps {
  items: Inventory[];
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onSelectAll: (items: Inventory[]) => void;
  onIssue: (item: Inventory) => void;
  onOrder: (item: Inventory) => void;
  onEdit: (item: Inventory) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export function InventoryTable({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onIssue,
  onOrder,
  onEdit,
  sortConfig,
  onSort,
}: InventoryTableProps) {
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600', variant: 'destructive' as const };
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-yellow-600', variant: 'warning' as const };
    return { label: 'In Stock', color: 'text-green-600', variant: 'default' as const };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox 
              checked={items.length > 0 && items.every(item => selectedItems.has(item.id))}
              onCheckedChange={() => onSelectAll(items)}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-accent"
            onClick={() => onSort('itemType')}
          >
            <div className="flex items-center gap-1">
              Item Type {getSortIndicator('itemType')}
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer hover:bg-accent"
            onClick={() => onSort('size')}
          >
            <div className="flex items-center gap-1">
              Size {getSortIndicator('size')}
            </div>
          </TableHead>
          <TableHead className="text-right">
            <div 
              className="flex items-center justify-end gap-1 cursor-pointer hover:bg-accent"
              onClick={() => onSort('quantity')}
            >
              Quantity {getSortIndicator('quantity')}
            </div>
          </TableHead>
          <TableHead className="text-right">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length > 0 ? (
          items.map((item) => {
            const status = getStatus(item.quantity, item.lowStockThreshold);
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onSelectItem(item.id)}
                    aria-label={`Select ${item.itemType} ${item.size}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.itemType}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <span>{item.quantity}</span>
                    <div className="w-24">
                      <Progress 
                        value={Math.min(100, (item.quantity / (item.lowStockThreshold * 2)) * 100)} 
                        className="h-2"
                        indicatorClassName={status.color.replace('text-', 'bg-')}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onIssue(item)}
                      disabled={item.quantity === 0}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Issue
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onOrder(item)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Order
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No items found. Try adjusting your search or filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
