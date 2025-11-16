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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from './StatusBadge';
import { Plus, Clock } from 'lucide-react';

interface RepairTrackingProps {
  type: 'school' | 'seller';
}

// TODO: Remove mock data - replace with API calls
const mockRepairs = [
  {
    id: '1',
    studentName: 'John Mwangi',
    itemType: 'Shirt',
    description: 'Torn sleeve',
    status: 'pending',
    reportedDate: '2024-01-15',
    schoolName: 'Greenfield Academy',
    schoolId: 'SCH001',
  },
  {
    id: '2',
    studentName: 'Sarah Njeri',
    itemType: 'Trouser',
    description: 'Broken zipper',
    status: 'in-progress',
    reportedDate: '2024-01-14',
    schoolName: 'Greenfield Academy',
    schoolId: 'SCH001',
  },
  {
    id: '3',
    studentName: 'David Omondi',
    itemType: 'Sweater',
    description: 'Missing button',
    status: 'completed',
    reportedDate: '2024-01-10',
    completedDate: '2024-01-12',
    schoolName: 'St. Mary\'s School',
    schoolId: 'SCH002',
  },
];

export default function RepairTracking({ type }: RepairTrackingProps) {
  const [repairs] = useState(mockRepairs);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');

  const filteredRepairs = repairs.filter(repair => {
    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;
    const matchesSchool = type === 'school' || schoolFilter === 'all' || repair.schoolId === schoolFilter;
    return matchesStatus && matchesSchool;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Repair Tracking</h1>
        <p className="text-muted-foreground">
          {type === 'school' ? 'Track uniform repairs' : 'Manage repairs across all schools'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Repair Requests</CardTitle>
              <CardDescription>Monitor and manage uniform repairs</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              <Button data-testid="button-add-repair">
                <Plus className="h-4 w-4 mr-2" />
                New Repair
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredRepairs.map((repair) => (
                  <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
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
                        <span className="text-muted-foreground">{getDaysAgo(repair.reportedDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={repair.status} type="repair" />
                    </TableCell>
                    <TableCell>
                      {repair.status !== 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-update-${repair.id}`}
                        >
                          Update
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRepairs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No repair requests found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
