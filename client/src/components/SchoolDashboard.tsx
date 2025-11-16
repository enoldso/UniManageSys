import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import StatsCard from "./StatsCard";
import StudentManagement from "./StudentManagement";
import InventoryView from "./InventoryView";
import RepairTracking from "./RepairTracking";
import { Users, ShoppingBag, DollarSign, AlertCircle, LogOut } from 'lucide-react';

interface SchoolDashboardProps {
  schoolId: string;
  schoolName: string;
  onLogout: () => void;
}

export default function SchoolDashboard({ schoolId, schoolName, onLogout }: SchoolDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // TODO: Replace with real data from API
  const stats = {
    totalStudents: 1234,
    uniformsIssued: 1180,
    pendingPayments: 54,
    repairRequests: 12,
  };

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          type="school"
          schoolName={schoolName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="text-lg font-semibold">{schoolName}</h2>
                <p className="text-sm text-muted-foreground">School Portal</p>
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
            {activeTab === 'dashboard' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground">Overview of your school's uniform management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                  />
                  <StatsCard
                    title="Uniforms Issued"
                    value={stats.uniformsIssued}
                    icon={ShoppingBag}
                  />
                  <StatsCard
                    title="Pending Payments"
                    value={stats.pendingPayments}
                    icon={DollarSign}
                  />
                  <StatsCard
                    title="Repair Requests"
                    value={stats.repairRequests}
                    icon={AlertCircle}
                  />
                </div>
              </div>
            )}

            {activeTab === 'students' && <StudentManagement schoolId={schoolId} />}
            {activeTab === 'inventory' && <InventoryView type="school" schoolId={schoolId} />}
            {activeTab === 'repairs' && <RepairTracking type="school" schoolId={schoolId} />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
