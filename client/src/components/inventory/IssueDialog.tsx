import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inventory, Student } from "@shared/schema";

interface IssueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
  students: Student[];
  selectedStudentId: string;
  onStudentChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function IssueDialog({
  isOpen,
  onClose,
  item,
  students,
  selectedStudentId,
  onStudentChange,
  quantity,
  onQuantityChange,
  onSubmit,
  isLoading = false,
}: IssueDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Inventory Item</DialogTitle>
          <DialogDescription>
            Issue {item.itemType} ({item.size}) to a student
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="student">Student</Label>
            <Select value={selectedStudentId} onValueChange={onStudentChange}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="issueQuantity">Quantity</Label>
            <Input
              id="issueQuantity"
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="Enter quantity"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Available: {item.quantity}
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmit}
              disabled={!selectedStudentId || !quantity || parseInt(quantity) <= 0 || isLoading}
            >
              {isLoading ? 'Issuing...' : 'Issue Item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
