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
import { Plus, AlertTriangle, Package, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Inventory, Student } from '@shared/schema';

interface SchoolInventoryProps {
  schoolId: string;
}

export default function SchoolInventory({ schoolId }: SchoolInventoryProps) {
  const { toast } = useToast();
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [issueQuantity, setIssueQuantity] = useState('1');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemType: '',
    size: '',
    quantity: '',
    lowStockThreshold: '5',
  });

  // Mock data for students
  const mockStudents = [
    { id: '1', name: 'John Mwangi', admissionNumber: 'SCH001' },
    { id: '2', name: 'Jane Wanjiku', admissionNumber: 'SCH002' },
    { id: '3', name: 'Michael Ochieng', admissionNumber: 'SCH003' },
  ];

  // Mock data for inventory with more size variants
  const mockInventory = [
    {
      id: '1',
      schoolId: schoolId,
      itemType: 'School Shirt',
      size: 'S',
      quantity: 15,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      schoolId: schoolId,
      itemType: 'School Shirt',
      size: 'M',
      quantity: 25,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      schoolId: schoolId,
      itemType: 'School Shirt',
      size: 'L',
      quantity: 18,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      schoolId: schoolId,
      itemType: 'School Trousers',
      size: 'S',
      quantity: 12,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      schoolId: schoolId,
      itemType: 'School Trousers',
      size: 'M',
      quantity: 20,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '6',
      schoolId: schoolId,
      itemType: 'School Sweater',
      size: 'M',
      quantity: 3, // Low stock
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '7',
      schoolId: schoolId,
      itemType: 'School Sweater',
      size: 'L',
      quantity: 7,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>(mockInventory);

  // Mock issue uniform function
  const issueUniformMutation = {
    isPending: false,
    mutate: (data: { itemId: string; studentId: string; quantity: number }) => {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      setTimeout(() => {
        try {
          const { itemId, quantity } = data;
          
          // Update inventory
          setInventory(prev => 
            prev.map(item => 
              item.id === itemId 
                ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
                : item
            )
          );
          
          toast({
            title: 'Success',
            description: 'Uniform issued successfully',
          });
          
          setIsIssueDialogOpen(false);
          setSelectedStudentId('');
          setIssueQuantity('1');
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to issue uniform');
          setError(error);
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }, 500);
    },
  };

  // Mock add inventory item function
  const addInventoryItem = {
    isPending: false,
    mutate: (newItem: Omit<Inventory, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>) => {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      setTimeout(() => {
        try {
          const newInventoryItem: Inventory = {
            ...newItem,
            id: `item-${Date.now()}`,
            schoolId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setInventory(prev => [...prev, newInventoryItem]);
          
          toast({
            title: 'Success',
            description: 'Item added to inventory',
          });
          
          setIsAddDialogOpen(false);
          setNewItem({
            itemType: '',
            size: '',
            quantity: '',
            lowStockThreshold: '5',
          });
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to add item');
          setError(error);
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }, 500);
    },
  };

  const handleIssueUniform = () => {
    if (!selectedItem || !selectedStudentId || !issueQuantity) return;
    
    issueUniformMutation.mutate({
      itemId: selectedItem.id,
      studentId: selectedStudentId,
      quantity: parseInt(issueQuantity),
    });
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
    
    addInventoryItem.mutate({
      ...newItem,
      quantity: parseInt(newItem.quantity),
      lowStockThreshold: parseInt(newItem.lowStockThreshold) || 5,
    });
  };

  const getStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-yellow-600' };
    return { label: 'In Stock', color: 'text-green-600' };
  };

  // Group inventory by item type
  const groupedInventory = useMemo(() => {
    const groups: Record<string, { 
      items: typeof mockInventory;
      totalQuantity: number;
      lowStock: boolean;
    }> = {};

    mockInventory.forEach(item => {
      if (!groups[item.itemType]) {
        groups[item.itemType] = {
          items: [],
          totalQuantity: 0,
          lowStock: false
        };
      }
      
      groups[item.itemType].items.push(item);
      groups[item.itemType].totalQuantity += item.quantity;
      
      // Mark as low stock if any size is below threshold
      if (item.quantity <= item.lowStockThreshold) {
        groups[item.itemType].lowStock = true;
      }
    });

    return groups;
  }, [mockInventory]);

  // Use mock students
  const students = mockStudents;
  
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
        <h3 className="text-lg font-medium">Error loading inventory</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">School Inventory</h1>
        <p className="text-muted-foreground">
          Manage your school's uniform inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Current stock levels by item type</CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-inventory"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedInventory).map(([itemType, { items, totalQuantity, lowStock }]) => (
              <div key={itemType} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-6 py-3 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{itemType}</h3>
                    <span className="text-sm text-muted-foreground">
                      {totalQuantity} in stock
                    </span>
                    {lowStock && (
                      <Badge variant="warning">Low Stock</Badge>
                    )}
                  </div>
                </div>
                <div className="divide-y">
                  {items.map((item) => {
                    const status = getStatus(item.quantity, item.lowStockThreshold);
                    const progressValue = Math.min(
                      (item.quantity / (item.lowStockThreshold * 2)) * 100,
                      100
                    );

                    return (
                      <div key={item.id} className="px-6 py-4 grid grid-cols-12 items-center">
                        <div className="col-span-1 font-medium">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            {item.size}
                          </div>
                        </div>
                        <div className="col-span-4">
                          <div className="flex flex-col">
                            <span className="font-medium">Size {item.size}</span>
                            <span className="text-sm text-muted-foreground">
                              {item.quantity} available
                            </span>
                          </div>
                        </div>
                        <div className="col-span-5">
                          <div className="flex items-center gap-3">
                            <div className="w-full max-w-[200px]">
                              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    item.quantity === 0 
                                      ? 'bg-red-500' 
                                      : item.quantity <= item.lowStockThreshold 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${progressValue}%` }}
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button
                            size="sm"
                            variant={item.quantity === 0 ? "ghost" : "outline"}
                            onClick={() => {
                              setSelectedItem(item);
                              setIsIssueDialogOpen(true);
                            }}
                            disabled={item.quantity === 0}
                            data-testid={`button-issue-${item.id}`}
                            className="w-full sm:w-auto"
                          >
                            {item.quantity === 0 ? 'Out of Stock' : 'Issue Item'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedInventory).length === 0 && (
              <div className="text-center py-12 border rounded-lg">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No inventory items found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by adding a new inventory item.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Uniform Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Issue Uniform</DialogTitle>
            <DialogDescription>
              Issue {selectedItem?.itemType} to a student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Item Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{selectedItem?.itemType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{selectedItem?.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="font-medium">{selectedItem?.quantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {selectedItem && selectedItem.quantity <= selectedItem.lowStockThreshold ? (
                      <span className="text-yellow-600">Low Stock</span>
                    ) : (
                      <span className="text-green-600">In Stock</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="student-select">Select Student</Label>
              <Select 
                value={selectedStudentId} 
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger id="student-select" data-testid="select-student" className="w-full">
                  <SelectValue placeholder="Search or select a student..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1">
                    <Input 
                      placeholder="Search students..." 
                      className="mb-2"
                      // Add search functionality here if needed
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id} className="py-2">
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {student.admissionNumber}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="quantity">Quantity</Label>
                <span className="text-sm text-muted-foreground">
                  Max: {selectedItem?.quantity || 0} available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    const newQty = Math.max(1, parseInt(issueQuantity) - 1);
                    setIssueQuantity(newQty.toString());
                  }}
                  disabled={parseInt(issueQuantity) <= 1}
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedItem?.quantity || 1}
                  value={issueQuantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[1-9]\d*$/.test(value)) {
                      setIssueQuantity(value);
                    }
                  }}
                  onBlur={(e) => {
                    const max = selectedItem?.quantity || 1;
                    const value = parseInt(e.target.value) || 1;
                    setIssueQuantity(Math.min(value, max).toString());
                  }}
                  className="text-center"
                  data-testid="input-issue-quantity"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const max = selectedItem?.quantity || 1;
                    const newQty = Math.min(max, parseInt(issueQuantity) + 1);
                    setIssueQuantity(newQty.toString());
                  }}
                  disabled={parseInt(issueQuantity) >= (selectedItem?.quantity || 1)}
                >
                  +
                </Button>
              </div>
              {selectedItem?.quantity > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedItem.quantity - parseInt(issueQuantity) || 0} will remain in stock after this issue
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any notes about this transaction..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsIssueDialogOpen(false);
                setSelectedStudentId('');
                setIssueQuantity('1');
              }}
              data-testid="button-cancel-issue"
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueUniform}
              disabled={!selectedStudentId || issueUniformMutation.isPending}
              data-testid="button-confirm-issue"
              className="gap-2"
            >
              {issueUniformMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Issuing...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Issue Uniform
                </>
              )}
            </Button>
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
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewItem({
                    itemType: '',
                    size: '',
                    quantity: '',
                    lowStockThreshold: '5',
                  });
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
