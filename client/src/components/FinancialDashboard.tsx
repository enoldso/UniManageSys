import { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

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
import { format } from 'date-fns';
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
  DollarSign, TrendingUp, CreditCard, FileText, Filter, Download, Calendar as CalendarIcon, Search
} from 'lucide-react';

// Types
type Transaction = {
  id: string;
  date: Date;
  type: 'sale' | 'repair' | 'expense' | 'refund';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
};

type FinancialMetric = {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
};

// Mock data generation
const generateMockTransactions = (count: number): Transaction[] => {
  const types: Array<Transaction['type']> = ['sale', 'repair', 'expense', 'refund'];
  const statuses: Array<Transaction['status']> = ['completed', 'pending', 'failed'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `txn-${1000 + i}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    type: types[Math.floor(Math.random() * types.length)],
    description: [
      'Uniform Sale', 'Repair Service', 'Office Supplies', 'Shipping Fee',
      'Bulk Order Discount', 'Refund Processed', 'Maintenance Cost'
    ][Math.floor(Math.random() * 7)],
    amount: Math.floor(Math.random() * 10000) + 100,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`
  }));
};

const FinancialDashboard = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Generate mock data
  const mockTransactions = useMemo(() => generateMockTransactions(50), []);
  
  // Filter transactions based on filters
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [mockTransactions, searchQuery, selectedType, selectedStatus]);
  
  // Calculate financial metrics
  const financialMetrics: FinancialMetric[] = useMemo(() => {
    const totalRevenue = mockTransactions
      .filter(t => t.type === 'sale' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = mockTransactions
      .filter(t => (t.type === 'expense' || t.type === 'refund') && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingPayments = mockTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const netProfit = totalRevenue - totalExpenses;
    
    return [
      {
        label: 'Total Revenue',
        value: `KES ${totalRevenue.toLocaleString()}`,
        change: 12.5,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />
      },
      {
        label: 'Net Profit',
        value: `KES ${netProfit.toLocaleString()}`,
        change: 8.2,
        icon: <DollarSign className="h-5 w-5 text-blue-500" />
      },
      {
        label: 'Pending Payments',
        value: `KES ${pendingPayments.toLocaleString()}`,
        change: -3.2,
        icon: <CreditCard className="h-5 w-5 text-amber-500" />
      },
      {
        label: 'Total Transactions',
        value: mockTransactions.length.toString(),
        change: 5.7,
        icon: <FileText className="h-5 w-5 text-purple-500" />
      }
    ];
  }, [mockTransactions]);
  
  // Prepare chart data
  const revenueData = {
    labels: Array.from({ length: 12 }, (_, i) => 
      new Date(2023, i).toLocaleString('default', { month: 'short' })
    ),
    datasets: [
      {
        label: 'Revenue',
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10000) + 5000),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expenses',
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 5000) + 1000),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const expenseByCategory = {
    labels: ['Uniforms', 'Repairs', 'Supplies', 'Shipping', 'Other'],
    datasets: [{
      data: [45, 25, 15, 10, 5],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `KES ${value}`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Track your financial performance and transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change >= 0 ? '+' : ''}{metric.change}% from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison of revenue and expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <Line data={revenueData} options={chartOptions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <Pie data={expenseByCategory} options={chartOptions} />
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions Table */}
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(transaction.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={{
                            'bg-blue-100 text-blue-800': transaction.type === 'sale',
                            'bg-green-100 text-green-800': transaction.type === 'repair',
                            'bg-red-100 text-red-800': transaction.type === 'expense',
                            'bg-amber-100 text-amber-800': transaction.type === 'refund',
                          }[transaction.type]}
                        >
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
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
                        KES {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={{
                            'bg-green-100 text-green-800': transaction.status === 'completed',
                            'bg-amber-100 text-amber-800': transaction.status === 'pending',
                            'bg-red-100 text-red-800': transaction.status === 'failed',
                          }[transaction.status]}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">1-{Math.min(10, filteredTransactions.length)}</span> of{' '}
            <span className="font-medium">{filteredTransactions.length}</span> transactions
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
