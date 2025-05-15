
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
import { Package } from 'lucide-react';

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
    if (cartItems.length === 0 && !loading) {
      toast({
        title: "Cart is empty",
        description: "Redirecting you to the home page.",
        variant: "destructive",
      });
      router.push('/');
    }

    if (!authLoading && !user && cartItems.length > 0) {
      setIsLoginModalOpen(true);
    } else {
      setIsLoginModalOpen(false);
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
      // Prepare item names for description
      const itemNames = cartItems.map(item => item.type === 'pack' ? item.name : item.number).join(', ');
      const transactionDescription = `Purchase of ${itemNames}`;


      const order = await createRazorpayOrder({ 
        amount: amountInPaise, 
        currency: 'INR',
        receipt: `receipt_user_${user.uid}_${Date.now()}`, // Example receipt
        notes: { 
          userId: user.uid, 
          email: user.email,
          itemCount: cartItems.length,
          itemDetails: itemNames // Could be more detailed if needed
        } 
      });

      if (!order || !order.id) {
        throw new Error("Failed to create Razorpay order.");
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "ShopWave VIP Numbers",
        description: transactionDescription.substring(0, 250), // Max length for description
        image: "/logo.svg", // Make sure you have a logo.svg in public folder
        order_id: order.id,
        handler: function (response) {
          // Here, you would typically verify the payment on your backend
          // For now, we directly go to success page
          router.push(`/payment/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`);
          clearCart(); // Clear cart after successful redirection
        },
        prefill: {
          name: user.displayName || "VIP Customer",
          email: user.email,
          contact: user.phoneNumber || "" // Add phone number if available
        },
        notes: {
          address: "Online Purchase" // Or any other relevant note
        },
        theme: {
          color: "#008080" // Your primary theme color
        },
        modal: {
          ondismiss: function () {
            console.log('Checkout form closed');
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window.",
              variant: "destructive", // Or "default"
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
        // Optionally, redirect to a payment failure page
        // router.push(`/payment/failure?orderId=${order.id}&code=${response.error.code}&reason=${response.error.reason}`);
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
            {cartItems.map((item) => {
              const isPack = item.type === 'pack';
              const name = isPack ? item.name : item.number;
              const price = isPack ? item.packPrice : item.price;
              const quantity = item.quantity || 1;

              return (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium flex items-center">
                      {isPack && <Package size={16} className="mr-2 text-muted-foreground" />}
                      {name}
                    </p>
                    {isPack && item.numbers && (
                        <ul className="text-xs text-muted-foreground list-disc list-inside pl-5">
                            {item.numbers.slice(0,3).map((num, idx) => <li key={idx} className="truncate">{num.number}</li>)}
                            {item.numbers.length > 3 && <li className="text-xs text-muted-foreground">...and {item.numbers.length - 3} more</li>}
                        </ul>
                    )}
                    <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                  </div>
                  <p className="font-medium">${(price * quantity).toFixed(2)}</p>
                </div>
              );
            })}
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
              disabled={loading || cartItems.length === 0 || !razorpayLoaded || !user || !RAZORPAY_KEY_ID}
            >
              {loading ? 'Processing...' : `Pay $${cartTotal.toFixed(2)} with Razorpay`}
            </Button>
          </CardFooter>
        </Card>
        {!RAZORPAY_KEY_ID && (
            <p className="text-center text-destructive text-sm mt-4">Razorpay payment gateway is not configured.</p>
        )}
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}
