
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Home, Package, Tags, ShoppingBag, Users, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Simplified admin check - replace with more robust auth in production
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@shopwave.com";

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      toast({ title: "Access Denied", description: "You are not authorized to view this page.", variant: "destructive" });
      router.push('/admin/login'); // Redirect to admin login or a general login page
    }
  }, [user, loading, router, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out Successfully" });
      router.push('/admin/login');
    } catch (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    // You can show a loading spinner or a blank page while checking auth
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Loading admin area...</p>
        </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader>
          <div className="p-4 text-center">
            <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">Admin Panel</Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/dashboard"><Home /> Dashboard</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/products"><Package /> Products</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/categories"><Tags /> Categories</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/orders"><ShoppingBag /> Orders</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/customers"><Users /> Customers</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* Add more admin links here */}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="p-2">
                 <SidebarMenuButton onClick={handleLogout}>
                    <LogOut /> Logout
                </SidebarMenuButton>
                <SidebarMenuButton asChild className="mt-2">
                    <Link href="/"><Home /> Go to Shop</Link>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40 ml-0 md:ml-[var(--sidebar-width)] transition-[margin-left] duration-300 ease-in-out group-data-[state=collapsed]/sidebar-wrapper:md:ml-[var(--sidebar-width-icon)]">
         <div className="flex items-center justify-between mb-4">
            <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile */}
            {/* You can add a page title component here if needed */}
         </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
