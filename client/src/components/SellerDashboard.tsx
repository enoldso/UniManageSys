import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatsCard from './StatsCard';
import InventoryView from './InventoryView';
import ResupplyScheduler from './ResupplyScheduler';
import RepairTracking from './RepairTracking';
import FinancialDashboard from './FinancialDashboard';
import { Package, Calendar, Wrench, AlertTriangle, LogOut, DollarSign, TrendingUp, CreditCard, BarChart2 } from 'lucide-react';
import type { Payment } from '@shared/schema';

interface SellerDashboardProps {
  onLogout: () => void;
}

export default function SellerDashboard({ onLogout }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState('inventory');

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = {
    totalInventory: 2450,
    scheduledDeliveries: 8,
    activeRepairs: 15,
    lowStockItems: 6,
  };

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          type="seller"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="text-lg font-semibold">Seller Portal</h2>
                <p className="text-sm text-muted-foreground">Multi-School Management</p>
              </div>
              <div className="flex-1">
                <Button
                  variant={activeTab === 'financial' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('financial')}
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Financial
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Inventory
                </Button>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {activeTab === 'financial' && <FinancialDashboard />}
            {activeTab === 'inventory' && <InventoryView type="seller" />}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground">Overview of your inventory and operations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="Total Items"
                    value={stats.totalInventory}
                    icon={Package}
                    subtitle="in stock"
                  />
                  <StatsCard
                    title="Low Stock Items"
                    value={stats.lowStockItems}
                    icon={AlertTriangle}
                    subtitle="needs attention"
                    variant={stats.lowStockItems > 0 ? 'destructive' : 'default'}
                  />
                  <StatsCard
                    title="Scheduled Deliveries"
                    value={stats.scheduledDeliveries}
                    icon={Calendar}
                    subtitle="upcoming"
                  />
                  <StatsCard
                    title="Active Repairs"
                    value={stats.activeRepairs}
                    icon={Wrench}
                    subtitle="in progress"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Status</CardTitle>
                    <CardDescription>Overview of inventory levels across all schools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">In Stock Items</div>
                        <div className="text-sm text-muted-foreground">{stats.totalInventory} items</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Low Stock Items</div>
                        <div className="text-sm text-destructive font-medium">{stats.lowStockItems} items</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Out of Stock Items</div>
                        <div className="text-sm text-muted-foreground">0 items</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === 'resupply' && <ResupplyScheduler />}
            {activeTab === 'repairs' && <RepairTracking type="seller" />}
            {activeTab === 'financials' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-3xl font-bold">Financial Dashboard</h1>
                  <p className="text-muted-foreground">Track revenue, payments, and financial performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard
                    title="Total Revenue"
                    value={`KES ${totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    subtitle="completed payments"
                  />
                  <StatsCard
                    title="Pending Payments"
                    value={`KES ${pendingRevenue.toLocaleString()}`}
                    icon={CreditCard}
                    subtitle="awaiting payment"
                  />
                  <StatsCard
                    title="Total Transactions"
                    value={payments.length}
                    icon={TrendingUp}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest payment transactions across all schools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>M-Pesa Ref</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.slice(0, 10).map((payment) => (
                            <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                              <TableCell className="font-mono text-sm">{payment.mpesaRef || payment.id}</TableCell>
                              <TableCell>{payment.studentId}</TableCell>
                              <TableCell className="font-medium">KES {payment.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline">M-Pesa</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    payment.status === 'completed' ? 'default' :
                                    payment.status === 'pending' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(payment.timestamp).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {payments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No payment transactions found.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
