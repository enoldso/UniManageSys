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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from './StatusBadge';
import MpesaPaymentModal from './MpesaPaymentModal';
import { Search, Plus, DollarSign, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Student } from '@shared/schema';

interface StudentManagementProps {
  schoolId: string;
}

export default function StudentManagement({ schoolId }: StudentManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students', schoolId],
    enabled: Boolean(schoolId),
  });

  const [formData, setFormData] = useState({
    name: '',
    admissionNumber: '',
    age: '',
    grade: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    shirtSize: '',
    trouserSize: '',
    skirtSize: '',
    sweaterSize: '',
    uniformStatus: 'pending',
    paymentStatus: 'pending',
    totalAmount: '',
  });

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/students', { ...data, schoolId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', schoolId] });
      toast({
        title: 'Success',
        description: 'Student added successfully',
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate({
      ...formData,
      age: parseInt(formData.age),
      totalAmount: parseInt(formData.totalAmount),
      passportPhotoUrl: photoPreview || undefined,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      admissionNumber: '',
      age: '',
      grade: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      nextOfKinName: '',
      nextOfKinPhone: '',
      nextOfKinRelationship: '',
      shirtSize: '',
      trouserSize: '',
      skirtSize: '',
      sweaterSize: '',
      uniformStatus: 'pending',
      paymentStatus: 'pending',
      totalAmount: '',
    });
    setPhotoPreview('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayment = (student: Student) => {
    setSelectedStudent(student);
    setIsPaymentModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="text-muted-foreground">Manage student records and uniform information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>View and manage student uniform records</CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-student"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-students"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Uniform Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {student.passportPhotoUrl && (
                            <AvatarImage src={student.passportPhotoUrl} alt={student.name} />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.age}</TableCell>
                    <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <StatusBadge status={student.uniformStatus} type="uniform" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.paymentStatus} type="payment" />
                    </TableCell>
                    <TableCell className="font-medium">
                      KES {student.amountPaid.toLocaleString()} / {student.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {student.paymentStatus !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayment(student)}
                          data-testid={`button-pay-${student.id}`}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No students found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Register a new student with complete information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="guardian">Guardian</TabsTrigger>
                <TabsTrigger value="uniform">Uniform</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {photoPreview && <AvatarImage src={photoPreview} />}
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Label 
                    htmlFor="photo-upload" 
                    className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Passport Photo
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admission">Admission Number *</Label>
                    <Input
                      id="admission"
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                      required
                      data-testid="input-admission"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      data-testid="input-age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade *</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="e.g., Grade 8"
                      required
                      data-testid="input-grade"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="guardian" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Parent/Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                      <Input
                        id="parentName"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        required
                        data-testid="input-parent-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Phone Number *</Label>
                      <Input
                        id="parentPhone"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="+254..."
                        required
                        data-testid="input-parent-phone"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="parentEmail">Email (Optional)</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        data-testid="input-parent-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Next of Kin Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kinName">Next of Kin Name *</Label>
                      <Input
                        id="kinName"
                        value={formData.nextOfKinName}
                        onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value })}
                        required
                        data-testid="input-kin-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinPhone">Phone Number *</Label>
                      <Input
                        id="kinPhone"
                        value={formData.nextOfKinPhone}
                        onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })}
                        placeholder="+254..."
                        required
                        data-testid="input-kin-phone"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="kinRelationship">Relationship *</Label>
                      <Input
                        id="kinRelationship"
                        value={formData.nextOfKinRelationship}
                        onChange={(e) => setFormData({ ...formData, nextOfKinRelationship: e.target.value })}
                        placeholder="e.g., Aunt, Uncle, Guardian"
                        required
                        data-testid="input-kin-relationship"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="uniform" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shirtSize">Shirt Size *</Label>
                    <Select 
                      value={formData.shirtSize} 
                      onValueChange={(value) => setFormData({ ...formData, shirtSize: value })}
                    >
                      <SelectTrigger data-testid="select-shirt-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trouserSize">Trouser Size</Label>
                    <Select 
                      value={formData.trouserSize} 
                      onValueChange={(value) => setFormData({ ...formData, trouserSize: value })}
                    >
                      <SelectTrigger data-testid="select-trouser-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="28">28</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="32">32</SelectItem>
                        <SelectItem value="34">34</SelectItem>
                        <SelectItem value="36">36</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skirtSize">Skirt Size</Label>
                    <Select 
                      value={formData.skirtSize} 
                      onValueChange={(value) => setFormData({ ...formData, skirtSize: value })}
                    >
                      <SelectTrigger data-testid="select-skirt-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sweaterSize">Sweater Size</Label>
                    <Select 
                      value={formData.sweaterSize} 
                      onValueChange={(value) => setFormData({ ...formData, sweaterSize: value })}
                    >
                      <SelectTrigger data-testid="select-sweater-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Uniform Cost (KES) *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="5000"
                      required
                      data-testid="input-total-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                    >
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uniformStatus">Uniform Status</Label>
                    <Select 
                      value={formData.uniformStatus} 
                      onValueChange={(value) => setFormData({ ...formData, uniformStatus: value })}
                    >
                      <SelectTrigger data-testid="select-uniform-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="good">Good Condition</SelectItem>
                        <SelectItem value="needs-repair">Needs Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createStudentMutation.isPending}
                data-testid="button-submit-student"
              >
                {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedStudent && (
        <MpesaPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          studentName={selectedStudent.name}
          amount={selectedStudent.totalAmount - selectedStudent.amountPaid}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/students', schoolId] });
          }}
        />
      )}
    </div>
  );
}
