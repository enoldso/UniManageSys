import { useState, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// UI Components
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, CreditCard, FileText, Filter, Download, 
  Calendar as CalendarIcon, Search, Plus, Users, Receipt, Clock, CheckCircle2, XCircle
} from 'lucide-react';

// Types
type Transaction = {
  id: string;
  date: Date;
  type: 'sale' | 'repair' | 'expense' | 'refund' | 'payment';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
};

type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  balance: number;
  lastPaymentDate?: Date;
  status: 'active' | 'inactive' | 'overdue';
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

type Expense = {
  id: string;
  date: Date;
  category: 'supply' | 'shipping' | 'utilities' | 'salaries' | 'other';
  description: string;
  amount: number;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
};

// Mock data
const mockTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
  id: `txn-${i + 1}`,
  date: new Date(2023, 10, i + 1),
  type: ['sale', 'repair', 'expense', 'refund', 'payment'][i % 5] as any,
  description: `Transaction ${i + 1} for ${['Uniforms', 'Repairs', 'Supplies', 'Refund', 'Payment'][i % 5]}`,
  amount: Math.floor(Math.random() * 1000) + 100,
  status: ['completed', 'pending', 'failed'][i % 3] as any,
  reference: `REF-${1000 + i}`
}));

const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Uniforms R Us',
    contact: 'John Smith',
    email: 'john@uniformsrus.com',
    phone: '+1 (555) 123-4567',
    balance: 12500,
    lastPaymentDate: new Date(2023, 10, 15),
    status: 'active'
  },
  {
    id: 'sup-2',
    name: 'Textile Masters',
    contact: 'Sarah Johnson',
    email: 'sarah@textilemasters.com',
    phone: '+1 (555) 234-5678',
    balance: 8500,
    status: 'active'
  },
  {
    id: 'sup-3',
    name: 'Quality Fabrics Ltd',
    contact: 'Michael Brown',
    email: 'michael@qualityfabrics.com',
    phone: '+1 (555) 345-6789',
    balance: 21500,
    status: 'overdue'
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2023-001',
    supplierId: 'sup-1',
    supplierName: 'Uniforms R Us',
    date: new Date(2023, 10, 1),
    dueDate: new Date(2023, 10, 30),
    amount: 12500,
    status: 'pending',
    items: [
      { description: 'School Shirts (M)', quantity: 100, unitPrice: 25, total: 2500 },
      { description: 'School Trousers (M)', quantity: 100, unitPrice: 30, total: 3000 },
      { description: 'School Sweaters (M)', quantity: 100, unitPrice: 35, total: 3500 },
      { description: 'School Shoes (M)', quantity: 50, unitPrice: 50, total: 2500 }
    ]
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-002',
    supplierId: 'sup-2',
    supplierName: 'Textile Masters',
    date: new Date(2023, 9, 15),
    dueDate: new Date(2023, 10, 15),
    amount: 8500,
    status: 'paid',
    items: [
      { description: 'Fabric Rolls (Blue)', quantity: 50, unitPrice: 100, total: 5000 },
      { description: 'Sewing Threads', quantity: 200, unitPrice: 5, total: 1000 },
      { description: 'Buttons (1000pcs)', quantity: 5, unitPrice: 50, total: 250 },
      { description: 'Zippers (100pcs)', quantity: 10, unitPrice: 25, total: 250 }
    ]
  }
];

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    date: new Date(2023, 10, 5),
    category: 'supply',
    description: 'School Uniforms Order #456',
    amount: 12500,
    status: 'pending'
  },
  {
    id: 'exp-2',
    date: new Date(2023, 9, 20),
    category: 'shipping',
    description: 'International Shipping Fee',
    amount: 850,
    status: 'approved'
  },
  {
    id: 'exp-3',
    date: new Date(2023, 9, 10),
    category: 'utilities',
    description: 'Factory Electricity Bill - October',
    amount: 1250,
    status: 'approved'
  }
];

// Chart data
const revenueData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Revenue',
      data: [65000, 59000, 80000, 81000, 105000, 120000, 110000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    },
  ],
};

