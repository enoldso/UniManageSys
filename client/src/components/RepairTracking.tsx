import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StatusBadge from './StatusBadge';
import { Plus, Clock, Trash2, Edit, Loader2, Search, Download, X } from 'lucide-react';

// Define the schema for form validation
const repairFormSchema = z.object({
  id: z.string().optional(),
  studentName: z.string().min(1, 'Student name is required'),
  itemType: z.string().min(1, 'Item type is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['pending', 'in-progress', 'completed']),
  reportedDate: z.date(),
  completedDate: z.date().optional().nullable(),
  schoolName: z.string().optional(),
  schoolId: z.string().optional(),
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairTrackingProps {
  type: 'school' | 'seller';
}

// Mock data - in a real app, this would be replaced with API calls
let mockRepairs: RepairFormValues[] = [
  {
    id: '1',
    studentName: 'John Mwangi',
    itemType: 'Shirt',
    description: 'Torn sleeve',
    status: 'pending',
    reportedDate: new Date('2024-01-15'),
    schoolName: 'Greenfield Academy',
    schoolId: 'SCH001',
  },
  {
    id: '2',
    studentName: 'Sarah Njeri',
    itemType: 'Trouser',
    description: 'Broken zipper',
    status: 'in-progress',
    reportedDate: new Date('2024-01-14'),
    schoolName: 'Greenfield Academy',
    schoolId: 'SCH001',
  },
  {
    id: '3',
    studentName: 'David Omondi',
    itemType: 'Sweater',
    description: 'Missing button',
    status: 'completed',
    reportedDate: new Date('2024-01-10'),
    completedDate: new Date('2024-01-12'),
    schoolName: 'St. Mary\'s School',
    schoolId: 'SCH002',
  },
  {
    id: '4',
    studentName: 'Grace Wambui',
    itemType: 'Blouse',
    description: 'Torn seam',
    status: 'pending',
    reportedDate: new Date('2024-01-16'),
    schoolName: 'Greenfield Academy',
    schoolId: 'SCH001',
  },
  {
    id: '5',
    studentName: 'James Kariuki',
    itemType: 'Tie',
    description: 'Stain removal',
    status: 'in-progress',
    reportedDate: new Date('2024-01-13'),
    schoolName: 'St. Mary\'s School',
    schoolId: 'SCH002',
  },
];

// Mock API functions
const fetchRepairs = (): Promise<RepairFormValues[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...mockRepairs]);
    }, 300);
  });
};

const saveRepair = async (data: RepairFormValues): Promise<RepairFormValues> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newData = { ...data };
      if (!newData.id) {
        // Create new repair
        newData.id = Math.random().toString(36).substr(2, 9);
        newData.reportedDate = new Date();
        mockRepairs = [newData, ...mockRepairs];
      } else {
        // Update existing repair
        const index = mockRepairs.findIndex(r => r.id === newData.id);
        if (index !== -1) {
          mockRepairs[index] = newData;
        }
      }
      resolve(newData);
    }, 300);
  });
};

const deleteRepair = async (id: string): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      mockRepairs = mockRepairs.filter(repair => repair.id !== id);
      resolve();
    }, 300);
  });
};

