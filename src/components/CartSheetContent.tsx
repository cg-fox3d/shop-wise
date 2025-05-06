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
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    } else if (newQuantity === 0) {
       removeFromCart(productId);
    }
  };

   const handleInputChange = (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Allow empty input temporarily, or parse the number
      if (value === '') {
        // Optionally handle the empty state, maybe set quantity to 1 or keep current?
        // For now, let's just prevent setting quantity to 0 via direct input unless intended
      } else {
        const quantity = parseInt(value, 10);
        if (!isNaN(quantity)) {
           handleQuantityChange(productId, quantity);
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
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                             type="number"
                             min="1"
                             value={item.quantity}
                             onChange={(e) => handleInputChange(item.id, e)}
                             onBlur={(e) => { // Ensure quantity is at least 1 on blur if input is cleared
                                if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                   updateQuantity(item.id, 1);
                                }
                             }}
                             className="h-6 w-12 text-center px-1"
                           />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
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

