"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createRazorpayOrder } from '@/services/razorpay';
import { useToast } from "@/hooks/use-toast";
import Script from 'next/script';
import LoginModal from '@/components/LoginModal';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const cartTotal = getCartTotal();
  const amountInPaise = Math.round(cartTotal * 100);

  useEffect(() => {
    // Redirect if cart is empty (unless payment is processing)
    if (cartItems.length === 0 && !loading) {
      toast({
        title: "Cart is empty",
        description: "Redirecting you to the home page.",
        variant: "destructive",
      });
      router.push('/');
    }

    // Prompt login if not authenticated and not loading auth state
    if (!authLoading && !user && cartItems.length > 0) {
      setIsLoginModalOpen(true);
    } else {
      setIsLoginModalOpen(false); // Close modal if user logs in elsewhere
    }

  }, [cartItems, router, toast, loading, user, authLoading]);

   const handleLoginSuccess = () => {
      setIsLoginModalOpen(false);
      toast({ title: "Login Successful", description: "You can now proceed to checkout." });
   };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with the payment.",
        variant: "destructive",
      });
      setIsLoginModalOpen(true);
      return;
    }

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
      const order = await createRazorpayOrder({ amount: amountInPaise, currency: 'INR' });

      if (!order || !order.id) {
        throw new Error("Failed to create Razorpay order.");
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "ShopWave",
        description: "Test Transaction",
        image: "/logo.svg",
        order_id: order.id,
        handler: function (response) {
          router.push(`/payment/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`);
          clearCart();
        },
        prefill: {
          name: user.displayName || "Test User",
          email: user.email || "test.user@example.com",
          contact: "9999999999"
        },
        notes: {
          address: "Razorpay Corporate Office"
        },
        theme: {
          color: "#008080"
        },
        modal: {
          ondismiss: function () {
            console.log('Checkout form closed');
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window.",
              variant: "destructive",
            });
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error("Payment Failed:", response.error);
        toast({
          title: "Payment Failed",
          description: response.error.description || "An error occurred during payment.",
          variant: "destructive",
        });
        setLoading(false);
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

  if (cartItems.length === 0 || (authLoading && cartItems.length > 0)) {
    return <div className="text-center p-8">Loading checkout...</div>;
  }


  return (
    <>
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
              disabled={loading || cartItems.length === 0 || !razorpayLoaded || !user}
            >
              {loading ? 'Processing...' : `Pay $${cartTotal.toFixed(2)} with Razorpay`}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}
