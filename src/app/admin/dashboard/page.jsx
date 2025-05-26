
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, ShoppingBag, Package } from 'lucide-react';

// Dummy data - replace with actual data fetching
const stats = [
  { title: "Total Revenue", value: "₹0", icon: DollarSign, description: "Placeholder data" },
  { title: "New Customers", value: "0", icon: Users, description: "Placeholder data" },
  { title: "Orders This Month", value: "0", icon: ShoppingBag, description: "Placeholder data" },
  { title: "Products in Stock", value: "0", icon: Package, description: "Placeholder data (VIP + Packs)" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Placeholder for recent activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display yet.</p>
            {/* Future: List recent orders, new product additions, etc. */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Placeholder for quick actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
                <li><a href="/admin/products" className="text-primary hover:underline">Manage Products</a></li>
                <li><a href="/admin/categories" className="text-primary hover:underline">Manage Categories</a></li>
                <li><a href="/admin/orders" className="text-primary hover:underline">View Orders</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
       <p className="text-sm text-muted-foreground">
        Note: Full functionality for CRUD operations, order management, and customer lists will be implemented in future updates.
      </p>
    </div>
  );
}
