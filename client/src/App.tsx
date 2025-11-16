import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/components/LoginPage";
import SchoolDashboard from "@/components/SchoolDashboard";
import SellerDashboard from "@/components/SellerDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const [userType, setUserType] = useState<'school' | 'seller' | null>(null);
  const [schoolId, setSchoolId] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');

  const handleLogin = (type: 'school' | 'seller', credentials: { code: string; password: string }) => {
    // TODO: Replace with actual authentication
    console.log('Login attempt:', type, credentials);
    
    // Mock authentication - accept demo credentials
    if (type === 'school' && credentials.code === 'SCH001' && credentials.password === 'password123') {
      setUserType('school');
      setSchoolId('SCH001');
      setSchoolName('Greenfield Academy');
    } else if (type === 'seller' && credentials.code === 'seller' && credentials.password === 'seller123') {
      setUserType('seller');
    } else {
      alert('Invalid credentials. Please use demo credentials.');
    }
  };

  const handleLogout = () => {
    setUserType(null);
    setSchoolId('');
    setSchoolName('');
  };

  return (
    <Switch>
      <Route path="/">
        {!userType ? (
          <LoginPage onLogin={handleLogin} />
        ) : userType === 'school' ? (
          <SchoolDashboard schoolId={schoolId} schoolName={schoolName} onLogout={handleLogout} />
        ) : (
          <SellerDashboard onLogout={handleLogout} />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
