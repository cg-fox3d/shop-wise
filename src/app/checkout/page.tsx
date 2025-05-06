"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createRazorpayOrder } from '@/services/razorpay'; // Assuming service exists
import { useToast } from "@/hooks/use-toast";
import Script from 'next/script';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // Store Key ID in .env.local

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const cartTotal = getCartTotal();
  const amountInPaise = Math.round(cartTotal * 100); // Razorpay expects amount in paise

  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
       toast({
          title: "Cart is empty",
          description: "Redirecting you to the home page.",
          variant: "destructive",
       });
      router.push('/');
    }
  }, [cartItems, router, toast, loading]);

  const handlePayment = async () => {
    if (!RAZORPAY_KEY_ID) {
      console.error("Razorpay Key ID is not configured.");
      toast({
        title: "Payment Error",
        description: "Payment gateway is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (!razorpayLoaded) {
        console.error("Razorpay script not loaded yet.");
        toast({
            title: "Payment Error",
            description: "Payment gateway is still loading. Please wait a moment and try again.",
            variant: "destructive",
        });
        return;
    }


    setLoading(true);

    try {
      // 1. Create Order on your backend (or using the dummy function for now)
      const order = await createRazorpayOrder({ amount: amountInPaise, currency: 'INR' }); // Use amount in paise

      if (!order || !order.id) {
         throw new Error("Failed to create Razorpay order.");
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: "INR",
        name: "ShopWave",
        description: "Test Transaction",
        image: "/logo.svg", // Optional: Replace with your logo URL
        order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        handler: function (response: any) {
          // 3. Handle Payment Success - Redirect to success page
          // console.log(response);
          // alert(response.razorpay_payment_id);
          // alert(response.razorpay_order_id);
          // alert(response.razorpay_signature);

          // Ideally, you'd verify the payment on your backend here using response details
          // For now, assume success and redirect
          router.push(`/payment/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`);
          clearCart(); // Clear cart after successful redirection setup
        },
        prefill: { // Optional
            name: "Test User",
            email: "test.user@example.com",
            contact: "9999999999"
        },
        notes: {
            address: "Razorpay Corporate Office"
        },
        theme: {
            color: "#008080" // Teal accent color
        },
        modal: {
            ondismiss: function() {
                console.log('Checkout form closed');
                toast({
                   title: "Payment Cancelled",
                   description: "You closed the payment window.",
                   variant: "destructive",
                 });
                 setLoading(false); // Re-enable button
            }
        }
      };

      // @ts-ignore // Ignore type error for Razorpay constructor
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
            console.error("Payment Failed:", response.error);
            // alert(response.error.code);
            // alert(response.error.description);
            // alert(response.error.source);
            // alert(response.error.step);
            // alert(response.error.reason);
            // alert(response.error.metadata.order_id);
            // alert(response.error.metadata.payment_id);
             toast({
               title: "Payment Failed",
               description: response.error.description || "An error occurred during payment.",
               variant: "destructive",
             });
            setLoading(false); // Re-enable button
      });
      rzp.open();

    } catch (error) {
      console.error("Payment initiation failed:", error);
       toast({
         title: "Payment Error",
         description: error instanceof Error ? error.message : "Could not initiate payment.",
         variant: "destructive",
       });
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return <div className="text-center p-8">Redirecting...</div>; // Placeholder while redirecting
  }

  return (
     <>
       {/* Load Razorpay script */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => {
            console.log('Razorpay script loaded.');
            setRazorpayLoaded(true);
          }}
           onError={(e) => {
             console.error('Failed to load Razorpay script:', e);
             toast({
                title: "Payment Error",
                description: "Could not load payment gateway. Please check your connection or contact support.",
                variant: "destructive",
             });
           }}
        />

        <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <Card>
            <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review the items in your cart before proceeding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
            </div>
            </CardContent>
            <CardFooter>
            <Button
                className="w-full"
                onClick={handlePayment}
                disabled={loading || cartItems.length === 0 || !razorpayLoaded}
            >
                {loading ? 'Processing...' : `Pay $${cartTotal.toFixed(2)} with Razorpay`}
            </Button>
            </CardFooter>
        </Card>
        </div>
     </>

  );
}
