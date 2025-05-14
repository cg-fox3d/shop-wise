
"use client";

import React from 'react';
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

  const handleDecrement = (item) => {
    removeFromCart(item.id);
  };

  const handleIncrement = (item) => {
    // Quantity is fixed at 1, so increment does nothing or is disabled.
    updateQuantity(item.id, 1);
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
          <ScrollArea className="flex-1">
             <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base text-foreground flex-grow pr-2">
                        {item.number || item.name} {/* Display number or name */}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0 -mr-2"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-primary font-medium">${item.price.toFixed(2)}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="ml-2 line-through text-muted-foreground">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDecrement(item)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                           type="number"
                           min="1"
                           max="1" 
                           value={item.quantity}
                           readOnly
                           className="h-6 w-10 text-center px-1"
                         />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleIncrement(item)}
                          disabled={true} // Max quantity is 1
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="mt-auto px-6 sm:flex-col sm:space-y-4 sm:items-stretch">
             <div className="flex justify-between items-center font-medium py-4">
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
