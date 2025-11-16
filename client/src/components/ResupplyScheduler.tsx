import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isBefore, isToday, isAfter, differenceInDays } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Calendar as CalendarIcon, Plus, Package, Loader2, Trash2, Edit, X, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// Schema for form validation
const resupplyFormSchema = z.object({
  id: z.string().optional(),
  schoolName: z.string().min(1, 'School name is required'),
  itemType: z.string().min(1, 'Item type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  scheduledDate: z.date({
    required_error: 'A scheduled date is required',
  }),
  status: z.enum(['scheduled', 'in-transit', 'delivered', 'cancelled']),
  deliveryNotes: z.string().optional(),
});

type ResupplyFormValues = z.infer<typeof resupplyFormSchema>;

// Mock data - in a real app, this would be replaced with API calls
const mockResupplies: ResupplyFormValues[] = [
  {
    id: '1',
    schoolName: 'Greenfield Academy',
    itemType: 'Shirts (M)',
    quantity: 50,
    scheduledDate: addDays(new Date(), 3),
    status: 'scheduled',
    deliveryNotes: 'Deliver to main office',
  },
  {
    id: '2',
    schoolName: 'St. Mary\'s School',
    itemType: 'Trousers (L)',
    quantity: 30,
    scheduledDate: new Date(),
    status: 'in-transit',
    deliveryNotes: 'Contact principal on arrival',
  },
  {
    id: '3',
    schoolName: 'Greenfield Academy',
    itemType: 'Sweaters (XL)',
    quantity: 25,
    scheduledDate: addDays(new Date(), -2),
    status: 'delivered',
    deliveryNotes: 'Delivered and signed',
  },
];

// Mock API functions - replace with actual API calls
const fetchResupplies = async (): Promise<ResupplyFormValues[]> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockResupplies);
    }, 500);
  });
};

const saveResupply = async (data: ResupplyFormValues): Promise<ResupplyFormValues> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      const newData = { ...data };
      if (!newData.id) {
        newData.id = Math.random().toString(36).substr(2, 9);
        mockResupplies.push(newData);
      } else {
        const index = mockResupplies.findIndex(r => r.id === newData.id);
        if (index !== -1) {
          mockResupplies[index] = newData;
        }
      }
      resolve(newData);
    }, 500);
  });
};

const deleteResupply = async (id: string): Promise<void> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      const index = mockResupplies.findIndex(r => r.id === id);
      if (index !== -1) {
        mockResupplies.splice(index, 1);
      }
      resolve();
    }, 300);
  });
};

export default function ResupplyScheduler() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResupply, setEditingResupply] = useState<ResupplyFormValues | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resupplyToDelete, setResupplyToDelete] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Fetch resupplies
  const { data: resupplies = [], isLoading } = useQuery({
    queryKey: ['resupplies'],
    queryFn: fetchResupplies,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: saveResupply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resupplies'] });
      toast({
        title: 'Success',
        description: 'Resupply saved successfully',
      });
      setIsDialogOpen(false);
      setEditingResupply(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save resupply',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteResupply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resupplies'] });
      toast({
        title: 'Success',
        description: 'Resupply deleted successfully',
      });
      setDeleteDialogOpen(false);
    },
  });

  // Form setup
  const form = useForm<ResupplyFormValues>({
    resolver: zodResolver(resupplyFormSchema),
    defaultValues: {
      schoolName: '',
      itemType: '',
      quantity: 1,
      scheduledDate: new Date(),
      status: 'scheduled',
      deliveryNotes: '',
    },
  });

  // Filter and sort resupplies
  const filteredResupplies = useMemo(() => {
    let result = [...resupplies];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    
    // Sort by date (soonest first)
    return result.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [resupplies, statusFilter]);

  // Open form for editing
  const handleEdit = (resupply: ResupplyFormValues) => {
    setEditingResupply(resupply);
    form.reset({
      ...resupply,
      scheduledDate: new Date(resupply.scheduledDate),
    });
    setIsDialogOpen(true);
  };

  // Open delete confirmation
  const confirmDelete = (id: string) => {
    setResupplyToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: ResupplyFormValues) => {
    saveMutation.mutate(data);
  };

  // Handle delete
  const handleDelete = () => {
    if (resupplyToDelete) {
      deleteMutation.mutate(resupplyToDelete);
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'PPP');
  };

  // Get date badge info
  const getDateBadge = (dateValue: Date | string) => {
    const date = new Date(dateValue);
    const today = new Date();
    const diffDays = differenceInDays(date, today);

    if (isBefore(date, today) && !isToday(date)) {
      return { label: 'Past Due', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    }
    if (isToday(date)) {
      return { label: 'Today', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    }
    if (diffDays <= 3) {
      return { label: `In ${diffDays}d`, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    }
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Scheduled Deliveries</CardTitle>
              <CardDescription>Manage resupply schedule across all schools</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  setEditingResupply(null);
                  form.reset({
                    schoolName: '',
                    itemType: '',
                    quantity: 1,
                    scheduledDate: new Date(),
                    status: 'scheduled',
                    deliveryNotes: '',
                  });
                  setIsDialogOpen(true);
                }}
                className="w-full sm:w-auto"
                data-testid="button-schedule-delivery"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Delivery
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                          {resupply.deliveryNotes || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(resupply)}
                              className="h-8 w-8"
                              data-testid={`button-edit-${resupply.id}`}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {resupply.status !== 'delivered' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => confirmDelete(resupply.id!)}
                                data-testid={`button-delete-${resupply.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredResupplies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'No scheduled deliveries found. Click "Schedule Delivery" to add a new one.'
                  : `No ${statusFilter} deliveries found.`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Resupply Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {editingResupply ? 'Edit Resupply' : 'Schedule New Delivery'}
              </DialogTitle>
              <DialogDescription>
                {editingResupply
                  ? 'Update the resupply details below.'
                  : 'Fill in the details to schedule a new delivery.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="Enter school name"
                  {...form.register('schoolName')}
                />
                {form.formState.errors.schoolName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.schoolName.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemType">Item Type</Label>
                  <Input
                    id="itemType"
                    placeholder="e.g., Shirts (M)"
                    {...form.register('itemType')}
                  />
                  {form.formState.errors.itemType && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.itemType.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.quantity.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('scheduledDate') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('scheduledDate') ? (
                        format(form.watch('scheduledDate'), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('scheduledDate')}
                      onSelect={(date) => date && form.setValue('scheduledDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.scheduledDate && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.scheduledDate.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => 
                    form.setValue('status', value as 'scheduled' | 'in-transit' | 'delivered' | 'cancelled')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                <Textarea
                  id="deliveryNotes"
                  placeholder="Any special instructions for delivery"
                  className="min-h-[100px]"
                  {...form.register('deliveryNotes')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingResupply ? (
                  'Save Changes'
                ) : (
                  'Schedule Delivery'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resupply? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