const expenseData = {
  labels: ['Supplies', 'Salaries', 'Utilities', 'Shipping', 'Other'],
  datasets: [
    {
      data: [30000, 50000, 10000, 5000, 5000],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

// Dialog components for forms
const NewTransactionDialog = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Transaction</DialogTitle>
        <DialogDescription>Add a new financial transaction to the system.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">
            Type
          </Label>
          <Select>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">
            Amount
          </Label>
          <Input id="amount" type="number" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input id="description" className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const ViewItemDialog = ({ open, onOpenChange, item, type }) => {
  if (!item) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>View {type}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 gap-4">
              <span className="font-medium text-right">{key}:</span>
              <span className="col-span-3">{String(value)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function FinancialDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Dialog states
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewItemType, setViewItemType] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Handle export
  const handleExport = () => {
    // In a real app, this would generate a CSV or PDF
    toast({
      title: "Export started",
      description: "Your data is being prepared for export.",
    });
    
    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your data has been exported successfully.",
        action: (
          <ToastAction altText="Download" onClick={() => {
            // In a real app, this would trigger the download
            console.log("Downloading export...");
          }}>
            Download
          </ToastAction>
        ),
      });
    }, 1500);
  };

  // Handle view item
  const handleViewItem = (item, type) => {
    setViewItem(item);
    setViewItemType(type);
    setIsViewDialogOpen(true);
  };

  // Calculate financial metrics
  const metrics = [
    {
      label: 'Total Revenue',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(12500000),
      change: 12.5,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: 'Pending Payments',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(2500000),
      change: -2.3,
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: 'Total Expenses',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(8500000),
      change: 5.7,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: 'Net Profit',
      value: new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(4000000),
      change: 8.2,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedType, selectedStatus]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
          <p className="text-muted-foreground">
            Track and manage your school's financial activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsNewTransactionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Financial Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p
                    className={`text-xs ${
                      metric.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Line data={revenueData} options={chartOptions} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Distribution of expenses by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Pie data={expenseData} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>All financial transactions in the system</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-9 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sale">Sales</SelectItem>
                      <SelectItem value="repair">Repairs</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                      <SelectItem value="refund">Refunds</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(transaction.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.reference}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          transaction.type === 'expense' || transaction.type === 'refund'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'expense' || transaction.type === 'refund' ? '-' : ''}
                        KES {transaction.amount.toLocaleString('en-KE')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Suppliers</CardTitle>
                  <CardDescription>Manage your suppliers and payments</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNewSupplierOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact}</TableCell>
                      <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(supplier.balance * 100)}
                      </TableCell>
                      <TableCell>
                        {supplier.lastPaymentDate
                          ? format(supplier.lastPaymentDate, 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supplier.status === 'active' ? 'default' :
                              supplier.status === 'overdue' ? 'destructive' : 'outline'
                          }
                        >
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewItem(supplier, 'Supplier')}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage and track your invoices</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNewInvoiceOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.supplierName}</TableCell>
                      <TableCell>{format(invoice.date, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {format(invoice.dueDate, 'MMM dd, yyyy')}
                          {invoice.status === 'overdue' && (
                            <Clock className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(invoice.amount * 100)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                              invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewItem(invoice, 'Invoice')}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track and manage your expenses</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNewExpenseOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(expense.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <td className="font-medium">
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(expense.amount * 100)}
                      </td>
                      <td>
                        <Badge
                          variant={
                            expense.status === 'approved' ? 'default' :
                              expense.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {expense.status}
                        </Badge>
                      </td>
                      <td>
                        {expense.receiptUrl ? (
                          <a 
                            href={expense.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewItem(expense, 'Expense')}>
                          View
                        </Button>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewTransactionDialog 
        open={isNewTransactionOpen} 
        onOpenChange={setIsNewTransactionOpen} 
      />
      
      <Dialog open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Add a new supplier to the system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Input id="contact" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input id="amount" type="number" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Input id="dueDate" type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supply">Supply</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="salaries">Salaries</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input id="amount" type="number" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input id="description" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ViewItemDialog 
        open={isViewDialogOpen} 
        onOpenChange={setIsViewDialogOpen}
        item={viewItem}
        type={viewItemType}
      />
    </div>
  );
}