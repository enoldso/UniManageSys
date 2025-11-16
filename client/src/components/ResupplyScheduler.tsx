import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Package } from 'lucide-react';
import StatusBadge from './StatusBadge';

// TODO: Remove mock data - replace with API calls
const mockResupplies = [
  {
    id: '1',
    schoolName: 'Greenfield Academy',
    itemType: 'Shirts (M)',
    quantity: 50,
    scheduledDate: '2024-01-25',
    status: 'scheduled',
    deliveryNotes: 'Deliver to main office',
  },
  {
    id: '2',
    schoolName: 'St. Mary\'s School',
    itemType: 'Trousers (L)',
    quantity: 30,
    scheduledDate: '2024-01-22',
    status: 'in-transit',
    deliveryNotes: 'Contact principal on arrival',
  },
  {
    id: '3',
    schoolName: 'Greenfield Academy',
    itemType: 'Sweaters (XL)',
    quantity: 25,
    scheduledDate: '2024-01-20',
    status: 'delivered',
    deliveryNotes: 'Delivered and signed',
  },
];

export default function ResupplyScheduler() {
  const [resupplies] = useState(mockResupplies);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredResupplies = statusFilter === 'all'
    ? resupplies
    : resupplies.filter(r => r.status === statusFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDateBadge = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Past', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    if (diffDays === 0) return { label: 'Today', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    if (diffDays <= 3) return { label: `In ${diffDays}d`, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return { label: `In ${diffDays}d`, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Resupply Scheduler</h1>
        <p className="text-muted-foreground">Schedule and track inventory deliveries to schools</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Scheduled Deliveries</CardTitle>
              <CardDescription>Manage resupply schedule across all schools</CardDescription>
            </div>
            <Button data-testid="button-schedule-delivery">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Delivery
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResupplies.map((resupply) => {
                  const dateBadge = getDateBadge(resupply.scheduledDate);

                  return (
                    <TableRow key={resupply.id} data-testid={`row-resupply-${resupply.id}`}>
                      <TableCell className="font-medium">{resupply.schoolName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{resupply.itemType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{resupply.quantity}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {formatDate(resupply.scheduledDate)}
                          </div>
                          <Badge variant="outline" className={`${dateBadge.color} border-0`}>
                            {dateBadge.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={resupply.status} type="resupply" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {resupply.deliveryNotes}
                      </TableCell>
                      <TableCell>
                        {resupply.status !== 'delivered' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`button-update-${resupply.id}`}
                          >
                            Update
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredResupplies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled deliveries found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
