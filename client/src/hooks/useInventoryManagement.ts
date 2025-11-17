import { useState, useMemo, useCallback } from 'react';
import { Inventory, Student } from '@shared/schema';
import { toast } from '@/components/ui/use-toast';

interface UseInventoryManagementProps {
  initialInventory: Inventory[];
  students: Student[];
}

export function useInventoryManagement({ initialInventory, students }: UseInventoryManagementProps) {
  // State for inventory and orders
  const [inventory, setInventory] = useState<Inventory[]>(initialInventory);
  const [orders, setOrders] = useState<Array<{
    id: string;
    itemId: string;
    itemType: string;
    size: string;
    quantity: number;
    status: 'pending' | 'received' | 'cancelled';
    orderDate: Date;
    expectedDelivery?: Date;
  }>>([]);

  // Dialog states
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form states
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [issueQuantity, setIssueQuantity] = useState('1');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Process inventory with search, filter, and sort
  const processedInventory = useMemo(() => {
    let result = [...inventory];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.itemType.toLowerCase().includes(term) || 
          item.size.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => {
        if (statusFilter === 'in-stock') return item.quantity > 0;
        if (statusFilter === 'low-stock') return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
        if (statusFilter === 'out-of-stock') return item.quantity === 0;
        return true;
      });
    }

    // Apply sorting
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Inventory];
        const bValue = b[sortConfig.key as keyof Inventory];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [inventory, searchTerm, statusFilter, sortConfig]);

  // Handle sort request
  const requestSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Handle item selection
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

  // Handle select all items
  const selectAllItems = useCallback((items: Inventory[]) => {
    setSelectedItems(prev => {
      // If all items are already selected, clear selection
      if (items.every(item => prev.has(item.id))) {
        return new Set();
      }
      // Otherwise select all items
      return new Set(items.map(item => item.id));
    });
  }, []);

  // Handle placing an order
  const handlePlaceOrder = useCallback(() => {
    if (!selectedItem) return;
    
    const quantity = parseInt(orderQuantity) || 1;
    const newOrder = {
      id: `order-${Date.now()}`,
      itemId: selectedItem.id,
      itemType: selectedItem.itemType,
      size: selectedItem.size,
      quantity,
      status: 'pending' as const,
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
    
    setOrders(prev => [...prev, newOrder]);
    
    // Update inventory (in a real app, this would be an API call)
    setInventory(prev => 
      prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    );
    
    toast({
      title: 'Order Placed',
      description: `Order for ${quantity} ${selectedItem.itemType} (${selectedItem.size}) has been placed`,
    });
    
    setIsOrderDialogOpen(false);
    setSelectedItem(null);
    setOrderQuantity('1');
  }, [selectedItem, orderQuantity]);

  // Handle bulk order
  const handleBulkOrder = useCallback(() => {
    const itemsToOrder = inventory.filter(item => selectedItems.has(item.id));
    
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
    
    // Update inventory (in a real app, this would be an API call)
    setInventory(prev => 
      prev.map(item => 
        selectedItems.has(item.id)
          ? { ...item, quantity: item.quantity + (item.lowStockThreshold * 2) }
          : item
      )
    );
    
    toast({
      title: 'Bulk Order Placed',
      description: `Placed orders for ${itemsToOrder.length} items`,
    });
    
    // Clear selection
    setSelectedItems(new Set());
  }, [inventory, selectedItems]);

  // Handle issuing an item
  const handleIssueItem = useCallback(() => {
    if (!selectedItem || !selectedStudentId) return;
    
    const student = students.find(s => s.id === selectedStudentId);
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
    setInventory(prev => 
      prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, quantity: item.quantity - quantity }
          : item
      )
    );
    
    // Close the dialog and reset
    setIsIssueDialogOpen(false);
    setSelectedItem(null);
    setSelectedStudentId('');
    setIssueQuantity('1');
  }, [selectedItem, selectedStudentId, issueQuantity, students]);

  // Handle adding a new item
  const handleAddItem = useCallback((newItem: Omit<Inventory, 'id' | 'schoolId'>) => {
    // In a real app, this would be an API call
    const addedItem: Inventory = {
      ...newItem,
      id: `item-${Date.now()}`,
      schoolId: 'school-1', // This would come from the current school context
    };
    
    setInventory(prev => [...prev, addedItem]);
    
    toast({
      title: 'Item Added',
      description: `${addedItem.itemType} (${addedItem.size}) has been added to inventory`,
    });
    
    setIsAddDialogOpen(false);
  }, []);

  // Calculate pagination
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [processedInventory, currentPage]);

  return {
    // State
    inventory: processedInventory,
    paginatedInventory,
    orders,
    selectedItem,
    selectedItems,
    searchTerm,
    statusFilter,
    sortConfig,
    currentPage,
    itemsPerPage,
    totalItems: processedInventory.length,
    totalPages: Math.ceil(processedInventory.length / itemsPerPage),
    
    // Dialog states
    isOrderDialogOpen,
    isIssueDialogOpen,
    isAddDialogOpen,
    
    // Form states
    selectedStudentId,
    orderQuantity,
    issueQuantity,
    
    // Actions
    setSearchTerm,
    setStatusFilter,
    setCurrentPage,
    setSelectedItem,
    setSelectedStudentId,
    setOrderQuantity,
    setIssueQuantity,
    setIsOrderDialogOpen,
    setIsIssueDialogOpen,
    setIsAddDialogOpen,
    
    // Handlers
    requestSort,
    toggleItemSelection,
    selectAllItems,
    handlePlaceOrder,
    handleBulkOrder,
    handleIssueItem,
    handleAddItem,
  };
}
