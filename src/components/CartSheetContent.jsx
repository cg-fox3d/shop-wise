"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { X, Minus, Plus } from 'lucide-react';
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";


export default function CartSheetContent() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart, addToCart } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      // If product is already in cart, its quantity is always 1.
      // So, if newQuantity > 1, it means user clicked '+', but we don't allow > 1.
      // If newQuantity is 1, we update.
      const existingItem = cartItems.find(item => item.id === productId);
      if (existingItem && newQuantity > 1) {
        // Do nothing or show a toast message that quantity is limited to 1
        return;
      }
      updateQuantity(productId, 1); // Always update to 1 or keep as 1
    } else if (newQuantity === 0) {
      removeFromCart(productId);
    }
  };

  const handleIncrement = (item) => {
    // Since we only allow 1 of each item, incrementing effectively does nothing if item is already there.
    // This button could be disabled or removed if item.quantity is 1.
    // For now, it will just try to update to quantity 1 again.
    updateQuantity(item.id, 1);
  };

  const handleDecrement = (item) => {
    // Decrementing will remove the item as quantity becomes 0
    removeFromCart(item.id);
  };


   const handleInputChange = (productId, event) => {
      const value = event.target.value;
      if (value === '') {
        // User cleared input, do nothing until blur or valid number
      } else {
        const quantity = parseInt(value, 10);
        if (!isNaN(quantity)) {
           // Enforce quantity of 1, or remove if 0
           if (quantity <= 0) {
             removeFromCart(productId);
           } else {
             updateQuantity(productId, 1);
           }
        }
      }
    };

  const cartTotal = getCartTotal();

  return (
    <>
      <SheetHeader>
        <SheetTitle>Shopping Cart</SheetTitle>
      </SheetHeader>
      <Separator />
      {cartItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <SheetClose asChild>
             <Button variant="link" asChild className="mt-4">
                <Link href="/">Start Shopping</Link>
             </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 -mx-6">
             <div className="px-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                       <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          data-ai-hint={item.imageHint}
                        />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                       </div>
                       <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDecrement(item)}
                            // Disabled because decrementing always removes if quantity is 1
                            // disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                             type="number"
                             min="1"
                             max="1" // Max quantity is 1
                             value={item.quantity} // Always 1 if item is in cart
                             readOnly // Input is read-only as quantity is fixed at 1
                             className="h-6 w-12 text-center px-1"
                           />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleIncrement(item)}
                            disabled={true} // Disable increment button as max quantity is 1
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>

          </ScrollArea>
          <Separator />
          <SheetFooter className="mt-auto sm:flex-col sm:space-y-4 sm:items-stretch">
             <div className="flex justify-between items-center font-medium">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
             </div>
             <Button variant="outline" onClick={clearCart} className="w-full">Clear Cart</Button>
             <SheetClose asChild>
               <Button asChild className="w-full">
                  <Link href="/checkout">Proceed to Checkout</Link>
               </Button>
            </SheetClose>
          </SheetFooter>
        </>
      )}
    </>
  );
}
