import { useState } from 'react';
import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          type="school"
          schoolName="Greenfield Academy"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={() => console.log('Logout')}
        />
        <div className="flex-1 p-6 bg-background">
          <p>Active tab: {activeTab}</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
