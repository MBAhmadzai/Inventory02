'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(username, password);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem signing in.',
      });
    } finally {
        setIsLoggingIn(false);
    }
  };

  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-secondary">
            <div className="flex flex-col items-center gap-2">
                <HardDrive className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>East Coast Electronics</CardTitle>
          <CardDescription>Sign in to access the Product Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="superadmin or Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">Password</Label>              
              <Input
                id="password"
                type="password"
                placeholder="superpassword or password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
