"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});


export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'signup'

  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors }, reset: resetLogin } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignup, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors }, reset: resetSignup } = useForm({
     resolver: zodResolver(signupSchema),
   });

  const onLogin = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      onLoginSuccess(); // Call the success callback
      resetLogin(); // Reset form on success
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data) => {
      setLoading(true);
      try {
        await signup(data.email, data.password);
        toast({ title: "Signup Successful", description: "Please log in with your new account." });
        setActiveTab("login"); // Switch to login tab after successful signup
        resetSignup(); // Reset signup form
        resetLogin({ email: data.email }); // Pre-fill login email
      } catch (error) {
        console.error("Signup failed:", error);
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };


  const handleOpenChange = (open) => {
    if (!open) {
      onClose(); // Call the onClose callback when dialog closes
      resetLogin(); // Reset forms when closing
      resetSignup();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DialogHeader>
             <DialogTitle className="text-center text-2xl mb-2">{activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}</DialogTitle>
             <DialogDescription className="text-center">
               {activeTab === 'login' ? 'Enter your credentials to access your account.' : 'Sign up to start shopping.'}
             </DialogDescription>
             <TabsList className="grid w-full grid-cols-2 mt-4">
               <TabsTrigger value="login">Login</TabsTrigger>
               <TabsTrigger value="signup">Sign Up</TabsTrigger>
             </TabsList>
          </DialogHeader>

          <TabsContent value="login" className="mt-0">
             <form onSubmit={handleLoginSubmit(onLogin)} className="grid gap-4 py-4">
                <div className="grid gap-2">
                   <Label htmlFor="login-email">Email</Label>
                   <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                         id="login-email"
                         type="email"
                         placeholder="m@example.com"
                         {...registerLogin("email")}
                         className="pl-8" // Add padding for icon
                       />
                   </div>
                   {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                   <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type="password" {...registerLogin("password")} className="pl-8"/>
                    </div>
                   {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password.message}</p>}
                </div>
                <DialogFooter>
                   <Button type="submit" disabled={loading} className="w-full">
                     {loading ? 'Logging In...' : 'Login'}
                   </Button>
                </DialogFooter>
             </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-0">
            <form onSubmit={handleSignupSubmit(onSignup)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                   <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input
                      id="signup-email"
                      type="email"
                      placeholder="m@example.com"
                      {...registerSignup("email")}
                      className="pl-8"
                   />
                </div>
                {signupErrors.email && <p className="text-xs text-destructive">{signupErrors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                 <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                     <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input id="signup-password" type="password" {...registerSignup("password")} className="pl-8"/>
                   </div>
                {signupErrors.password && <p className="text-xs text-destructive">{signupErrors.password.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="confirm-password" type="password" {...registerSignup("confirmPassword")} className="pl-8"/>
                 </div>
                {signupErrors.confirmPassword && <p className="text-xs text-destructive">{signupErrors.confirmPassword.message}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
