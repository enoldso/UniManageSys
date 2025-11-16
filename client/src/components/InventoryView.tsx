import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertTriangle, Package, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Inventory, Student } from '@shared/schema';

interface InventoryViewProps {
  type: 'school' | 'seller';
  schoolId?: string;
  schoolFilter?: string;
}

export default function InventoryView({ type, schoolId, schoolFilter }: InventoryViewProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>(schoolFilter || 'all');
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [issueQuantity, setIssueQuantity] = useState('1');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // Dummy schools data - in a real app, this would come from an API
  const dummySchools = [
    { id: 'school-1', name: 'Greenfield Academy' },
    { id: 'school-2', name: 'St. Mary\'s School' },
    { id: 'school-3', name: 'Sunrise Public School' },
  ];

  const [newItem, setNewItem] = useState({
    itemType: '',
    size: '',
    quantity: '',
    lowStockThreshold: '5',
    allocations: [
      { schoolId: 'school-1', quantity: '0' },
      { schoolId: 'school-2', quantity: '0' },
      { schoolId: 'school-3', quantity: '0' },
    ]
  });
  const { toast } = useToast();

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: type === 'school' && schoolId
      ? ['/api/inventory', schoolId]
      : ['/api/inventory/all/seller'],
    enabled: type === 'seller' || Boolean(schoolId),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students', schoolId],
    enabled: type === 'school' && !!schoolId,
  });

  const issueUniformMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/issue-uniform', data);
      return await res.json();
    },
    onSuccess: () => {
      if (type === 'school' && schoolId) {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['/api/students', schoolId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory/all/seller'] });
      }
      toast({
        title: 'Success',
        description: 'Uniform issued successfully',
      });
      setIsIssueDialogOpen(false);
      resetIssueForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue uniform',
        variant: 'destructive',
      });
    },
  });

  const resetIssueForm = () => {
    setSelectedItem(null);
    setSelectedStudentId('');
    setIssueQuantity('1');
  };

  const resetAddForm = () => {
    setNewItem({
      itemType: '',
      size: '',
      quantity: '',
      lowStockThreshold: '5',
      allocations: dummySchools.map(school => ({
        schoolId: school.id,
        quantity: '0'
      }))
    });
  };

  const updateAllocation = (schoolId: string, value: string) => {
    // Ensure the value is a valid number or empty string
    if (value !== '' && isNaN(parseInt(value))) return;
    
    setNewItem(prev => ({
      ...prev,
      allocations: prev.allocations.map(allocation => 
        allocation.schoolId === schoolId 
          ? { ...allocation, quantity: value } 
          : allocation
      )
    }));
  };

  // Calculate total allocated quantity
  const totalAllocated = newItem.allocations.reduce(
    (sum, alloc) => sum + (parseInt(alloc.quantity) || 0), 0
  );
  
  // Calculate remaining quantity to allocate
  const remainingQuantity = Math.max(0, (parseInt(newItem.quantity) || 0) - totalAllocated);

  const handleIssueUniform = () => {
    if (!selectedItem || !selectedStudentId || !schoolId) {
      toast({
        title: 'Error',
        description: 'Please select a student and item',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(issueQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    if (selectedItem.quantity < quantity) {
      toast({
        title: 'Error',
        description: 'Not enough stock available',
        variant: 'destructive',
      });
      return;
    }

    issueUniformMutation.mutate({
      studentId: selectedStudentId,
      schoolId,
      itemType: selectedItem.itemType,
      size: selectedItem.size,
      quantity,
      issuedDate: new Date().toISOString(),
      issuedBy: 'School Staff',
    });
  };

  // Commented out the actual API call for demo purposes
  const addInventoryItem = {
    mutate: (data: any) => {
      // This is a no-op for the demo
      console.log('Would normally save to API:', data);
    },
    isPending: false
  };

  const handleAddItem = () => {
    if (!newItem.itemType || !newItem.size || !newItem.quantity) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(newItem.quantity);
    const threshold = parseInt(newItem.lowStockThreshold);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(threshold) || threshold <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid low stock threshold',
        variant: 'destructive',
      });
      return;
    }

    // Check if all allocations are valid
    const hasInvalidAllocation = newItem.allocations.some(
      alloc => isNaN(parseInt(alloc.quantity)) || parseInt(alloc.quantity) < 0
    );
    
    if (hasInvalidAllocation) {
      toast({
        title: 'Error',
        description: 'Please enter valid quantities for all school allocations',
        variant: 'destructive',
      });
      return;
    }

    if (totalAllocated !== quantity) {
      toast({
        title: 'Error',
        description: `Total allocated quantity (${totalAllocated}) must match the total quantity (${quantity})`,
        variant: 'destructive',
      });
      return;
    }

    // Create dummy data for each school allocation
    const dummyItems = newItem.allocations
      .filter(alloc => parseInt(alloc.quantity) > 0)
      .map(alloc => {
        const school = dummySchools.find(s => s.id === alloc.schoolId);
        return {
          id: `dummy-${Date.now()}-${alloc.schoolId}`,
          itemType: newItem.itemType,
          size: newItem.size,
          quantity: parseInt(alloc.quantity),
          lowStockThreshold: threshold,
          schoolId: alloc.schoolId,
          schoolName: school?.name || 'Unknown School',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

    // For demo purposes, we'll update the UI optimistically
    // and show a success message
    queryClient.setQueryData<Inventory[]>(
      type === 'school' && schoolId
        ? ['/api/inventory', schoolId]
        : ['/api/inventory/all/seller'],
      (oldData = []) => [...oldData, ...dummyItems]
    );
    
    console.log('Adding items:', dummyItems);

    toast({
      title: 'Success',
      description: 'Dummy item added successfully',
    });

    // Close the dialog and reset the form
    setIsAddDialogOpen(false);
    resetAddForm();
  };

  // First, filter the inventory based on the current view
  const filteredInventory = type === 'school' && schoolId
    ? inventory
    : selectedSchool === 'all'
      ? inventory
      : inventory.filter(item => item.schoolId === selectedSchool);

  // Group inventory by school for better organization
  const inventoryBySchool = filteredInventory.reduce<Record<string, Inventory[]>>((acc, item) => {
    const schoolId = item.schoolId || 'other';
    if (!acc[schoolId]) {
      acc[schoolId] = [];
    }
    acc[schoolId].push(item);
    return acc;
  }, {});

  // Get school names for display
  const getSchoolName = (schoolId: string) => {
    const school = dummySchools.find(s => s.id === schoolId);
    return school ? school.name : schoolId === 'other' ? 'Other' : 'Unknown School';
  };

  // Sort schools alphabetically by name
  const sortedSchoolIds = Object.keys(inventoryBySchool).sort((a, b) => 
    getSchoolName(a).localeCompare(getSchoolName(b))
  );

  const getStockStatus = (quantity: number, threshold: number) => {
    const percentage = (quantity / (threshold * 2)) * 100;
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-red-600 dark:text-red-500' };
    if (percentage < 75) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-500' };
    return { label: 'Good', color: 'text-green-600 dark:text-green-500' };
  };

  const renderInventoryRow = (item: Inventory) => {
    const status = getStockStatus(item.quantity, item.lowStockThreshold);
    const progressValue = Math.min((item.quantity / (item.lowStockThreshold * 2)) * 100, 100);

    return (
      <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span>{item.itemType}</span>
            {type === 'seller' && selectedSchool === 'all' && (
              <span className="text-xs text-muted-foreground">
                {item.schoolName || 'No school assigned'}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{item.size}</Badge>
        </TableCell>
        <TableCell className="font-mono font-medium">
          {item.quantity}
          <span className="text-xs text-muted-foreground ml-1">/ {item.lowStockThreshold} threshold</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="relative w-24">
              <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(item.quantity, item.lowStockThreshold)}`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-10">
              {Math.round(progressValue)}%
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {item.quantity <= item.lowStockThreshold && (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
            )}
            <span className={`text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </TableCell>
        {type === 'school' && (
          <TableCell>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedItem(item);
                setIsIssueDialogOpen(true);
              }}
              disabled={item.quantity === 0}
              data-testid={`button-issue-${item.id}`}
            >
              <Package className="h-4 w-4 mr-1" />
              Issue
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const getProgressColor = (quantity: number, threshold: number) => {
    if (quantity <= threshold) return 'bg-red-500';
    const percentage = (quantity / (threshold * 2)) * 100;
    if (percentage < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          {type === 'school' ? 'Track your school uniform inventory' : 'Manage inventory across all schools'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Current inventory status</CardDescription>
            </div>
            <div className="flex gap-2">
              {type === 'seller' && (
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-[200px]" data-testid="select-school-filter">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    <SelectItem value="SCH001">Greenfield Academy</SelectItem>
                    <SelectItem value="SCH002">St. Mary's School</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="button-add-inventory"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  {type === 'school' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {type === 'seller' && selectedSchool === 'all' ? (
                  // Grouped by school view for seller
                  sortedSchoolIds.map((schoolId) => {
                    const schoolItems = inventoryBySchool[schoolId] || [];
                    const schoolTotal = schoolItems.reduce((sum, item) => sum + item.quantity, 0);
                    const schoolLowStock = schoolItems.filter(
                      item => item.quantity <= item.lowStockThreshold
                    ).length;
                    
                    return (
                      <React.Fragment key={`school-${schoolId}`}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={type === 'school' ? 5 : 6} className="font-semibold">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4" />
                                {getSchoolName(schoolId)}
                                <Badge variant="outline" className="ml-2">
                                  {schoolItems.length} item{schoolItems.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                {schoolLowStock > 0 && (
                                  <span className="flex items-center text-sm text-yellow-600 dark:text-yellow-500">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    {schoolLowStock} low stock
                                  </span>
                                )}
                                <span className="text-sm font-mono">
                                  Total: {schoolTotal} units
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        {schoolItems.map(renderInventoryRow)}
                      </React.Fragment>
                    );
                  })
                ) : (
                  // Regular view for single school or when a specific school is selected
                  filteredInventory.map(renderInventoryRow)
                )}
              </TableBody>
            </Table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Uniform</DialogTitle>
            <DialogDescription>
              Issue {selectedItem?.itemType} (Size: {selectedItem?.size}) to a student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-select">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="student-select" data-testid="select-student">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.admissionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedItem?.quantity || 1}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(e.target.value)}
                data-testid="input-issue-quantity"
              />
              <p className="text-xs text-muted-foreground">
                Available: {selectedItem?.quantity || 0}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsIssueDialogOpen(false);
                  resetIssueForm();
                }}
                data-testid="button-cancel-issue"
              >
                Cancel
              </Button>
              <Button
                onClick={handleIssueUniform}
                disabled={!selectedStudentId || issueUniformMutation.isPending}
                data-testid="button-confirm-issue"
              >
                {issueUniformMutation.isPending ? 'Issuing...' : 'Issue Uniform'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to the inventory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-type">Item Type</Label>
              <Input
                id="item-type"
                placeholder="e.g., Shirt, Pants, Skirt"
                value={newItem.itemType}
                onChange={(e) => setNewItem({...newItem, itemType: e.target.value})}
                data-testid="input-item-type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="e.g., S, M, L, XL"
                value={newItem.size}
                onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                data-testid="input-size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                data-testid="input-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low-stock">Low Stock Threshold</Label>
              <Input
                id="low-stock"
                type="number"
                min="1"
                placeholder="Low stock threshold"
                value={newItem.lowStockThreshold}
                onChange={(e) => setNewItem({...newItem, lowStockThreshold: e.target.value})}
                data-testid="input-low-stock"
              />
              <p className="text-xs text-muted-foreground">
                When quantity goes below this number, it will be marked as low stock
              </p>

              <div className="pt-4">
                <h4 className="text-sm font-medium mb-3">Allocate to Schools</h4>
                <div className="space-y-3">
                  {dummySchools.map((school) => {
                    const allocation = newItem.allocations.find(a => a.schoolId === school.id) || { quantity: '0' };
                    return (
                      <div key={school.id} className="flex items-center gap-3">
                        <Label className="w-48 truncate" htmlFor={`alloc-${school.id}`}>
                          {school.name}:
                        </Label>
                        <Input
                          id={`alloc-${school.id}`}
                          type="number"
                          min="0"
                          max={newItem.quantity}
                          value={allocation.quantity}
                          onChange={(e) => updateAllocation(school.id, e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          / {newItem.quantity}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 text-sm">
                    <span>Total Allocated:</span>
                    <span className={`font-medium ${totalAllocated > parseInt(newItem.quantity || '0') ? 'text-red-600' : ''}`}>
                      {totalAllocated} / {newItem.quantity || 0}
                    </span>
                  </div>
                  {remainingQuantity > 0 && (
                    <p className="text-xs text-yellow-600">
                      {remainingQuantity} units remaining to allocate
                    </p>
                  )}
                  {totalAllocated > parseInt(newItem.quantity || '0') && (
                    <p className="text-xs text-red-600">
                      Total allocated cannot exceed available quantity
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetAddForm();
                }}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={addInventoryItem.isPending}
                data-testid="button-confirm-add"
              >
                {addInventoryItem.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
