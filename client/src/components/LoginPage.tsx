import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Store } from 'lucide-react';

interface LoginPageProps {
  onLogin: (type: 'school' | 'seller', credentials: { code: string; password: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [sellerUsername, setSellerUsername] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');

  const handleSchoolLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('School login:', { code: schoolCode, password: schoolPassword });
    onLogin('school', { code: schoolCode, password: schoolPassword });
  };

  const handleSellerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Seller login:', { code: sellerUsername, password: sellerPassword });
    onLogin('seller', { code: sellerUsername, password: sellerPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Uniform Management System</h1>
          <p className="text-muted-foreground mt-2">Manage school uniforms efficiently</p>
        </div>

        <Tabs defaultValue="school" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="school" data-testid="tab-school-login">
              <GraduationCap className="h-4 w-4 mr-2" />
              School
            </TabsTrigger>
            <TabsTrigger value="seller" data-testid="tab-seller-login">
              <Store className="h-4 w-4 mr-2" />
              Seller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle>School Login</CardTitle>
                <CardDescription>Access your school's uniform management portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSchoolLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-code">School Code</Label>
                    <Input
                      id="school-code"
                      type="text"
                      placeholder="e.g., SCH001"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      data-testid="input-school-code"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-password">Password</Label>
                    <Input
                      id="school-password"
                      type="password"
                      value={schoolPassword}
                      onChange={(e) => setSchoolPassword(e.target.value)}
                      data-testid="input-school-password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-school-login">
                    Login to School Portal
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller">
            <Card>
              <CardHeader>
                <CardTitle>Seller Login</CardTitle>
                <CardDescription>Access seller dashboard for inventory management</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSellerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-username">Username</Label>
                    <Input
                      id="seller-username"
                      type="text"
                      placeholder="seller"
                      value={sellerUsername}
                      onChange={(e) => setSellerUsername(e.target.value)}
                      data-testid="input-seller-username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Password</Label>
                    <Input
                      id="seller-password"
                      type="password"
                      value={sellerPassword}
                      onChange={(e) => setSellerPassword(e.target.value)}
                      data-testid="input-seller-password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-seller-login">
                    Login to Seller Portal
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-md text-sm">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <p className="text-muted-foreground">School: SCH001 / password123</p>
          <p className="text-muted-foreground">Seller: seller / seller123</p>
        </div>
      </div>
    </div>
  );
}
