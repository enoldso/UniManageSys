import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { InventoryTable } from "./inventory/InventoryTable";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data for inventory with more size variants
  const mockInventory = [
    {
      id: '1',
      schoolId: schoolId,
      itemType: 'Shirt',
      size: 'S',
      color: 'White',
      quantity: 15,
      lowStockThreshold: 5,
      lastUpdated: new Date('2023-01-15').toISOString(),
      category: 'Uniform',
      gender: 'Unisex',
      price: 12.99,
      supplier: 'Uniforms Inc.'
    },
    {
      id: '2',
      schoolId: schoolId,
      itemType: 'Shirt',
      size: 'M',
      color: 'White',
      quantity: 10,
      lowStockThreshold: 5,
      lastUpdated: new Date('2023-01-15').toISOString(),
      category: 'Uniform',
      gender: 'Unisex',
      price: 12.99,
      supplier: 'Uniforms Inc.'
    },
    {
      id: '3',
      schoolId: schoolId,
      itemType: 'Shirt',
      size: 'L',
      color: 'White',
      quantity: 8,
      lowStockThreshold: 5,
      lastUpdated: new Date('2023-01-15').toISOString(),
      category: 'Uniform',
      gender: 'Unisex',
      price: 12.99,
      supplier: 'Uniforms Inc.'
    },
    {
      id: '4',
      schoolId: schoolId,
      itemType: 'Pants',
      size: '28',
      color: 'Navy',
      quantity: 12,
      lowStockThreshold: 5,
      lastUpdated: new Date('2023-01-20').toISOString(),
      category: 'Uniform',
      gender: 'Boys',
      price: 24.99,
      supplier: 'School Apparel Co.'
    },
    {
      id: '5',
      schoolId: schoolId,
      itemType: 'Pants',
      size: '30',
      color: 'Navy',
      quantity: 3,
      lowStockThreshold: 5,
      lastUpdated: new Date('2023-01-20').toISOString(),
      category: 'Uniform',
      gender: 'Boys',
      price: 24.99,
      supplier: 'School Apparel Co.'
    }
  ];

  // Calculate paginated inventory
  const filteredInventory = useMemo(() => {
    let result = [...mockInventory];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.itemType.toLowerCase().includes(term) || 
        item.size.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter === 'in-stock') {
      result = result.filter(item => item.quantity > 0);
    } else if (statusFilter === 'low-stock') {
      result = result.filter(item => 
        item.quantity > 0 && item.quantity <= item.lowStockThreshold
      );
    } else if (statusFilter === 'out-of-stock') {
      result = result.filter(item => item.quantity === 0);
    }
    
    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [mockInventory, searchTerm, statusFilter, sortConfig]);
  
  // Filtered inventory is used for display
  const filteredItems = useMemo(() => {
    return filteredInventory;
  }, [filteredInventory]);
  
  const [newItem, setNewItem] = useState({
    itemType: '',
    size: '',
    quantity: '',
    lowStockThreshold: '5',
  });

  // Import Search icon
  const Search = useMemo(() => {
    return (props: React.SVGProps<SVGSVGElement>) => (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }, []);

  // Checkbox component
  const Checkbox = useMemo(() => {
    return ({
      checked,
      onCheckedChange,
      className = "",
      ariaLabel,
    }: {
      checked: boolean;
      onCheckedChange: (checked: boolean) => void;
      className?: string;
      ariaLabel?: string;
    }) => (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        className={`relative h-4 w-4 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center ${
          checked ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'
        } ${className}`}
        onClick={() => onCheckedChange(!checked)}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    );
  }, []);

  // Mock data for students
  const mockStudents = [
    { id: '1', name: 'John Mwangi', admissionNumber: 'SCH001' },
    { id: '2', name: 'Jane Wanjiku', admissionNumber: 'SCH002' },
    { id: '3', name: 'Michael Ochieng', admissionNumber: 'SCH003' },
  ];

  // State for orders
  const [orders, setOrders] = useState<Array<{
    id: string;
    itemId: string;
    schoolId: string;
    itemType: string;
    size: string;
    quantity: number;
    status: 'pending' | 'received' | 'cancelled';
    orderDate: Date;
    expectedDelivery?: Date;
    lowStockThreshold?: number;
    updatedAt?: Date;
  }>>([
    {
      id: '5',
      itemId: '5',
      schoolId: schoolId,
      itemType: 'School Trousers',
      size: 'M',
      quantity: 20,
      status: 'pending',
      orderDate: new Date(),
      expectedDelivery: new Date(),
      lowStockThreshold: 5,
      updatedAt: new Date()
    },
    {
      id: '6',
      itemId: '6',
      schoolId: schoolId,
      itemType: 'School Sweater',
      size: 'M',
      quantity: 3,
      status: 'pending',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lowStockThreshold: 5,
      updatedAt: new Date()
    },
    {
      id: '7',
      itemId: '7',
      schoolId: schoolId,
      itemType: 'School Shirt',
      size: 'L',
      quantity: 10,
      status: 'pending',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lowStockThreshold: 5,
      updatedAt: new Date()
    }
  ]);

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

  // Handle placing an order for low stock items
  const handlePlaceOrder = () => {
    if (!selectedItem) return;
    
    const newOrder = {
      id: `order-${Date.now()}`,
      itemId: selectedItem.id,
      itemType: selectedItem.itemType,
      size: selectedItem.size,
      quantity: parseInt(orderQuantity) || 1,
      status: 'pending' as const,
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
    
    setOrders(prev => [...prev, newOrder]);
    
    // Update the inventory (in a real app, this would be an API call)
    const updatedInventory = mockInventory.map(item => 
      item.id === selectedItem.id 
        ? { ...item, quantity: item.quantity + parseInt(orderQuantity) }
        : item
    );
    
    // In a real app, you would update the inventory through an API call here
    // For now, we'll just log it
    console.log('Updated inventory:', updatedInventory);
    
    toast({
      title: 'Order Placed',
      description: `Order for ${orderQuantity} ${selectedItem.itemType} (${selectedItem.size}) has been placed`,
    });
    
    setIsOrderDialogOpen(false);
    setSelectedItem(null);
    setOrderQuantity('1');
  };
  
  // Handle issuing items to students
  const handleIssueItem = () => {
    if (!selectedItem || !selectedStudentId) return;
    
    const student = mockStudents.find(s => s.id === selectedStudentId);
    if (!student) return;
    
    const quantity = parseInt(issueQuantity) || 1;
    
    if (selectedItem.quantity < quantity) {
      toast({
        title: 'Error',
        description: 'Not enough items in stock',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, this would be an API call
    toast({
      title: 'Item Issued',
      description: `Issued ${quantity} ${selectedItem.itemType} (${selectedItem.size}) to ${student.name}`,
    });
    
    // Update the inventory (in a real app, this would be an API call)
    const updatedInventory = mockInventory.map(item => 
      item.id === selectedItem.id 
        ? { ...item, quantity: item.quantity - quantity }
        : item
    );
    
    console.log('Updated inventory after issue:', updatedInventory);
    
    // Close the dialog and reset
    setIsIssueDialogOpen(false);
    setSelectedItem(null);
    setSelectedStudentId('');
    setIssueQuantity('1');
  };

  const getStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-yellow-600' };
    return { label: 'In Stock', color: 'text-green-600' };
  };

  // Enhanced inventory processing with search, filter and sort
  const processedInventory = useMemo(() => {
    // First, filter and process all items
    let items = [...mockInventory];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.itemType.toLowerCase().includes(term) || 
        item.size.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      items = items.filter(item => {
        if (statusFilter === 'inStock') return item.quantity > 0;
        if (statusFilter === 'lowStock') return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
        if (statusFilter === 'outOfStock') return item.quantity === 0;
        return true;
      });
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'status') {
          aValue = a.quantity === 0 ? 2 : (a.quantity <= a.lowStockThreshold ? 1 : 0);
          bValue = b.quantity === 0 ? 2 : (b.quantity <= b.lowStockThreshold ? 1 : 0);
        } else {
          aValue = a[sortConfig.key as keyof typeof a];
          bValue = b[sortConfig.key as keyof typeof b];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return items;
  }, [mockInventory, searchTerm, statusFilter, sortConfig]);

  // Group inventory by item type after processing
  const groupedInventory = useMemo(() => {
    const groups: Record<string, { 
      items: typeof mockInventory;
      totalQuantity: number;
      lowStock: boolean;
    }> = {};

    processedInventory.forEach(item => {
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
  }, [processedInventory]);

  // Handle bulk order for selected items
  const handleBulkOrder = () => {
    const itemsToOrder = mockInventory.filter(item => selectedItems.has(item.id));
    
    if (itemsToOrder.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select items to order',
        variant: 'destructive',
      });
      return;
    }
    
    const newOrders = itemsToOrder.map(item => ({
      id: `order-${Date.now()}-${item.id}`,
      itemId: item.id,
      itemType: item.itemType,
      size: item.size,
      quantity: item.lowStockThreshold * 2, // Order double the threshold
      status: 'pending' as const,
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }));
    
    setOrders(prev => [...prev, ...newOrders]);
    
    // In a real app, you would update the inventory through an API call here
    const updatedInventory = mockInventory.map(item => 
      selectedItems.has(item.id)
        ? { ...item, quantity: item.quantity + (item.lowStockThreshold * 2) }
        : item
    );
    
    console.log('Updated inventory after bulk order:', updatedInventory);
    
    toast({
      title: 'Bulk Order Placed',
      description: `Placed orders for ${itemsToOrder.length} items`,
    });
    
    // Clear selection
    setSelectedItems(new Set());
  };
  
  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  // Select all items on current page
  const selectAllItems = useCallback(() => {
    const pageItems = processedInventory
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map(item => item.id);
      
    setSelectedItems(prev => {
      const allSelected = pageItems.every(id => prev.has(id));
      const newSelection = new Set(prev);
      
      if (allSelected) {
        pageItems.forEach(id => newSelection.delete(id));
      } else {
        pageItems.forEach(id => newSelection.add(id));
      }
      
      return newSelection;
    });
  }, [currentPage, processedInventory]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const data = processedInventory.map(item => ({
      'Item Type': item.itemType,
      'Size': item.size,
      'Quantity': item.quantity,
      'Low Stock Threshold': item.lowStockThreshold,
      'Status': item.quantity === 0 ? 'Out of Stock' : 
                item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'In Stock',
      'Last Updated': new Date(item.updatedAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Export Successful',
      description: 'Inventory data has been exported to Excel',
    });
  }, [processedInventory, toast]);

  // Use mock students
  const students = mockStudents;
  
  // Pagination
  const totalPages = Math.ceil(processedInventory.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, processedInventory]);
  
  // Loading and error states
  // Request sort
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">School Inventory</h1>
          <p className="text-muted-foreground">
            Manage your school's uniform inventory
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-md">
              <span className="text-sm font-medium">{selectedItems.size} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  // Implement bulk delete
                  setSelectedItems(new Set());
                  toast({
                    title: 'Items Removed',
                    description: `${selectedItems.size} items removed from selection`,
                  });
                }}
              >
                Clear Selection
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBulkOrder}
              >
                Order Selected ({selectedItems.size})
              </Button>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToExcel}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-inventory"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      // Replace the existing table section in SchoolInventory.tsx with this:

<Card>
  <CardHeader className="pb-3">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <CardTitle>Inventory Items</CardTitle>
        <CardDescription>Manage your school's uniform inventory</CardDescription>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <InventoryTable
      items={paginatedItems}
      onOrder={(item) => {
        setSelectedItem(item);
        setOrderQuantity('1');
        setIsOrderDialogOpen(true);
      }}
      onIssue={(item) => {
        setSelectedItem(item);
        setIssueQuantity('1');
        setIsIssueDialogOpen(true);
      }}
      onEdit={(item) => {
        setSelectedItem(item);
        setNewItem({
          itemType: item.itemType,
          size: item.size,
          quantity: item.quantity.toString(),
          lowStockThreshold: item.lowStockThreshold.toString(),
        });
        setIsAddDialogOpen(true);
      }}
    />
  </CardContent>
  <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
    <div className="text-sm text-muted-foreground">
      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
      <span className="font-medium">
        {Math.min(currentPage * itemsPerPage, processedInventory.length)}
      </span>{' '}
      of <span className="font-medium">{processedInventory.length}</span> items
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  </CardFooter>
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
