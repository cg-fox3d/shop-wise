
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
import { Mail, Lock, User, Phone } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(50, { message: "Name must be 50 characters or less" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits" }).max(15, {message: "Phone number must be 15 digits or less"}).regex(/^\+?[1-9]\d{1,14}$/, {message: "Invalid phone number format"}),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

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
      // onLoginSuccess is called indirectly by AuthContext's login success toast,
      // or if you pass it to the login function directly
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess();
      }
      resetLogin();
    } catch (error) {
      // Toast for login failure (including email not verified) is handled in AuthContext
      // console.error("Login failed from modal:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data) => {
      setLoading(true);
      try {
        // The signup function in AuthContext now handles sending verification email
        // and no longer writes to Firestore directly from the frontend.
        await signup(data.email, data.password, data.name, data.phoneNumber);
        // Toast for verification is handled in AuthContext.
        setActiveTab("login"); 
        resetSignup(); 
        resetLogin({ email: data.email }); // Pre-fill login email
      } catch (error) {
        console.error("Signup failed from modal:", error);
        toast({
          title: "Signup Failed",
          description: error.message, // Display error message from Firebase or AuthContext
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };


  const handleOpenChange = (open) => {
    if (!open) {
      onClose(); 
      resetLogin(); 
      resetSignup();
      setActiveTab("login");
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
                         className="pl-8"
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
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                   <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      {...registerSignup("name")}
                      className="pl-8"
                   />
                </div>
                {signupErrors.name && <p className="text-xs text-destructive">{signupErrors.name.message}</p>}
              </div>
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
                <Label htmlFor="signup-phone">Phone Number</Label>
                <div className="relative">
                   <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+11234567890"
                      {...registerSignup("phoneNumber")}
                      className="pl-8"
                   />
                </div>
                {signupErrors.phoneNumber && <p className="text-xs text-destructive">{signupErrors.phoneNumber.message}</p>}
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
