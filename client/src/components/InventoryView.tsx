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
import { Plus, AlertTriangle, Package } from 'lucide-react';
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

  const handleIssueUniform = () => {
    if (!selectedItem || !selectedStudentId || !schoolId) return;

    issueUniformMutation.mutate({
      studentId: selectedStudentId,
      schoolId,
      itemType: selectedItem.itemType,
      size: selectedItem.size,
      quantity: parseInt(issueQuantity),
      issuedDate: new Date().toISOString(),
      issuedBy: 'School Staff',
    });
  };

  const filteredInventory = type === 'seller'
    ? selectedSchool === 'all'
      ? inventory
      : inventory.filter(item => item.schoolId === selectedSchool)
    : inventory;

  const getStockStatus = (quantity: number, threshold: number) => {
    const percentage = (quantity / (threshold * 2)) * 100;
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-red-600 dark:text-red-500' };
    if (percentage < 75) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-500' };
    return { label: 'Good', color: 'text-green-600 dark:text-green-500' };
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
              <Button data-testid="button-add-inventory">
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
                  <TableHead>Item Type</TableHead>
                  <TableHead>Size</TableHead>
                  {type === 'seller' && <TableHead>School</TableHead>}
                  <TableHead>Quantity</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  {type === 'school' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item.quantity, item.lowStockThreshold);
                  const progressValue = Math.min((item.quantity / (item.lowStockThreshold * 2)) * 100, 100);

                  return (
                    <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                      <TableCell className="font-medium">{item.itemType}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.size}</Badge>
                      </TableCell>
                      {type === 'seller' && (
                        <TableCell className="text-sm">{item.schoolName}</TableCell>
                      )}
                      <TableCell className="font-mono font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative w-24">
                            <Progress 
                              value={progressValue} 
                              className="w-24"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
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
                })}
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
    </div>
  );
}
