
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@shopwave.com";

export default function AdminLoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user && user.email === ADMIN_EMAIL) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const onLogin = async (data) => {
    setLoading(true);
    if (data.email !== ADMIN_EMAIL) {
      toast({
        title: "Login Failed",
        description: "This email is not authorized for admin access.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    try {
      await login(data.email, data.password);
      // Auth context useEffect will handle redirect if login is successful for admin
      toast({ title: "Admin Login Successful" });
      router.push('/admin/dashboard'); 
      reset();
    } catch (error) {
      console.error("Admin login failed:", error);
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  // If user is already logged in as admin, they should be redirected by useEffect.
  // This form is primarily for users who are not logged in or not admin.

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onLogin)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@shopwave.com"
                  {...register("email")}
                  className="pl-8"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" {...register("password")} className="pl-8" />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={loading || authLoading} className="w-full mt-2">
              {loading ? 'Logging In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground">
            <p>If you are not an admin, please visit the <Link href="/" className="text-primary hover:underline">main store</Link>.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
