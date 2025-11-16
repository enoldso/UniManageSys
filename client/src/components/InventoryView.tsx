import { useState, useMemo } from 'react';
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
import { Plus, AlertTriangle, Package, School, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Inventory, Student } from '@shared/schema';
import React from 'react';

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
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{id: string, quantity: number}[]>([]);
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

  // Fetch inventory data based on user type
  const { data: inventory = [], isLoading, error } = useQuery<Inventory[]>({
    queryKey: type === 'school' ? ['inventory', schoolId] : ['all-inventory'],
    queryFn: async () => {
      if (type === 'school' && schoolId) {
        // For school users, only fetch their own inventory
        const data = await apiRequest<Inventory[]>(`/api/inventory/${schoolId}`);
        return data || [];
      } else {
        // For sellers, fetch all inventory
        const data = await apiRequest<Inventory[]>('/api/inventory/all/seller');
        return data || [];
      }
    },
    enabled: type === 'school' ? !!schoolId : true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter inventory based on selected school (for seller view only)
  const filteredInventory = useMemo(() => {
    if (type === 'school' || selectedSchool === 'all') {
      return inventory;
    }
    return inventory.filter(item => item.schoolId === selectedSchool);
  }, [inventory, selectedSchool, type]);

  // Get unique schools for filter dropdown (seller view only)
  const schools = useMemo(() => {
    if (type === 'school') return [];
    
    const schoolMap = new Map<string, string>();
    inventory.forEach(item => {
      if (item.schoolId && item.schoolName) {
        schoolMap.set(item.schoolId, item.schoolName);
      }
    });
    
    return Array.from(schoolMap.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [inventory, type]);

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <p>Failed to load inventory. Please try again later.</p>
      </div>
    );
  }
  // Fetch students for the school (only for school users)
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      if (type === 'school' && schoolId) {
        const data = await apiRequest<Student[]>(`/api/students/${schoolId}`);
        return data || [];
      }
      return [];
    },
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

  // Add dummy pricing data
  const getItemPrice = (item: Inventory) => {
    // Simple hash function to generate consistent prices based on item type and size
    const priceMap: Record<string, number> = {
      'shirt-s': 1200,
      'shirt-m': 1300,
      'shirt-l': 1400,
      'pants-s': 1500,
      'pants-m': 1600,
      'pants-l': 1700,
      'skirt-s': 1400,
      'skirt-m': 1500,
      'skirt-l': 1600,
      'sweater-s': 1800,
      'sweater-m': 1900,
      'sweater-l': 2000,
    };
    
    const key = `${item.itemType.toLowerCase()}-${item.size.toLowerCase()}`;
    return priceMap[key] || 1000; // Default price if not found
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.filter(i => i.id !== itemId);
      } else {
        return [...prev, { id: itemId, quantity: 1 }];
      }
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const calculateInvoiceTotal = () => {
    return selectedItems.reduce((total, { id, quantity }) => {
      const item = inventory.find(i => i.id === id);
      if (!item) return total;
      return total + (getItemPrice(item) * quantity);
    }, 0);
  };

  const renderInventoryRow = (item: Inventory) => {
    const status = getStockStatus(item.quantity, item.lowStockThreshold);
    const progressValue = Math.min((item.quantity / (item.lowStockThreshold * 2)) * 100, 100);

    return (
      <TableRow 
        key={item.id} 
        data-testid={`row-inventory-${item.id}`}
        className={selectedItems.some(i => i.id === item.id) ? 'bg-muted/50' : ''}
        onClick={() => toggleItemSelection(item.id)}
      >
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
        <TableCell className="font-medium">
          <Badge variant="outline">{item.size}</Badge>
        </TableCell>
        <TableCell className="font-mono">
          KES {getItemPrice(item).toLocaleString()}
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

  // SchoolSection component to handle collapsible school sections
  const SchoolSection = React.memo(({ 
    schoolId, 
    schoolName, 
    schoolItems, 
    type, 
    renderInventoryRow 
  }: { 
    schoolId: string; 
    schoolName: string; 
    schoolItems: Inventory[]; 
    type: 'school' | 'seller'; 
    renderInventoryRow: (item: Inventory) => React.ReactNode; 
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const totalItems = schoolItems.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = schoolItems.filter(
      item => item.quantity <= item.lowStockThreshold
    ).length;

    return (
      <Card key={schoolId} className="overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <School className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">{schoolName}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="ml-2">
                  {schoolItems.length} {schoolItems.length === 1 ? 'item' : 'items'}
                </Badge>
                {lowStockItems > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {lowStockItems} low stock
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {totalItems} total in stock
              </div>
              <svg
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t">
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
          </div>
        )}
      </Card>
    );
  });

  // Memoize the sorted school IDs to prevent unnecessary re-renders
  const memoizedSchoolSections = useMemo(() => {
    return sortedSchoolIds.map((schoolId) => {
      const schoolItems = inventoryBySchool[schoolId] || [];
      return (
        <SchoolSection
          key={schoolId}
          schoolId={schoolId}
          schoolName={getSchoolName(schoolId)}
          schoolItems={schoolItems}
          type={type}
          renderInventoryRow={renderInventoryRow}
        />
      );
    });
  }, [sortedSchoolIds, inventoryBySchool, type, renderInventoryRow]);

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
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No inventory items found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by adding a new inventory item.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    data-testid="button-add-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {memoizedSchoolSections}
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="fixed bottom-6 right-6 z-10">
                    <Button 
                      onClick={() => setIsInvoicePreviewOpen(true)}
                      className="shadow-lg flex items-center gap-2"
                      size="lg"
                    >
                      <FileText className="h-5 w-5" />
                      View Invoice ({selectedItems.length} items)
                    </Button>
                  </div>
                )}
              </div>
            )}
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

      {/* Invoice Preview Dialog */}
      <Dialog open={isInvoicePreviewOpen} onOpenChange={setIsInvoicePreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Preview</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsInvoicePreviewOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Review items before generating invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground pb-2 border-b">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {selectedItems.map(({ id, quantity }) => {
              const item = inventory.find(i => i.id === id);
              if (!item) return null;
              
              const price = getItemPrice(item);
              const total = price * quantity;
              
              return (
                <div key={id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
                  <div className="col-span-6">
                    <div className="font-medium">{item.itemType}</div>
                    <div className="text-sm text-muted-foreground">Size: {item.size}</div>
                  </div>
                  <div className="col-span-2 text-right">KES {price.toLocaleString()}</div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => updateItemQuantity(id, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    KES {total.toLocaleString()}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>KES {calculateInvoiceTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">KES {calculateInvoiceTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedItems([]);
                setIsInvoicePreviewOpen(false);
              }}
            >
              Clear Selection
            </Button>
            <Button disabled={selectedItems.length === 0}>
              Generate Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
