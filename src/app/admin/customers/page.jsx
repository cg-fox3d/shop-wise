
"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

export default function AdminCustomersPage() {
  // Placeholder for customers data
  const customers = []; 
  const loading = false; 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers Management</h1>
        {/* Placeholder for any actions */}
      </div>
      <CardDescription>View and manage customer information. Full implementation requires integration with Firebase Auth user list and potentially a 'users' collection.</CardDescription>
      
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID/UID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan="5" className="text-center">Loading customers...</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan="5" className="text-center text-muted-foreground py-10">
                     <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    No customers found.
                    <p className="text-sm mt-1">Customer data will appear here once integrated.</p>
                </TableCell></TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.id}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.name || 'N/A'}</TableCell>
                    <TableCell>{customer.registeredDate ? new Date(customer.registeredDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled>View Details</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
