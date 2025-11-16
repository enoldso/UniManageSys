import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Wrench, 
  Calendar, 
  GraduationCap,
  Store,
  DollarSign
} from "lucide-react";

interface AppSidebarProps {
  type: 'school' | 'seller';
  schoolName?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const schoolMenuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', title: 'Students', icon: Users },
  { id: 'inventory', title: 'Inventory', icon: Package },
  { id: 'repairs', title: 'Repairs', icon: Wrench },
];

const sellerMenuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', title: 'Inventory', icon: Package },
  { id: 'resupply', title: 'Resupply', icon: Calendar },
  { id: 'repairs', title: 'Repairs', icon: Wrench },
  { id: 'financials', title: 'Financials', icon: DollarSign },
];

export function AppSidebar({ type, schoolName, activeTab, onTabChange }: AppSidebarProps) {
  const menuItems = type === 'school' ? schoolMenuItems : sellerMenuItems;
  const Icon = type === 'school' ? GraduationCap : Store;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-4 flex items-center gap-2">
            <Icon className="h-6 w-6" />
            <div>
              <div className="font-semibold text-sm">
                {type === 'school' ? (schoolName || 'School Portal') : 'Seller Portal'}
              </div>
              <div className="text-xs text-muted-foreground">
                {type === 'school' ? 'Uniform Management' : 'Multi-School Management'}
              </div>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    data-testid={`button-nav-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
