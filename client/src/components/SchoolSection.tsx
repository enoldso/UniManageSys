import { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Inventory } from '@shared/schema';

interface SchoolSectionProps {
  schoolId: string;
  schoolName: string;
  schoolItems: Inventory[];
  type: 'school' | 'seller';
  renderInventoryRow: (item: Inventory) => React.ReactNode;
}

export function SchoolSection({ schoolId, schoolName, schoolItems, type, renderInventoryRow }: SchoolSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalItems = schoolItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = schoolItems.filter(
    item => item.quantity <= item.lowStockThreshold
  ).length;

  return (
    <Card key={schoolId} className="mb-6">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {schoolName}
            <span className="ml-2 text-sm text-muted-foreground">
              ({schoolItems.length} items, {totalItems} total)
              {lowStockItems > 0 && (
                <span className="ml-2 text-orange-500">
                  ({lowStockItems} low stock)
                </span>
              )}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                {type === 'school' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolItems.map(renderInventoryRow)}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
