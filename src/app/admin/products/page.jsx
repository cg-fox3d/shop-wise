
"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Package, Smartphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    price: parseFloat(data.price) || 0,
    originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
  };
};

const transformNumberPackData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    packPrice: parseFloat(data.packPrice) || 0,
    totalOriginalPrice: data.totalOriginalPrice ? parseFloat(data.totalOriginalPrice) : undefined,
    numbers: Array.isArray(data.numbers) ? data.numbers.map(num => ({
        ...num,
        price: parseFloat(num.price) || 0,
    })) : []
  };
};

export default function AdminProductsPage() {
  const [vipNumbers, setVipNumbers] = useState([]);
  const [numberPacks, setNumberPacks] = useState([]);
  const [loadingVip, setLoadingVip] = useState(true);
  const [loadingPacks, setLoadingPacks] = useState(true);

  useEffect(() => {
    setLoadingVip(true);
    const vipQuery = query(collection(db, "vipNumbers"));
    const unsubscribeVip = onSnapshot(vipQuery, (querySnapshot) => {
      const numbers = querySnapshot.docs.map(transformVipNumberData);
      setVipNumbers(numbers);
      setLoadingVip(false);
    }, (error) => {
      console.error("Error fetching VIP numbers:", error);
      setLoadingVip(false);
    });

    setLoadingPacks(true);
    const packQuery = query(collection(db, "numberPacks"));
    const unsubscribePacks = onSnapshot(packQuery, (querySnapshot) => {
      const packs = querySnapshot.docs.map(transformNumberPackData);
      setNumberPacks(packs);
      setLoadingPacks(false);
    }, (error) => {
      console.error("Error fetching number packs:", error);
      setLoadingPacks(false);
    });

    return () => {
      unsubscribeVip();
      unsubscribePacks();
    };
  }, []);

  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <Button disabled> {/* Disabled for now */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>
      <CardDescription>Manage your VIP numbers and number packs. CRUD operations are placeholders for now.</CardDescription>
      
      <Tabs defaultValue="vipNumbers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vipNumbers"><Smartphone className="mr-2 h-4 w-4"/> VIP Numbers ({loadingVip ? '...' : vipNumbers.length})</TabsTrigger>
          <TabsTrigger value="numberPacks"><Package className="mr-2 h-4 w-4"/> Number Packs ({loadingPacks ? '...' : numberPacks.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vipNumbers">
          <Card>
            <CardHeader>
              <CardTitle>VIP Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingVip ? renderSkeletons(5) : vipNumbers.length === 0 ? (
                     <TableRow><TableCell colSpan="5" className="text-center text-muted-foreground">No VIP numbers found.</TableCell></TableRow>
                  ) : (
                    vipNumbers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.number}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={item.status === 'available' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                        <TableCell>{item.categorySlug}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="numberPacks">
          <Card>
            <CardHeader>
              <CardTitle>Number Packs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pack Name</TableHead>
                    <TableHead>Numbers ({`Count`})</TableHead>
                    <TableHead>Pack Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPacks ? renderSkeletons(3) : numberPacks.length === 0 ? (
                    <TableRow><TableCell colSpan="5" className="text-center text-muted-foreground">No number packs found.</TableCell></TableRow>
                  ) : (
                    numberPacks.map((pack) => (
                      <TableRow key={pack.id}>
                        <TableCell className="font-medium">{pack.name}</TableCell>
                        <TableCell>
                            {pack.numbers?.length || 0} numbers
                            {/* <ul className="text-xs list-disc list-inside">
                                {pack.numbers?.slice(0,2).map(n => <li key={n.id || n.number}>{n.number}</li>)}
                                {pack.numbers?.length > 2 && <li>...and {pack.numbers.length - 2} more</li>}
                            </ul> */}
                        </TableCell>
                        <TableCell>${pack.packPrice?.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={pack.status === 'available' ? 'default' : 'secondary'}>{pack.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