export default function RepairTracking({ type }: RepairTrackingProps) {
  const [repairs, setRepairs] = useState<RepairFormValues[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairFormValues | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState<string | null>(null);
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([]);

  // Form setup
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      studentName: '',
      itemType: '',
      description: '',
      status: 'pending',
      reportedDate: new Date(),
      schoolName: type === 'school' ? 'Current School' : '',
      schoolId: type === 'school' ? 'CURRENT_SCHOOL_ID' : undefined,
    },
  });

  // Load repairs
  const loadRepairs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchRepairs();
      setRepairs(data);
    } catch (error) {
      console.error('Error loading repairs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load repair requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useState(() => {
    loadRepairs();
  }, []);

  // Filter and sort repairs
  const { filteredRepairs, totalItems } = useMemo(() => {
    let filtered = [...repairs];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(repair => repair.status === statusFilter);
    }

    // Apply school filter (for seller view)
    if (type === 'seller' && schoolFilter !== 'all') {
      filtered = filtered.filter(repair => repair.schoolId === schoolFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(repair => 
        repair.studentName.toLowerCase().includes(query) ||
        repair.itemType.toLowerCase().includes(query) ||
        repair.description.toLowerCase().includes(query) ||
        (repair.schoolName?.toLowerCase().includes(query) ?? false)
      );
    }

    // Sort by reported date (newest first)
    filtered.sort((a, b) => 
      new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
    );

    return {
      filteredRepairs: filtered,
      totalItems: filtered.length,
    };
  }, [repairs, statusFilter, schoolFilter, searchQuery, type]);

  // Handle form submission
  const onSubmit = async (data: RepairFormValues) => {
    try {
      setIsSaving(true);
      await saveRepair(data);
      await loadRepairs();
      setIsDialogOpen(false);
      setEditingRepair(null);
      toast({
        title: 'Success',
        description: editingRepair ? 'Repair updated successfully' : 'Repair request created successfully',
      });
    } catch (error) {
      console.error('Error saving repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to save repair request',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!repairToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteRepair(repairToDelete);
      await loadRepairs();
      setDeleteDialogOpen(false);
      setRepairToDelete(null);
      toast({
        title: 'Success',
        description: 'Repair request deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete repair request',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRepairs.length === 0) return;
    
    try {
      setIsDeleting(true);
      await Promise.all(selectedRepairs.map(id => deleteRepair(id)));
      await loadRepairs();
      setSelectedRepairs([]);
      toast({
        title: 'Success',
        description: `${selectedRepairs.length} repair request(s) deleted successfully`,
      });
    } catch (error) {
      console.error('Error bulk deleting repairs:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete selected repair requests',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle select all
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRepairs(filteredRepairs.map(repair => repair.id!));
    } else {
      setSelectedRepairs([]);
    }
  };

  // Toggle single selection
  const toggleSelectRepair = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRepairs(prev => [...prev, id]);
    } else {
      setSelectedRepairs(prev => prev.filter(repairId => repairId !== id));
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'PPP');
  };

  // Get days ago text
  const getDaysAgo = (dateString: string | Date) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  // Prepare data for CSV export
  const csvData = filteredRepairs.map(repair => ({
    'Student Name': repair.studentName,
    'Item Type': repair.itemType,
    'Description': repair.description,
    'Status': repair.status,
    'Reported Date': formatDate(repair.reportedDate),
    'Completed Date': repair.completedDate ? formatDate(repair.completedDate) : 'N/A',
    'School': repair.schoolName || 'N/A',
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Repair Tracking</h1>
        <p className="text-muted-foreground">
          {type === 'school' ? 'Track uniform repairs' : 'Manage repairs across all schools'}
        </p>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Repair Requests</CardTitle>
              <CardDescription>Monitor and manage uniform repairs</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search repairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
                data-testid="search-repairs"
              />
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {type === 'seller' && (
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-school-filter">
                      <SelectValue placeholder="School" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      <SelectItem value="SCH001">Greenfield Academy</SelectItem>
                      <SelectItem value="SCH002">St. Mary's School</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <CSVLink 
                  data={csvData} 
                  filename={`repairs-${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </CSVLink>
                <Button 
                  onClick={() => {
                    form.reset({
                      studentName: '',
                      itemType: '',
                      description: '',
                      status: 'pending',
                      reportedDate: new Date(),
                      schoolName: type === 'school' ? 'Current School' : '',
                      schoolId: type === 'school' ? 'CURRENT_SCHOOL_ID' : undefined,
                    });
                    setEditingRepair(null);
                    setIsDialogOpen(true);
                  }}
                  data-testid="button-add-repair"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Repair
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRepairs.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-4">
              <div className="text-sm text-muted-foreground">
                {selectedRepairs.length} repair{selectedRepairs.length !== 1 ? 's' : ''} selected
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Selected
              </Button>
            </div>
          )}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedRepairs.length > 0 && selectedRepairs.length === filteredRepairs.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  {type === 'seller' && <TableHead>School</TableHead>}
                  <TableHead>Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={type === 'seller' ? 8 : 7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading repairs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRepairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={type === 'seller' ? 8 : 7} className="h-24 text-center">
                      No repair requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRepairs.map((repair) => (
                    <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRepairs.includes(repair.id!)}
                          onCheckedChange={(checked) => 
                            toggleSelectRepair(repair.id!, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{repair.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{repair.itemType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {repair.description}
                      </TableCell>
                      {type === 'seller' && (
                        <TableCell className="text-sm">{repair.schoolName}</TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{getDaysAgo(repair.reportedDate.toString())}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={repair.status} type="repair" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingRepair(repair);
                              form.reset({
                                ...repair,
                                reportedDate: new Date(repair.reportedDate),
                                completedDate: repair.completedDate ? new Date(repair.completedDate) : undefined,
                              });
                              setIsDialogOpen(true);
                            }}
                            data-testid={`button-edit-${repair.id}`}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setRepairToDelete(repair.id!);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${repair.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {!isLoading && filteredRepairs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredRepairs.length} of {totalItems} repair{totalItems !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Repair Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{editingRepair ? 'Edit Repair Request' : 'New Repair Request'}</DialogTitle>
              <DialogDescription>
                {editingRepair ? 'Update the repair request details' : 'Fill in the details to create a new repair request'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentName" className="text-right">
                  Student Name
                </Label>
                <Input
                  id="studentName"
                  className="col-span-3"
                  {...form.register('studentName')}
                  data-testid="input-student-name"
                />
                {form.formState.errors.studentName && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {form.formState.errors.studentName.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemType" className="text-right">
                  Item Type
                </Label>
                <Input
                  id="itemType"
                  className="col-span-3"
                  {...form.register('itemType')}
                  data-testid="input-item-type"
                />
                {form.formState.errors.itemType && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {form.formState.errors.itemType.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  {...form.register('description')}
                  data-testid="input-description"
                />
                {form.formState.errors.description && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value: 'pending' | 'in-progress' | 'completed') => {
                    form.setValue('status', value);
                    if (value === 'completed' && !form.getValues('completedDate')) {
                      form.setValue('completedDate', new Date());
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3" data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
              {form.watch('status') === 'completed' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="completedDate" className="text-right">
                    Completed Date
                  </Label>
                  <Input
                    id="completedDate"
                    type="date"
                    className="col-span-3"
                    value={form.watch('completedDate') ? format(form.watch('completedDate') as Date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      form.setValue('completedDate', date);
                    }}
                    data-testid="input-completed-date"
                  />
                </div>
              )}
              {type === 'school' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">School</Label>
                  <p className="col-span-3 text-sm text-muted-foreground">
                    {form.watch('schoolName') || 'Current School'}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Repair Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this repair request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
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
