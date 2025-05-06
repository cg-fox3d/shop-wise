"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');

  // TODO: Add verification logic here if needed by calling your backend
  // const { data, error, isLoading } = useQuery(['verifyPayment', orderId, paymentId], () => verifyPayment({ orderId, paymentId }), { enabled: !!orderId && !!paymentId });


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto bg-primary rounded-full p-3 w-fit">
               <CheckCircle className="h-10 w-10 text-primary-foreground" />
           </div>
           <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>Thank you for your purchase.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
           {orderId && <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>}
           {paymentId && <p className="text-sm text-muted-foreground">Payment ID: {paymentId}</p>}
          <p className="text-sm">Your order is being processed and you will receive a confirmation email shortly.</p>
        </CardContent>
        <CardContent>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
